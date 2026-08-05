/**
 * Data Management Routes
 * =======================
 * 
 * SRS Reference: FR-023 (Data Management)
 * 
 * REST API endpoints for data backup, restore, export, validation, and
 * integrity checking. Centralized module for all data operations.
 * 
 * Endpoints Summary (7 endpoints):
 * 
 *   POST /api/data/backup              - Create backup
 *   GET  /api/data/backups             - List backups
 *   POST /api/data/backup/restore/:fn  - Restore from backup
 *   DELETE /api/data/backup/:filename  - Delete backup
 *   GET  /api/data/export/:type        - Export data (JSON/CSV)
 *   POST /api/data/validate            - Validate data against rules
 *   GET  /api/data/validate/integrity  - Check referential integrity
 *   GET  /api/data/stats               - Database statistics
 * 
 * Design Principles:
 *   - Farm Manager only (all endpoints)
 *   - Backup/restore with manifest tracking
 *   - Export supports JSON and CSV formats
 *   - Validation uses rule-based engine
 *   - Integrity checks for orphaned references
 * 
 * FR-023 Requirements Covered:
 *   1. Perform regular data backups
 *   2. Support data export for external systems
 *   3. Implement data validation rules
 *   4. Maintain data integrity constraints
 *   5. Support data migration between environments (backup/restore)
 *   6. Implement data archiving for historical records (via cleanup)
 */

const express = require('express');
const router = express.Router();
const dataService = require('../services/DataService');
const { protect, authorize } = require('../middleware/auth');

// =========================================================================
// BACKUP MANAGEMENT (FR-023.1, FR-023.5)
// =========================================================================

/**
 * POST /api/data/backup
 * Create a new backup of all database collections.
 * 
 * SRS: FR-023.1 - Perform regular data backups
 * SRS: FR-023.5 - Support data migration between environments
 * Access: Farm Manager only
 * 
 * Backup includes:
 *   - All database collections
 *   - Metadata (description, type, timestamp, size)
 *   - Manifest file for restore
 * 
 * @param {string} [description] - Backup description
 * @param {string} [type] - Backup type (manual, scheduled, pre-migration)
 * @returns {Object} Backup manifest with filename and metadata
 */
router.post('/backup', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const manifest = await dataService.createBackup(req.body.description, req.body.type, req.user._id);
    res.json({ success: true, data: manifest });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * GET /api/data/backups
 * List all available backups.
 * 
 * SRS: FR-023.1 - View backup history
 * Access: Farm Manager only
 * 
 * @returns {Array} Backup manifests sorted by date
 */
router.get('/backups', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const backups = await dataService.getBackups();
    res.json({ success: true, data: backups });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * POST /api/data/backup/restore/:filename
 * Restore the database from a backup file.
 * 
 * SRS: FR-023.5 - Support data migration between environments
 * Access: Farm Manager only
 * 
 * Process:
 *   1. Locate backup file by filename
 *   2. Validate backup integrity
 *   3. Restore all collections from backup
 *   4. Return restored record counts
 * 
 * Security: Path traversal prevention on filename parameter.
 * 
 * @param {string} filename - Backup filename
 * @returns {Object} Restore result with record counts
 */
router.post('/backup/restore/:filename', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const result = await dataService.restoreBackup(req.params.filename);
    res.json({ success: true, data: result });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 :
                       error.message.includes('Invalid') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message || 'Server error' });
  }
});

/**
 * DELETE /api/data/backup/:filename
 * Delete a backup file.
 * 
 * SRS: FR-023.1 - Manage backups
 * Access: Farm Manager only
 * 
 * @param {string} filename - Backup filename to delete
 * @returns {Object} Success message
 */
router.delete('/backup/:filename', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    await dataService.deleteBackup(req.params.filename);
    res.json({ success: true, message: 'Backup deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// =========================================================================
// DATA EXPORT (FR-023.2)
// =========================================================================

/**
 * GET /api/data/export/:type
 * Export data in JSON or CSV format.
 * 
 * SRS: FR-023.2 - Support data export for external systems
 * Access: Farm Manager only
 * 
 * Export types:
 *   - users: User accounts (excludes passwords)
 *   - orders: Order history
 *   - inventory: Inventory records
 *   - production: Production batches
 *   - harvest: Harvest records
 *   - payments: Payment records
 * 
 * Format:
 *   - JSON: Standard JSON with success flag
 *   - CSV: Headers + rows, proper escaping of special characters
 * 
 * Security:
 *   - Passwords excluded from user export
 *   - Content-Disposition header for download
 * 
 * @param {string} type - Data type to export
 * @param {string} [format=json] - Export format (json or csv)
 * @returns {File} Export file (JSON or CSV)
 */
router.get('/export/:type', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const { type } = req.params;
    const format = req.query.format || 'json';
    const result = await dataService.exportData(type, format);

    if (format === 'csv') {
      let csv = '';
      const items = Array.isArray(result.data) ? result.data : Object.values(result.data).flat();
      if (items.length > 0) {
        const headers = Object.keys(items[0]).filter(k => k !== 'password' && k !== '_id');
        csv = headers.join(',') + '\n';
        items.forEach(item => {
          csv += headers.map(h => {
            const val = item[h];
            if (val === null || val === undefined) return '""';
            if (typeof val === 'object') return `"${String(JSON.stringify(val)).replace(/"/g, '""')}"`;
            return `"${String(val).replace(/"/g, '""')}"`;
          }).join(',') + '\n';
        });
      }
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=bohloko-${type}-export.csv`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=bohloko-${type}-export.json`);
      res.json({ success: true, data: result.data });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Server error' });
  }
});

// =========================================================================
// DATA VALIDATION (FR-023.3, FR-023.4)
// =========================================================================

/**
 * POST /api/data/validate
 * Validate data against predefined rules for a collection.
 * 
 * SRS: FR-023.3 - Implement data validation rules
 * Access: Farm Manager only
 * 
 * Supported Collections & Rules:
 *   - users:
 *     - email: Required, valid email format
 *     - firstName: Required
 *     - lastName: Required
 *     - password: Required, min 8 characters
 *   - orders:
 *     - customer: Required
 *     - items: Required
 *     - total: Required, number, min 0
 *   - inventory:
 *     - productType: Required
 *     - quantity: Required, number, min 0
 *     - harvestDate: Required, valid date
 *     - expiryDate: Required, valid date
 * 
 * @param {string} collection - Collection name
 * @param {Object} data - Data to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
router.post('/validate', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const { collection, data } = req.body;
    const validationRules = {
      users: { email: { required: true, type: 'email' }, firstName: { required: true }, lastName: { required: true }, password: { required: true, min: 8 } },
      orders: { customer: { required: true }, items: { required: true }, total: { required: true, type: 'number', min: 0 } },
      inventory: { productType: { required: true }, quantity: { required: true, type: 'number', min: 0 }, harvestDate: { required: true, type: 'date' }, expiryDate: { required: true, type: 'date' } }
    };
    const rules = validationRules[collection];
    if (!rules) return res.status(400).json({ success: false, message: 'No validation rules for collection' });

    const errors = [];
    for (const [field, rule] of Object.entries(rules)) {
      if (rule.required && (!data[field] || data[field] === '')) errors.push(`${field} is required`);
      if (rule.type && data[field] !== undefined) {
        if (rule.type === 'email' && !/^\S+@\S+\.\S+$/.test(data[field])) errors.push(`${field} must be a valid email`);
        if (rule.type === 'number' && isNaN(data[field])) errors.push(`${field} must be a number`);
        if (rule.type === 'date' && isNaN(Date.parse(data[field]))) errors.push(`${field} must be a valid date`);
      }
      if (rule.min !== undefined && data[field] < rule.min) errors.push(`${field} must be at least ${rule.min}`);
    }
    res.json({ success: true, data: { valid: errors.length === 0, errors } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * GET /api/data/validate/integrity
 * Check referential integrity across collections.
 * 
 * SRS: FR-023.4 - Maintain data integrity constraints
 * Access: Farm Manager only
 * 
 * Checks Performed:
 *   1. Orders with non-existent customer references (orphaned references)
 *   2. Inventory with negative quantities (invalid data)
 * 
 * Returns:
 *   - issues: Array of integrity violations
 *   - checked: Timestamp of check
 *   - passed: Boolean (true if no issues found)
 * 
 * @returns {Object} Integrity check results
 */
router.get('/validate/integrity', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const issues = [];
    const db = require('../config/db');
    const orders = await db.orders.find({});
    const inventory = await db.inventory.find({});
    const users = await db.users.find({});

    orders.forEach(order => {
      if (order.customer && !users.find(u => u._id.toString() === order.customer.toString())) {
        issues.push({ type: 'orphaned_reference', collection: 'orders', id: order._id, field: 'customer', message: 'Order references non-existent customer' });
      }
    });

    inventory.forEach(item => {
      if (item.quantity < 0) {
        issues.push({ type: 'invalid_data', collection: 'inventory', id: item._id, field: 'quantity', message: 'Negative quantity' });
      }
    });

    res.json({ success: true, data: { issues, checked: new Date(), passed: issues.length === 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// =========================================================================
// DATABASE STATISTICS
// =========================================================================

/**
 * GET /api/data/stats
 * Get database statistics for all collections.
 * 
 * Access: Farm Manager only
 * 
 * @returns {Object} Record counts per collection
 */
router.get('/stats', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const stats = await dataService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;