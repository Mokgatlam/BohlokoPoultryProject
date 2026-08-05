const express = require('express');
const router = express.Router();
const notificationService = require('../services/NotificationService');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const notifications = await notificationService.getByUser(req.user._id, {
      unreadOnly: req.query.unreadOnly === 'true',
      type: req.query.type
    });
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user._id);
    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const notification = await notificationService.getById(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    const ownerId = notification.userId ? notification.userId.toString() : notification.userId;
    const requesterId = req.user._id ? req.user._id.toString() : req.user._id;
    if (ownerId !== requesterId && req.user.role !== 'Farm Manager') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await notificationService.getById(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    const ownerId = notification.userId ? notification.userId.toString() : notification.userId;
    const requesterId = req.user._id ? req.user._id.toString() : req.user._id;
    if (ownerId !== requesterId && req.user.role !== 'Farm Manager') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const updated = await notificationService.markAsRead(req.params.id);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/read-all', protect, async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.user._id);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await notificationService.getById(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    if (notification.userId && notification.userId.toString() !== req.user._id.toString() && req.user.role !== 'Farm Manager') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await notificationService.delete(req.params.id);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
