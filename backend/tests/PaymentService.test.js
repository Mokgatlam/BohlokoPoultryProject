/**
 * PaymentService Unit Tests
 * 
 * Tests the PaymentService class with mocked repository.
 * Covers: Payment Creation, Processing, Refunds, Statistics, Security
 */

const { payments, orders, users } = require('./__fixtures__');

jest.mock('../config/db', () => ({
  payments: { find: jest.fn(), findOne: jest.fn(), insert: jest.fn(), update: jest.fn(), count: jest.fn() },
  orders: { find: jest.fn(), findOne: jest.fn() }
}));

jest.mock('../repositories/BaseRepository', () => {
  return jest.fn().mockImplementation((collection) => ({
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    collection
  }));
});

const BaseRepository = require('../repositories/BaseRepository');

let PaymentService;
beforeAll(() => {
  jest.resetModules();
  PaymentService = require('../services/PaymentService');
});

describe('PaymentService', () => {
  let service;
  let mockRepo;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PaymentService();
    mockRepo = service.repo;
  });

  describe('create', () => {
    it('should generate payment number with PAY prefix', async () => {
      mockRepo.create.mockImplementation(async (data) => ({ _id: 'new-pay', ...data }));

      const result = await service.create({
        orderId: 'order-123',
        userId: 'user-123',
        amount: 500,
        method: 'cash'
      });

      expect(result.paymentNumber).toMatch(/^PAY-\d+-[A-Z0-9]{6}$/);
    });

    it('should set initial status to Pending', async () => {
      mockRepo.create.mockImplementation(async (data) => ({ _id: 'new-pay', ...data }));

      const result = await service.create({
        orderId: 'order-123',
        userId: 'user-123',
        amount: 500,
        method: 'cash'
      });

      expect(result.status).toBe('Pending');
    });

    it('should store all provided data fields', async () => {
      mockRepo.create.mockImplementation(async (data) => ({ _id: 'new-pay', ...data }));

      await service.create({
        orderId: 'order-123',
        userId: 'user-123',
        amount: 500,
        method: 'bank_transfer',
        transactionId: 'TXN-001',
        reference: 'EFT proof',
        notes: 'Test note'
      });

      const createdData = mockRepo.create.mock.calls[0][0];
      expect(createdData.orderId).toBe('order-123');
      expect(createdData.amount).toBe(500);
      expect(createdData.method).toBe('bank_transfer');
      expect(createdData.transactionId).toBe('TXN-001');
      expect(createdData.reference).toBe('EFT proof');
    });
  });

  describe('getAll', () => {
    it('should return all payments with no filters', async () => {
      const allPayments = [payments.pendingPayment, payments.paidPayment];
      mockRepo.find.mockResolvedValue(allPayments);

      const result = await service.getAll();

      expect(result).toEqual(allPayments);
      expect(mockRepo.find).toHaveBeenCalledWith({});
    });

    it('should filter by status', async () => {
      mockRepo.find.mockResolvedValue([payments.paidPayment]);

      await service.getAll({ status: 'Paid' });

      expect(mockRepo.find).toHaveBeenCalledWith({ status: 'Paid' });
    });

    it('should filter by method', async () => {
      mockRepo.find.mockResolvedValue([payments.pendingPayment]);

      await service.getAll({ method: 'cash' });

      expect(mockRepo.find).toHaveBeenCalledWith({ method: 'cash' });
    });

    it('should filter by orderId', async () => {
      mockRepo.find.mockResolvedValue([payments.pendingPayment]);

      await service.getAll({ orderId: 'test-order-001' });

      expect(mockRepo.find).toHaveBeenCalledWith({ orderId: 'test-order-001' });
    });

    it('should filter by userId', async () => {
      mockRepo.find.mockResolvedValue([payments.pendingPayment]);

      await service.getAll({ userId: 'test-customer-001' });

      expect(mockRepo.find).toHaveBeenCalledWith({ userId: 'test-customer-001' });
    });
  });

  describe('getById', () => {
    it('should return payment when found', async () => {
      mockRepo.findById.mockResolvedValue(payments.paidPayment);

      const result = await service.getById('test-pay-002');

      expect(result).toEqual(payments.paidPayment);
    });

    it('should return null when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      const result = await service.getById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getByOrder', () => {
    it('should return all payments for an order', async () => {
      mockRepo.find.mockResolvedValue([payments.pendingPayment, payments.paidPayment]);

      const result = await service.getByOrder('test-order-001');

      expect(result).toHaveLength(2);
      expect(mockRepo.find).toHaveBeenCalledWith({ orderId: 'test-order-001' });
    });
  });

  describe('getByUser', () => {
    it('should return all payments for a user', async () => {
      mockRepo.find.mockResolvedValue([payments.pendingPayment]);

      const result = await service.getByUser('test-customer-001');

      expect(mockRepo.find).toHaveBeenCalledWith({ userId: 'test-customer-001' });
    });
  });

  describe('processPayment', () => {
    it('should process a pending payment', async () => {
      mockRepo.findById.mockResolvedValue(payments.pendingPayment);
      mockRepo.findByIdAndUpdate.mockResolvedValue({ ...payments.pendingPayment, status: 'Paid' });

      const result = await service.processPayment('test-pay-001');

      expect(mockRepo.findByIdAndUpdate).toHaveBeenCalledWith('test-pay-001', expect.objectContaining({ status: 'Paid' }));
    });

    it('should throw if payment not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.processPayment('nonexistent'))
        .rejects.toThrow('Payment not found');
    });

    it('should throw if payment already processed', async () => {
      mockRepo.findById.mockResolvedValue(payments.paidPayment);

      await expect(service.processPayment('test-pay-002'))
        .rejects.toThrow('Payment already processed');
    });
  });

  describe('refund', () => {
    it('should refund a paid payment', async () => {
      mockRepo.findById.mockResolvedValue(payments.paidPayment);
      mockRepo.findByIdAndUpdate.mockResolvedValue({ ...payments.paidPayment, status: 'Refunded' });

      const result = await service.refund('test-pay-002', 'Customer requested');

      expect(mockRepo.findByIdAndUpdate).toHaveBeenCalledWith(
        'test-pay-002',
        expect.objectContaining({
          status: 'Refunded',
          refundReason: 'Customer requested'
        })
      );
    });

    it('should record refundReason and refundedAt', async () => {
      mockRepo.findById.mockResolvedValue(payments.paidPayment);
      mockRepo.findByIdAndUpdate.mockResolvedValue({});

      await service.refund('test-pay-002', 'Defective product');

      const updateCall = mockRepo.findByIdAndUpdate.mock.calls[0][1];
      expect(updateCall.refundReason).toBe('Defective product');
      expect(updateCall.refundedAt).toBeInstanceOf(Date);
    });

    it('should throw if payment not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.refund('nonexistent', 'Reason'))
        .rejects.toThrow('Payment not found');
    });

    it('should throw if payment not in Paid status (pending)', async () => {
      mockRepo.findById.mockResolvedValue(payments.pendingPayment);

      await expect(service.refund('test-pay-001', 'Reason'))
        .rejects.toThrow('Can only refund paid payments');
    });

    it('should throw if payment already refunded', async () => {
      mockRepo.findById.mockResolvedValue(payments.refundedPayment);

      await expect(service.refund('test-pay-003', 'Reason'))
        .rejects.toThrow('Can only refund paid payments');
    });

    it('should throw if payment failed', async () => {
      mockRepo.findById.mockResolvedValue(payments.failedPayment);

      await expect(service.refund('test-pay-004', 'Reason'))
        .rejects.toThrow('Can only refund paid payments');
    });
  });

  describe('getStats', () => {
    it('should calculate totalRevenue from paid payments only', async () => {
      mockRepo.find.mockResolvedValue([
        payments.paidPayment,        // 896.92
        payments.refundedPayment,    // 1084.89
        payments.pendingPayment      // 360.47 (not counted)
      ]);

      const stats = await service.getStats();

      expect(stats.totalRevenue).toBe(896.92);
    });

    it('should calculate totalRefunded', async () => {
      mockRepo.find.mockResolvedValue([
        payments.paidPayment,
        payments.refundedPayment
      ]);

      const stats = await service.getStats();

      expect(stats.totalRefunded).toBe(1084.89);
    });

    it('should break down by payment method', async () => {
      mockRepo.find.mockResolvedValue([
        payments.pendingPayment,     // cash
        payments.paidPayment,        // bank_transfer
        payments.refundedPayment     // cash
      ]);

      const stats = await service.getStats();

      expect(stats.byMethod.cash).toBe(2);
      expect(stats.byMethod.bank_transfer).toBe(1);
    });

    it('should count by status', async () => {
      mockRepo.find.mockResolvedValue([
        payments.pendingPayment,
        payments.paidPayment,
        payments.refundedPayment,
        payments.failedPayment
      ]);

      const stats = await service.getStats();

      expect(stats.pending).toBe(1);
      expect(stats.paid).toBe(1);
      expect(stats.refunded).toBe(1);
    });
  });

  describe('count', () => {
    it('should return total payment count', async () => {
      mockRepo.count.mockResolvedValue(4);

      const result = await service.count();

      expect(result).toBe(4);
    });
  });
});
