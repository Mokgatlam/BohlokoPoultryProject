const express = require('express');
const router = express.Router();
const dataService = require('../services/DataService');
const { protect, authorize } = require('../middleware/auth');

router.post('/backup', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const manifest = await dataService.createBackup(req.body.description, req.body.type, req.user._id);
    res.json({ success: true, data: manifest });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/backups', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const backups = await dataService.getBackups();
    res.json({ success: true, data: backups });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

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

router.delete('/backup/:filename', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    await dataService.deleteBackup(req.params.filename);
    res.json({ success: true, message: 'Backup deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

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

router.get('/stats', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const stats = await dataService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
