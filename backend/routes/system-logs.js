const express = require('express');
const router = express.Router();
const systemLogService = require('../services/SystemLogService');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const logs = await systemLogService.getAll(req.query);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/recent', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logs = await systemLogService.getRecent(limit);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/errors', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = await systemLogService.getErrors(limit);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const log = await systemLogService.getById(req.params.id);
    if (!log) return res.status(404).json({ success: false, message: 'Log not found' });
    res.json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/level/:level', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const logs = await systemLogService.getByLevel(req.params.level);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/user/:userId', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const logs = await systemLogService.getByUser(req.params.userId);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/category/:category', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const logs = await systemLogService.getByCategory(req.params.category);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/clear-old', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const days = Math.max(1, Math.min(365, parseInt(req.body.days) || 90));
    const deleted = await systemLogService.clearOldLogs(days);
    res.json({ success: true, message: `${deleted} old logs cleared` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
