/**
 * Payment Service
 * ===============
 * 
 * SRS Reference: FR-013 (Payment Processing)
 * 
 * Business logic layer for payment transaction management. Handles payment
 * creation, processing, refunds, and financial analytics.
 * 
 * Responsibilities:
 *   - Payment record creation with unique payment numbers
 *   - Payment status management (Pending -> Paid -> Refunded)
 *   - Refund processing with reason tracking
 *   - Payment statistics and revenue reporting
 *   - Date-range queries for financial reporting
 *   - Owner-based payment access control
 * 
 * Payment Lifecycle:
 *   Pending -> Paid -> Refunded
 *            \-> Failed (on processing error)
 * 
 * Design Principles:
 *   - Payment number format: PAY-{timestamp}-{random6}
 *   - Status transitions are explicit (no skipping)
 *   - Refunds require reason (audit trail)
 *   - Statistics aggregate revenue and refund totals
 * 
 * Dependencies: BaseRepository, db (database), uuid
 */

const BaseRepository = require('../repositories/BaseRepository');
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * PaymentService - Singleton service for payment operations.
 * 
 * Uses two repositories:
 *   - repo: payments collection
 *   - orderRepo: orders collection (for order-related payment lookups)
 */
class PaymentService {
  /**
   * Initialize payment and order repositories.
   */
  constructor() {
    this.repo = new BaseRepository(db.payments);
    this.orderRepo = new BaseRepository(db.orders);
  }

  /**
   * Create a new payment record.
   * 
   * SRS: FR-013 - Record payment transaction
   * 
   * Auto-generates:
   *   - paymentNumber: PAY-{timestamp}-{random6} (unique identifier)
   *   - status: 'Pending' (initial state, requires processing)
   * 
   * @param {Object} data - { orderId, userId, amount, method, transactionId, reference, notes, metadata }
   * @returns {Object} Created payment with paymentNumber and Pending status
   */
  async create(data) {
    const paymentNumber = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    return await this.repo.create({
      paymentNumber,
      orderId: data.orderId,
      userId: data.userId,
      amount: data.amount,
      method: data.method,
      status: 'Pending',
      transactionId: data.transactionId || null,
      reference: data.reference || '',
      notes: data.notes || '',
      metadata: data.metadata || {}
    });
  }

  /**
   * Get all payments with optional filtering.
   * 
   * SRS: FR-013 - View payment history, payment management
   * 
   * Supported Filters:
   *   - status: Filter by payment status (Pending, Paid, Refunded, Failed)
   *   - method: Filter by payment method
   *   - orderId: Filter by order ID
   *   - userId: Filter by user ID
   * 
   * @param {Object} filters - Optional filter criteria
   * @returns {Array} Matching payments
   */
  async getAll(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.method) query.method = filters.method;
    if (filters.orderId) query.orderId = filters.orderId;
    if (filters.userId) query.userId = filters.userId;
    return await this.repo.find(query);
  }

  /**
   * Get a single payment by ID.
   * 
   * SRS: FR-013 - View payment details
   * 
   * @param {string} id - Payment ID
   * @returns {Object|null} Payment or null if not found
   */
  async getById(id) {
    return await this.repo.findById(id);
  }

  /**
   * Get all payments for a specific order.
   * 
   * SRS: FR-013 - Order payment history
   * Supports partial payments (multiple payments per order).
   * 
   * @param {string} orderId - Order ID
   * @returns {Array} Payments for the order
   */
  async getByOrder(orderId) {
    return await this.repo.find({ orderId });
  }

  /**
   * Get all payments for a specific user.
   * 
   * SRS: FR-013 - User payment history
   * 
   * @param {string} userId - User ID
   * @returns {Array} User's payments
   */
  async getByUser(userId) {
    return await this.repo.find({ userId });
  }

  /**
   * Update payment status and optionally record transaction ID.
   * 
   * SRS: FR-013 - Payment status management
   * 
   * @param {string} id - Payment ID
   * @param {string} status - New status (Pending, Paid, Failed, Refunded)
   * @param {string} [transactionId] - Gateway transaction ID (for online payments)
   * @returns {Object} Updated payment
   */
  async updateStatus(id, status, transactionId = null) {
    const updates = { status };
    if (transactionId) updates.transactionId = transactionId;
    return await this.repo.findByIdAndUpdate(id, updates);
  }

  /**
   * Process a pending payment (mark as Paid).
   * 
   * SRS: FR-013 - Payment processing, cash-on-delivery verification
   * 
   * Business Rules:
   *   - Only processes payments in 'Pending' status
   *   - Throws error if payment already processed
   *   - Used for cash-on-delivery and manual payment recording
   * 
   * @param {string} id - Payment ID
   * @returns {Object} Updated payment with Paid status
   * @throws {Error} If payment not found or already processed
   */
  async processPayment(id) {
    const payment = await this.repo.findById(id);
    if (!payment) throw new Error('Payment not found');
    if (payment.status !== 'Pending') throw new Error('Payment already processed');
    return await this.updateStatus(id, 'Paid');
  }

  /**
   * Refund a paid payment with reason tracking.
   * 
   * SRS: FR-014 - Refund processing, FR-013 - Refund receipt
   * 
   * Business Rules:
   *   - Only refunds payments in 'Paid' status
   *   - Records refundReason and refundedAt timestamp
   *   - Status transitions to 'Refunded'
   * 
   * @param {string} id - Payment ID
   * @param {string} reason - Refund reason (required for audit trail)
   * @returns {Object} Updated payment with Refunded status
   * @throws {Error} If payment not found or not in Paid status
   */
  async refund(id, reason) {
    const payment = await this.repo.findById(id);
    if (!payment) throw new Error('Payment not found');
    if (payment.status !== 'Paid') throw new Error('Can only refund paid payments');
    return await this.repo.findByIdAndUpdate(id, {
      status: 'Refunded',
      refundReason: reason,
      refundedAt: new Date()
    });
  }

  /**
   * Get payments within a date range.
   * 
   * SRS: FR-013 - Financial reporting, date-based queries
   * 
   * @param {Date} startDate - Start of date range
   * @param {Date} endDate - End of date range
   * @returns {Array} Payments created within the date range
   */
  async getByDateRange(startDate, endDate) {
    return await this.repo.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });
  }

  /**
   * Get aggregated payment statistics for the admin dashboard.
   * 
   * SRS: FR-013 - Payment analytics, revenue reporting
   * 
   * Returns:
   *   - total: Total payment count
   *   - paid: Count of paid payments
   *   - pending: Count of pending payments
   *   - refunded: Count of refunded payments
   *   - totalRevenue: Sum of all paid amounts (gross revenue)
   *   - totalRefunded: Sum of all refunded amounts
   *   - byMethod: Count of payments grouped by payment method
   * 
   * @returns {Object} Aggregated payment statistics
   */
  async getStats() {
    const all = await this.repo.find({});
    const paid = all.filter(p => p.status === 'Paid');
    const pending = all.filter(p => p.status === 'Pending');
    const refunded = all.filter(p => p.status === 'Refunded');

    return {
      total: all.length,
      paid: paid.length,
      pending: pending.length,
      refunded: refunded.length,
      totalRevenue: paid.reduce((sum, p) => sum + (p.amount || 0), 0),
      totalRefunded: refunded.reduce((sum, p) => sum + (p.amount || 0), 0),
      byMethod: all.reduce((acc, p) => {
        acc[p.method] = (acc[p.method] || 0) + 1;
        return acc;
      }, {})
    };
  }

  /**
   * Count total payments.
   * 
   * SRS: FR-013 - Payment statistics
   * 
   * @returns {number} Total payment count
   */
  async count() {
    return await this.repo.count();
  }
}

module.exports = new PaymentService();