const BaseRepository = require('../repositories/BaseRepository');
const db = require('../config/db');
const { ALLOWED_KEYS } = require('../config/constants');

class ConfigService {
  constructor() {
    this.repo = new BaseRepository(db.systemConfig);
  }

  async getAll() {
    const configs = await this.repo.find({});
    const result = {};
    configs.forEach(c => { result[c.key] = c.value; });
    return result;
  }

  async get(key) {
    const config = await this.repo.findOne({ key });
    return config ? config.value : null;
  }

  async set(key, value, updatedBy) {
    const existing = await this.repo.findOne({ key });
    if (existing) {
      await this.repo.collection.update({ key }, { $set: { value, updatedAt: new Date(), updatedBy } });
    } else {
      await this.repo.collection.insert({ _id: require('uuid').v4(), key, value, createdAt: new Date(), updatedAt: new Date(), updatedBy });
    }
  }

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
