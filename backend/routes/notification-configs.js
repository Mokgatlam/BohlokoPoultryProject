const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const validate = require('../middleware/validate');
const notificationConfigService = require('../services/NotificationConfigService');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const configs = await notificationConfigService.getAll(req.query);
    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const config = await notificationConfigService.getById(req.params.id);
    if (!config) return res.status(404).json({ success: false, message: 'Config not found' });
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, authorize('Farm Manager'), [
  body('type').notEmpty().withMessage('Type is required'),
  body('name').notEmpty().withMessage('Name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const config = await notificationConfigService.create(req.body, req.user._id);
    res.status(201).json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', protect, authorize('Farm Manager'), [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('type').optional().trim().notEmpty().withMessage('Type cannot be empty'),
  body('active').optional().isBoolean().withMessage('Active must be a boolean'),
  body('thresholds').optional().isObject().withMessage('Thresholds must be an object')
], validate, async (req, res) => {
  try {
    const config = await notificationConfigService.update(req.params.id, req.body);
    if (!config) return res.status(404).json({ success: false, message: 'Config not found' });
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/toggle', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const config = await notificationConfigService.toggle(req.params.id);
    if (!config) return res.status(404).json({ success: false, message: 'Config not found' });
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    await notificationConfigService.delete(req.params.id);
    res.json({ success: true, message: 'Config deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
