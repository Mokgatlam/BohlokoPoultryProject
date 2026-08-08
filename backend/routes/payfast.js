/**
 * PayFast Payment Routes
 * ======================
 *
 * API endpoints for PayFast payment gateway integration.
 * Handles checkout initialization, ITN callbacks, and payment status queries.
 *
 * Endpoints:
 *   POST /api/payfast/init     - Initialize PayFast checkout for an order (authenticated)
 *   POST /api/payfast/notify   - ITN callback from PayFast (unauthenticated, verified by signature)
 *   GET  /api/payfast/status/:orderId - Check payment status for an order (authenticated)
 */

const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const PayFastService = require('../services/PayFastService');
const paymentService = require('../services/PaymentService');
const db = require('../config/db');
const { protect } = require('../middleware/auth');
const systemLogService = require('../services/SystemLogService');

const payfastService = new PayFastService();

/**
 * POST /api/payfast/init
 * Initialize PayFast checkout — creates payment record and returns checkout URL.
 *
 * Body: { orderId: string }
 * Returns: { success, data: { checkoutUrl, paymentId } }
 */
router.post('/init', protect, [
  body('orderId').notEmpty().withMessage('Order ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { orderId } = req.body;
    const userId = req.user._id || req.user.id;

    // Fetch the order
    const order = await db('orders').where('id', orderId).first();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify ownership
    if (order.customer !== userId && !['Farm Manager', 'Sales Assistant'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Check order isn't already paid
    if (order.paymentStatus === 'Paid') {
      return res.status(400).json({ success: false, message: 'Order already paid' });
    }

    // Create a payment record
    const payment = await paymentService.create({
      orderId: order.id,
      userId: userId,
      amount: order.total,
      method: 'payfast',
      reference: `PayFast checkout for ${order.orderNumber}`
    });

    // Build PayFast checkout URL
    const checkoutUrl = payfastService.buildCheckoutUrl({
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      userId: userId,
      customer: {
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email
      }
    });

    try {
      await systemLogService.create({
        level: 'info',
        message: `PayFast checkout initiated for order ${order.orderNumber}`,
        category: 'payment',
        userId: userId,
        userName: `${req.user.firstName} ${req.user.lastName}`,
        action: 'payfast_init',
        resource: 'order',
        resourceId: order.id,
        details: { orderNumber: order.orderNumber, amount: order.total, paymentId: payment._id || payment.id },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        method: req.method,
        path: req.originalUrl
      });
    } catch (e) { /* logging failure should not break the request */ }

    res.json({
      success: true,
      data: {
        checkoutUrl,
        paymentId: payment._id || payment.id
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/payfast/notify
 * ITN (Instant Transaction Notification) callback from PayFast.
 * Called by PayFast servers after payment — NOT by the frontend.
 *
 * Steps:
 *   1. Verify signature
 *   2. Confirm with PayFast server
 *   3. Update payment and order status
 *   4. Log the transaction
 *
 * Always returns HTTP 200 to prevent PayFast retries.
 */
router.post('/notify', async (req, res) => {
  // Always respond 200 to PayFast first
  res.status(200).send('OK');

  try {
    const postData = req.body;

    // 1. Verify ITN signature
    const verification = payfastService.verifyItn(postData);
    if (!verification.valid) {
      console.error('[PayFast ITN] Invalid:', verification.error);
      try {
        await systemLogService.create({
          level: 'error',
          message: `PayFast ITN signature verification failed: ${verification.error}`,
          category: 'payment',
          action: 'payfast_itn_failed',
          details: { error: verification.error, paymentId: postData.m_payment_id }
        });
      } catch (e) { /* ignore */ }
      return;
    }

    // 2. Confirm with PayFast server
    const confirmed = await payfastService.confirmWithServer(postData);
    if (!confirmed) {
      console.error('[PayFast ITN] Server confirmation failed for payment', postData.m_payment_id);
      try {
        await systemLogService.create({
          level: 'error',
          message: `PayFast ITN server confirmation failed for payment ${postData.m_payment_id}`,
          category: 'payment',
          action: 'payfast_itn_not_confirmed',
          details: { paymentId: postData.m_payment_id }
        });
      } catch (e) { /* ignore */ }
      return;
    }

    const { paymentId, pfPaymentId, status, amountGross } = verification.data;

    // 3. Find and update payment record
    const payment = await paymentService.getById(paymentId);
    if (!payment) {
      console.error('[PayFast ITN] Payment not found:', paymentId);
      return;
    }

    // 4. Update payment status
    await paymentService.updateStatus(paymentId, status, pfPaymentId);

    // Store gateway response
    await db('payments').where('id', paymentId).update({
      gatewayResponse: JSON.stringify(postData),
      updated_at: new Date()
    });

    // 5. Update order payment status
    await db('orders').where('id', payment.orderId).update({
      paymentStatus: status,
      updated_at: new Date()
    });

    // 6. Log the transaction
    try {
      await systemLogService.create({
        level: status === 'Paid' ? 'info' : 'warn',
        message: `PayFast ITN processed: Order ${payment.orderNumber || payment.orderId} → ${status}`,
        category: 'payment',
        action: 'payfast_itn_processed',
        resource: 'payment',
        resourceId: paymentId,
        details: {
          orderId: payment.orderId,
          pfPaymentId,
          status,
          amountGross
        }
      });
    } catch (e) { /* ignore */ }
  } catch (error) {
    console.error('[PayFast ITN] Processing error:', error.message);
  }
});

/**
 * GET /api/payfast/status/:orderId
 * Check the payment status for a given order.
 *
 * Returns: { success, data: { paymentStatus, orderStatus, payment } }
 */
router.get('/status/:orderId', protect, [
  param('orderId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { orderId } = req.params;
    const userId = req.user._id || req.user.id;

    const order = await db('orders').where('id', orderId).first();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify ownership
    if (order.customer !== userId && !['Farm Manager', 'Sales Assistant'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Get latest payment for this order
    const payments = await paymentService.getByOrder(orderId);
    const latestPayment = payments.length > 0 ? payments[0] : null;

    res.json({
      success: true,
      data: {
        paymentStatus: order.paymentStatus,
        orderStatus: order.status,
        payment: latestPayment
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
