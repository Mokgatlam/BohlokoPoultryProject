const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const validate = require('../middleware/validate');
const apiKeyService = require('../services/ApiKeyService');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const keys = await apiKeyService.getAll(req.query);
    res.json({ success: true, data: keys });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const key = await apiKeyService.getById(req.params.id);
    if (!key) return res.status(404).json({ success: false, message: 'API key not found' });
    res.json({ success: true, data: key });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, authorize('Farm Manager'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('permissions').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const key = await apiKeyService.create(req.body, req.user._id);
    res.status(201).json({ success: true, data: key });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', protect, authorize('Farm Manager'), [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('permissions').optional().isArray().withMessage('Permissions must be an array')
], validate, async (req, res) => {
  try {
    const key = await apiKeyService.update(req.params.id, req.body);
    if (!key) return res.status(404).json({ success: false, message: 'API key not found' });
    res.json({ success: true, data: key });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/revoke', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const key = await apiKeyService.revoke(req.params.id);
    if (!key) return res.status(404).json({ success: false, message: 'API key not found' });
    res.json({ success: true, data: key });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/activate', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const key = await apiKeyService.activate(req.params.id);
    if (!key) return res.status(404).json({ success: false, message: 'API key not found' });
    res.json({ success: true, data: key });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    await apiKeyService.delete(req.params.id);
    res.json({ success: true, message: 'API key deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
