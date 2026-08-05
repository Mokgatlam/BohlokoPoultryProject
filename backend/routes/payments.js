const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const paymentService = require('../services/PaymentService');
const { protect, authorize } = require('../middleware/auth');
const { PAYMENT_METHODS } = require('../config/constants');

router.get('/', protect, authorize('Farm Manager', 'Sales Assistant'), async (req, res) => {
  try {
    const payments = await paymentService.getAll(req.query);
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/stats', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const stats = await paymentService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const payment = await paymentService.getById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    if (payment.userId && payment.userId.toString() !== req.user._id.toString() && !['Farm Manager', 'Sales Assistant'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, [
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
  body('method').isIn(PAYMENT_METHODS).withMessage('Invalid payment method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const payment = await paymentService.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/process', protect, authorize('Farm Manager', 'Sales Assistant'), async (req, res) => {
  try {
    const payment = await paymentService.processPayment(req.params.id);
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/:id/refund', protect, authorize('Farm Manager'), [
  body('reason').notEmpty().withMessage('Reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const payment = await paymentService.refund(req.params.id, req.body.reason);
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
