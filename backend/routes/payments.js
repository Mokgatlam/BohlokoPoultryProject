/**
 * Payment Processing Routes
 * =========================
 * 
 * SRS Reference: FR-013 (Payment Processing)
 * 
 * REST API endpoints for managing payment transactions. Supports creating
 * payments, processing pending payments, issuing refunds, and generating
 * payment statistics.
 * 
 * Endpoints Summary:
 *   GET    /api/payments          - List all payments (Farm Manager, Sales Assistant)
 *   GET    /api/payments/stats    - Get payment statistics (Farm Manager only)
 *   GET    /api/payments/:id      - Get payment by ID (owner or admin/staff)
 *   POST   /api/payments          - Create a new payment record (any authenticated user)
 *   PUT    /api/payments/:id/process - Process a pending payment (Farm Manager, Sales Assistant)
 *   PUT    /api/payments/:id/refund  - Refund a paid payment (Farm Manager only)
 * 
 * Payment Lifecycle (FR-013):
 *   Pending -> Paid -> Refunded
 *            \-> Failed (on processing error)
 * 
 * Design Principles:
 *   - Payment number format: PAY-{timestamp}-{random6}
 *   - Owner-based authorization: customers see only their own payments
 *   - Refund requires reason (audit trail)
 *   - Stats endpoint aggregates revenue, refund totals, and method breakdown
 *   - Uses PAYMENT_METHODS constant from constants.js for validation
 * 
 * Coding Principles Demonstrated:
 *   - Consistent error response format across all endpoints
 *   - Express-validator for input validation
 *   - Role-based access control via authorize() middleware
 *   - Owner-based data access pattern (security)
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const paymentService = require('../services/PaymentService');
const { protect, authorize } = require('../middleware/auth');
const { PAYMENT_METHODS } = require('../config/constants');
const systemLogService = require('../services/SystemLogService');

/**
 * GET /api/payments
 * List all payments with optional filtering.
 * 
 * SRS: FR-013 - View payment history, payment management
 * Access: Farm Manager, Sales Assistant only
 * 
 * Query params:
 *   - status: Filter by payment status (Pending, Paid, Refunded, Failed)
 *   - method: Filter by payment method
 *   - orderId: Filter by order ID
 *   - userId: Filter by user ID
 * 
 * @returns {Object} { success: true, data: Array<Payment> }
 */
router.get('/', protect, authorize('Farm Manager', 'Sales Assistant'), async (req, res) => {
  try {
    const payments = await paymentService.getAll(req.query);
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/payments/stats
 * Get aggregated payment statistics for the admin dashboard.
 * 
 * SRS: FR-013 - Payment analytics, revenue reporting
 * Access: Farm Manager only
 * 
 * Returns:
 *   - total: Total payment count
 *   - paid: Count of paid payments
 *   - pending: Count of pending payments
 *   - refunded: Count of refunded payments
 *   - totalRevenue: Sum of all paid amounts
 *   - totalRefunded: Sum of all refunded amounts
 *   - byMethod: Count of payments grouped by payment method
 * 
 * @returns {Object} Payment statistics
 */
router.get('/stats', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const stats = await paymentService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/payments/:id
 * Get a single payment by ID with ownership check.
 * 
 * SRS: FR-013 - View payment details
 * Access: Payment owner OR Farm Manager/Sales Assistant
 * 
 * Authorization: Compares payment.userId with requesting user._id.
 * If mismatch and user is not admin/staff, returns 403.
 * 
 * @param {string} id - Payment ID
 * @returns {Object} Payment data or 403/404
 */
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

/**
 * POST /api/payments
 * Create a new payment record for an order.
 * 
 * SRS: FR-013 - Record payment transaction
 * Access: Any authenticated user
 * 
 * Validates:
 *   - orderId: Required (links to order)
 *   - amount: Float >= 0.01 (payment amount)
 *   - method: One of PAYMENT_METHODS (cash, bank_transfer, mobile_money, credit_card)
 * 
 * Auto-generated:
 *   - paymentNumber: PAY-{timestamp}-{random6}
 *   - status: 'Pending' (initial state)
 *   - userId: From authenticated user
 * 
 * @param {string} orderId - Order ID to pay for
 * @param {number} amount - Payment amount
 * @param {string} method - Payment method
 * @param {string} [transactionId] - Gateway transaction ID (for online payments)
 * @param {string} [reference] - Payment reference
 * @param {string} [notes] - Payment notes
 * @returns {Object} Created payment with paymentNumber
 */
router.post('/', protect, [
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
  body('method').isIn(PAYMENT_METHODS).withMessage('Invalid payment method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const payment = await paymentService.create({ ...req.body, userId: req.user._id });
    try {
      await systemLogService.create({
        level: 'info',
        message: `Payment created: ${payment.paymentNumber}`,
        category: 'payment',
        userId: req.user._id || req.user.id,
        userName: `${req.user.firstName} ${req.user.lastName}`,
        action: 'create_payment',
        resource: 'payment',
        resourceId: payment._id || payment.id,
        details: { paymentNumber: payment.paymentNumber, amount: payment.amount, method: payment.method },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        method: req.method,
        path: req.originalUrl
      });
    } catch (e) { /* logging failure should not break the request */ }
    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/payments/:id/process
 * Process a pending payment (mark as Paid).
 * 
 * SRS: FR-013 - Payment processing, cash-on-delivery verification
 * Access: Farm Manager, Sales Assistant only
 * 
 * Business Logic:
 *   - Only processes payments in 'Pending' status
 *   - Transitions status to 'Paid'
 *   - Used for cash-on-delivery verification and manual payment recording
 * 
 * @param {string} id - Payment ID
 * @returns {Object} Updated payment with Paid status
 */
router.put('/:id/process', protect, authorize('Farm Manager', 'Sales Assistant'), async (req, res) => {
  try {
    const payment = await paymentService.processPayment(req.params.id);
    try {
      await systemLogService.create({
        level: 'info',
        message: `Payment processed: ${payment.paymentNumber || req.params.id}`,
        category: 'payment',
        userId: req.user._id || req.user.id,
        userName: `${req.user.firstName} ${req.user.lastName}`,
        action: 'process_payment',
        resource: 'payment',
        resourceId: req.params.id,
        details: { paymentNumber: payment.paymentNumber },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        method: req.method,
        path: req.originalUrl
      });
    } catch (e) { /* logging failure should not break the request */ }
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/payments/:id/refund
 * Refund a paid payment with reason tracking.
 * 
 * SRS: FR-014 - Refund processing, FR-013 - Refund receipt generation
 * Access: Farm Manager only (financial control)
 * 
 * Validates: reason (required for audit trail)
 * 
 * Business Logic:
 *   - Only refunds payments in 'Paid' status
 *   - Records refundReason and refundedAt timestamp
 *   - Status transitions to 'Refunded'
 * 
 * @param {string} id - Payment ID
 * @param {string} reason - Refund reason (required)
 * @returns {Object} Updated payment with Refunded status
 */
router.put('/:id/refund', protect, authorize('Farm Manager'), [
  body('reason').notEmpty().withMessage('Reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const payment = await paymentService.refund(req.params.id, req.body.reason);
    try {
      await systemLogService.create({
        level: 'warn',
        message: `Payment refunded: ${payment.paymentNumber || req.params.id}`,
        category: 'payment',
        userId: req.user._id || req.user.id,
        userName: `${req.user.firstName} ${req.user.lastName}`,
        action: 'refund_payment',
        resource: 'payment',
        resourceId: req.params.id,
        details: { paymentNumber: payment.paymentNumber, reason: req.body.reason },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        method: req.method,
        path: req.originalUrl
      });
    } catch (e) { /* logging failure should not break the request */ }
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;