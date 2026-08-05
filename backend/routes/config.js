/**
 * System Configuration Routes
 * ============================
 * 
 * SRS Reference: FR-022 (System Configuration)
 * 
 * REST API endpoints for managing system-wide business rules and settings.
 * Centralized configuration for tax rates, shipping costs, bulk discounts,
 * security policies, and business hours.
 * 
 * Endpoints Summary (3 endpoints):
 * 
 *   GET  /api/config           - Get all configuration values
 *   PUT  /api/config           - Update configuration (bulk)
 *   GET  /api/config/:key      - Get single config value by key
 * 
 * Design Principles:
 *   - Farm Manager only (all endpoints)
 *   - Key-value store: each config is a separate key
 *   - Whitelist-based: only ALLOWED_KEYS can be updated
 *   - Defaults initialized on first run
 * 
 * FR-022 Requirements Covered:
 *   1. Configure pricing rules and discounts
 *   3. Define user roles and permissions (session, lockout policies)
 *   5. Set up tax rates and shipping costs
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const configService = require('../services/ConfigService');
const { protect, authorize } = require('../middleware/auth');

/**
 * GET /api/config
 * Retrieve all system configuration values as a key-value object.
 * 
 * SRS: FR-022 - View system configuration
 * Access: Farm Manager only
 * 
 * Response format:
 *   {
 *     taxRate: 15,
 *     shippingLocal: 50,
 *     currency: "ZAR",
 *     ...
 *   }
 * 
 * @returns {Object} All config key-value pairs
 */
router.get('/', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const config = await configService.getAll();
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * PUT /api/config
 * Update multiple configuration values in bulk.
 * 
 * SRS: FR-022 - Configure pricing rules, tax rates, shipping costs
 * Access: Farm Manager only
 * 
 * Validates:
 *   - taxRate: Optional, 0-100 (percentage)
 *   - shippingLocal: Optional, >= 0 (shipping cost)
 *   - lowStockThreshold: Optional, >= 1 (inventory alert threshold)
 * 
 * Whitelist Protection: Only pre-approved keys are accepted.
 * Attempting to set unapproved keys silently filters them out.
 * 
 * Allowed Keys:
 *   - Pricing: taxRate, bulkDiscount5/10/15, bulkThreshold1/2/3
 *   - Shipping: shippingLocal, shippingThreshold
 *   - Inventory: lowStockThreshold
 *   - Currency: currency, currencySymbol
 *   - Business: businessHours
 *   - Security: sessionTimeout, maxLoginAttempts, lockDuration,
 *               passwordMinLength, requireSpecialChar, requireUppercase, requireNumber
 * 
 * @param {number} taxRate - Tax rate percentage (0-100)
 * @param {number} shippingLocal - Local shipping cost
 * @param {number} lowStockThreshold - Low stock alert threshold
 * @returns {Object} Updated configuration values
 */
router.put('/', protect, authorize('Farm Manager'), [
  body('taxRate').optional().isFloat({ min: 0, max: 100 }),
  body('shippingLocal').optional().isFloat({ min: 0 }),
  body('lowStockThreshold').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const config = await configService.update(req.body, req.user._id);
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Server error' });
  }
});

/**
 * GET /api/config/:key
 * Retrieve a single configuration value by key.
 * 
 * SRS: FR-022 - View specific configuration setting
 * Access: Farm Manager only
 * 
 * @param {string} key - Configuration key (e.g., 'taxRate')
 * @returns {Object} { key, value } or 404 if not found
 */
router.get('/:key', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const value = await configService.get(req.params.key);
    if (value === null) {
      return res.status(404).json({ success: false, message: 'Config not found' });
    }
    res.json({ success: true, data: { key: req.params.key, value } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;