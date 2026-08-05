const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const validate = require('../middleware/validate');
const orderService = require('../services/OrderService');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, [
  body('items').isArray({ min: 1 }),
  body('items.*.product').notEmpty(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('deliveryOption').isIn(['pickup', 'farm_gate', 'local_delivery']),
  body('paymentMethod').isIn(['cash', 'bank_transfer', 'mobile_money', 'credit_card'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const order = await orderService.create(req.body, req.user);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Server error' });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const orders = await orderService.getByUser(req.user._id);
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/all', protect, authorize('Farm Manager', 'Sales Assistant'), async (req, res) => {
  try {
    const orders = await orderService.getAll();
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const order = await orderService.getById(req.params.id, req.user);
    res.json({ success: true, data: order });
  } catch (error) {
    const statusCode = error.message.includes('Not authorized') ? 403 : 
                       error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ success: false, message: error.message || 'Server error' });
  }
});

router.put('/:id/status', protect, authorize('Farm Manager', 'Sales Assistant'), [
  body('status').isIn(['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const order = await orderService.updateStatus(req.params.id, req.body.status);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: { ...order, status: req.body.status } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/:id/cancel', protect, [
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason must be 500 characters or less')
], validate, async (req, res) => {
  try {
    const order = await orderService.cancel(req.params.id, req.body.reason, req.user);
    res.json({ success: true, data: order });
  } catch (error) {
    const statusCode = error.message.includes('Not authorized') ? 403 :
                       error.message.includes('not found') ? 404 :
                       error.message.includes('Cannot cancel') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message || 'Server error' });
  }
});

module.exports = router;
