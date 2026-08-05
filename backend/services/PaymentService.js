const BaseRepository = require('../repositories/BaseRepository');
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class PaymentService {
  constructor() {
    this.repo = new BaseRepository(db.payments);
    this.orderRepo = new BaseRepository(db.orders);
  }

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

  async getAll(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.method) query.method = filters.method;
    if (filters.orderId) query.orderId = filters.orderId;
    if (filters.userId) query.userId = filters.userId;
    return await this.repo.find(query);
  }

  async getById(id) {
    return await this.repo.findById(id);
  }

  async getByOrder(orderId) {
    return await this.repo.find({ orderId });
  }

  async getByUser(userId) {
    return await this.repo.find({ userId });
  }

  async updateStatus(id, status, transactionId = null) {
    const updates = { status };
    if (transactionId) updates.transactionId = transactionId;
    return await this.repo.findByIdAndUpdate(id, updates);
  }

  async processPayment(id) {
    const payment = await this.repo.findById(id);
    if (!payment) throw new Error('Payment not found');
    if (payment.status !== 'Pending') throw new Error('Payment already processed');
    return await this.updateStatus(id, 'Paid');
  }

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

  async getByDateRange(startDate, endDate) {
    return await this.repo.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });
  }

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

  async count() {
    return await this.repo.count();
  }
}

module.exports = new PaymentService();
