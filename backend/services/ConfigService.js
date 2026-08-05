/**
 * Config Service
 * ==============
 * 
 * SRS Reference: FR-022 (System Configuration)
 * 
 * Business logic for system-wide configuration management. Implements a
 * key-value store backed by NeDB for persisting business rules.
 * 
 * Responsibilities:
 *   - CRUD operations on system configuration
 *   - Whitelist-based update protection (only approved keys)
 *   - Default configuration initialization
 *   - Atomic bulk updates
 * 
 * Architecture:
 *   - Key-Value Pattern: Each setting stored as a separate document
 *   - Whitelist Guard: update() only accepts pre-approved keys
 *   - Singleton Pattern: Exported as a single instance
 * 
 * Data Store: systemConfig.db (via BaseRepository)
 * 
 * FR-022 Coverage:
 *   1. Configure pricing rules and discounts
 *   2. Set inventory thresholds and alerts
 *   5. Set up tax rates and shipping costs
 */

const BaseRepository = require('../repositories/BaseRepository');
const db = require('../config/db');
const { ALLOWED_KEYS } = require('../config/constants');

class ConfigService {
  /**
   * Initialize the repository for system configuration.
   */
  constructor() {
    this.repo = new BaseRepository(db.systemConfig);
  }

  /**
   * Get all configuration values as a key-value object.
   * 
   * @returns {Object} Key-value pairs of all configuration
   *   e.g., { taxRate: 15, shippingLocal: 50, currency: "ZAR" }
   */
  async getAll() {
    const configs = await this.repo.find({});
    const result = {};
    configs.forEach(c => { result[c.key] = c.value; });
    return result;
  }

  /**
   * Get a single configuration value by key.
   * 
   * @param {string} key - Configuration key
   * @returns {*} Value or null if not found
   */
  async get(key) {
    const config = await this.repo.findOne({ key });
    return config ? config.value : null;
  }

  /**
   * Set a single configuration value (create or update).
   * 
   * Process:
   *   1. Check if key exists
   *   2. If exists: update with $set operator
   *   3. If not: insert new document with UUID
   * 
   * @param {string} key - Configuration key
   * @param {*} value - Configuration value
   * @param {string} [updatedBy] - User ID who made the update
   */
  async set(key, value, updatedBy) {
    const existing = await this.repo.findOne({ key });
    if (existing) {
      await this.repo.collection.update({ key }, { $set: { value, updatedAt: new Date(), updatedBy } });
    } else {
      await this.repo.collection.insert({ _id: require('uuid').v4(), key, value, createdAt: new Date(), updatedAt: new Date(), updatedBy });
    }
  }

  /**
   * Update multiple configuration values (whitelist-protected).
   * 
   * Whitelist Protection: Only keys in the ALLOWED array are processed.
   * Attempting to set unapproved keys silently filters them out.
   * 
   * Allowed Keys (19 total):
   *   Pricing:    taxRate, bulkDiscount5/10/15, bulkThreshold1/2/3
   *   Shipping:   shippingLocal, shippingThreshold
   *   Inventory:  lowStockThreshold
   *   Currency:   currency, currencySymbol
   *   Business:   businessHours
   *   Security:   sessionTimeout, maxLoginAttempts, lockDuration,
   *               passwordMinLength, requireSpecialChar, requireUppercase, requireNumber
   * 
   * @param {Object} updates - Key-value pairs to update
   * @param {string} updatedBy - User ID who made the update
   * @returns {Object} All configuration values after update
   * @throws {Error} If no valid keys provided
   */
  async update(updates, updatedBy) {
    const ALLOWED = [
      'taxRate', 'shippingLocal', 'shippingThreshold', 'lowStockThreshold',
      'bulkDiscount5', 'bulkDiscount10', 'bulkDiscount15',
      'bulkThreshold1', 'bulkThreshold2', 'bulkThreshold3',
      'currency', 'currencySymbol', 'businessHours',
      'sessionTimeout', 'maxLoginAttempts', 'lockDuration',
      'passwordMinLength', 'requireSpecialChar', 'requireUppercase', 'requireNumber'
    ];

    const filtered = {};
    for (const [key, value] of Object.entries(updates)) {
      if (ALLOWED.includes(key)) filtered[key] = value;
    }

    if (Object.keys(filtered).length === 0) throw new Error('No valid config keys provided');

    for (const [key, value] of Object.entries(filtered)) {
      await this.set(key, value, updatedBy);
    }
    return await this.getAll();
  }

  /**
   * Initialize default configuration values (idempotent).
   * 
   * SRS: FR-022 - System defaults
   * 
   * Only creates keys that don't already exist (safe for repeated calls).
   * Called during server startup to ensure required config exists.
   * 
   * Default Values:
   *   - taxRate: 15 (15% VAT - South Africa)
   *   - shippingLocal: R50
   *   - shippingThreshold: R1000 (free shipping above this)
   *   - lowStockThreshold: 10 units
   *   - bulkDiscount5: 5% for 100+ units
   *   - bulkDiscount10: 10% for 500+ units
   *   - bulkDiscount15: 15% for 1000+ units
   *   - currency: ZAR, currencySymbol: R
   *   - businessHours: 06:00-22:00
   *   - sessionTimeout: 30 minutes
   *   - maxLoginAttempts: 5
   *   - lockDuration: 30 minutes
   *   - passwordMinLength: 8
   *   - requireSpecialChar/requireUppercase/requireNumber: true
   */
  async initDefaults() {
    const defaults = {
      taxRate: 15, shippingLocal: 50, shippingThreshold: 1000, lowStockThreshold: 10,
      bulkDiscount5: 5, bulkDiscount10: 10, bulkDiscount15: 15,
      bulkThreshold1: 100, bulkThreshold2: 500, bulkThreshold3: 1000,
      currency: 'ZAR', currencySymbol: 'R',
      businessHours: { open: '06:00', close: '22:00' },
      sessionTimeout: 30, maxLoginAttempts: 5, lockDuration: 30,
      passwordMinLength: 8, requireSpecialChar: true, requireUppercase: true, requireNumber: true
    };

    for (const [key, value] of Object.entries(defaults)) {
      const existing = await this.get(key);
      if (existing === null) await this.set(key, value);
    }
  }
}

module.exports = new ConfigService();