const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const configService = require('../services/ConfigService');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const config = await configService.getAll();
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

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
