/**
 * OrderService Unit Tests
 * 
 * Tests the OrderService class with mocked Knex database.
 * Covers: Order Creation, Status Management, Cancellation, Authorization, Stock
 */

const { orders, products, inventory, users, config } = require('./__fixtures__');

// Mock dependencies
jest.mock('../config/db', () => {
  const mockKnex = jest.fn(() => mockKnex);
  mockKnex.where = jest.fn(() => mockKnex);
  mockKnex.first = jest.fn();
  mockKnex.insert = jest.fn();
  mockKnex.update = jest.fn();
  mockKnex.select = jest.fn(() => mockKnex);
  mockKnex.leftJoin = jest.fn(() => mockKnex);
  mockKnex.orderBy = jest.fn(() => mockKnex);
  mockKnex.count = jest.fn(() => mockKnex);
  return mockKnex;
});

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-12345')
}));

const db = require('../config/db');

let OrderService;
beforeAll(() => {
  jest.resetModules();
  OrderService = require('../services/OrderService');
});

describe('OrderService', () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrderService();
  });

  describe('create', () => {
    const mockUser = { _id: 'test-customer-001', id: 'test-customer-001' };

    beforeEach(() => {
      // Mock config lookups
      const configChain = { where: jest.fn().mockReturnThis(), first: jest.fn() };
      configChain.first.mockResolvedValueOnce(config.taxRate);
      configChain.first.mockResolvedValueOnce(config.shippingLocal);
      db.mockReturnValue(configChain);
      db.where.mockReturnValue(configChain);
    });

    it('should create order with correct order number format', async () => {
      // Mock product lookup
      const productChain = { where: jest.fn().mockReturnThis(), first: jest.fn() };
      productChain.first.mockResolvedValueOnce(products.wholeChicken);
      productChain.first.mockResolvedValueOnce(null); // No inventory
      db.where.mockReturnValue(productChain);
      db.insert.mockResolvedValue();

      const result = await service.create({
        items: [{ product: 'test-prod-001', quantity: 2, price: 89.99 }],
        deliveryOption: 'pickup',
        paymentMethod: 'cash'
      }, mockUser);

      expect(result.orderNumber).toMatch(/^ORD-\d+-[A-Z0-9]{6}$/);
    });

    it('should calculate 15% tax on subtotal', async () => {
      const productChain = { where: jest.fn().mockReturnThis(), first: jest.fn() };
      productChain.first.mockResolvedValueOnce(products.wholeChicken);
      productChain.first.mockResolvedValueOnce(null);
      db.where.mockReturnValue(productChain);
      db.insert.mockResolvedValue();

      const result = await service.create({
        items: [{ product: 'test-prod-001', quantity: 1, price: 100 }],
        deliveryOption: 'pickup',
        paymentMethod: 'cash'
      }, mockUser);

      expect(result.tax).toBe(15); // 15% of 100
    });

    it('should add shipping cost for local_delivery', async () => {
      const productChain = { where: jest.fn().mockReturnThis(), first: jest.fn() };
      productChain.first.mockResolvedValueOnce(products.wholeChicken);
      productChain.first.mockResolvedValueOnce(null);
      db.where.mockReturnValue(productChain);
      db.insert.mockResolvedValue();

      const result = await service.create({
        items: [{ product: 'test-prod-001', quantity: 1, price: 100 }],
        deliveryOption: 'local_delivery',
        paymentMethod: 'cash'
      }, mockUser);

      expect(result.shippingCost).toBe(50);
      expect(result.total).toBe(165); // 100 + 15 + 50
    });

    it('should not charge shipping for pickup', async () => {
      const productChain = { where: jest.fn().mockReturnThis(), first: jest.fn() };
      productChain.first.mockResolvedValueOnce(products.wholeChicken);
      productChain.first.mockResolvedValueOnce(null);
      db.where.mockReturnValue(productChain);
      db.insert.mockResolvedValue();

      const result = await service.create({
        items: [{ product: 'test-prod-001', quantity: 1, price: 100 }],
        deliveryOption: 'pickup',
        paymentMethod: 'cash'
      }, mockUser);

      expect(result.shippingCost).toBe(0);
    });

    it('should set paymentStatus to Pending for cash payments', async () => {
      const productChain = { where: jest.fn().mockReturnThis(), first: jest.fn() };
      productChain.first.mockResolvedValueOnce(products.wholeChicken);
      productChain.first.mockResolvedValueOnce(null);
      db.where.mockReturnValue(productChain);
      db.insert.mockResolvedValue();

      await service.create({
        items: [{ product: 'test-prod-001', quantity: 1, price: 100 }],
        deliveryOption: 'pickup',
        paymentMethod: 'cash'
      }, mockUser);

      const insertCall = db.insert.mock.calls[0][0];
      expect(insertCall.paymentStatus).toBe('Pending');
    });

    it('should set paymentStatus to Unpaid for non-cash payments', async () => {
      const productChain = { where: jest.fn().mockReturnThis(), first: jest.fn() };
      productChain.first.mockResolvedValueOnce(products.wholeChicken);
      productChain.first.mockResolvedValueOnce(null);
      db.where.mockReturnValue(productChain);
      db.insert.mockResolvedValue();

      await service.create({
        items: [{ product: 'test-prod-001', quantity: 1, price: 100 }],
        deliveryOption: 'pickup',
        paymentMethod: 'bank_transfer'
      }, mockUser);

      const insertCall = db.insert.mock.calls[0][0];
      expect(insertCall.paymentStatus).toBe('Unpaid');
    });

    it('should throw if product not found', async () => {
      const productChain = { where: jest.fn().mockReturnThis(), first: jest.fn() };
      productChain.first.mockResolvedValueOnce(null); // No product
      productChain.first.mockResolvedValueOnce(null); // No slug either
      db.where.mockReturnValue(productChain);

      await expect(service.create({
        items: [{ product: 'nonexistent', quantity: 1, price: 100 }],
        deliveryOption: 'pickup',
        paymentMethod: 'cash'
      }, mockUser)).rejects.toThrow('Product not found');
    });

    it('should throw if insufficient stock', async () => {
      const productChain = { where: jest.fn().mockReturnThis(), first: jest.fn() };
      productChain.first.mockResolvedValueOnce(products.wholeChicken);
      productChain.first.mockResolvedValueOnce({ quantity: 2 }); // Only 2 in stock
      db.where.mockReturnValue(productChain);

      await expect(service.create({
        items: [{ product: 'test-prod-001', quantity: 5, price: 89.99 }],
        deliveryOption: 'pickup',
        paymentMethod: 'cash'
      }, mockUser)).rejects.toThrow('Insufficient stock');
    });
  });

  describe('getByUser', () => {
    it('should return only orders for specified user', async () => {
      const mockOrders = [orders.pendingOrder, orders.shippedOrder];
      const chain = { where: jest.fn().mockReturnThis(), orderBy: jest.fn().mockResolvedValue(mockOrders) };
      db.where.mockReturnValue(chain);

      const result = await service.getByUser('test-customer-001');

      expect(result).toHaveLength(2);
    });

    it('should parse JSON items field', async () => {
      const mockOrders = [orders.pendingOrder];
      const chain = { where: jest.fn().mockReturnThis(), orderBy: jest.fn().mockResolvedValue(mockOrders) };
      db.where.mockReturnValue(chain);

      const result = await service.getByUser('test-customer-001');

      expect(Array.isArray(result[0].items)).toBe(true);
    });
  });

  describe('getAll', () => {
    it('should return all orders with customer name', async () => {
      const mockOrders = [{
        ...orders.pendingOrder,
        customerFirstName: 'John',
        customerLastName: 'Smith'
      }];
      const chain = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(mockOrders)
      };
      db.mockReturnValue(chain);

      const result = await service.getAll();

      expect(result[0].customerName).toBe('John Smith');
    });
  });

  describe('getById', () => {
    it('should return order when found', async () => {
      const chain = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(orders.pendingOrder)
      };
      db.mockReturnValue(chain);

      const result = await service.getById('test-order-001', users.customer1);

      expect(result.id).toBe('test-order-001');
    });

    it('should throw when order not found', async () => {
      const chain = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null)
      };
      db.mockReturnValue(chain);

      await expect(service.getById('nonexistent', users.customer1))
        .rejects.toThrow('Order not found');
    });

    it('should allow owner to view own order', async () => {
      const chain = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(orders.pendingOrder)
      };
      db.mockReturnValue(chain);

      const result = await service.getById('test-order-001', users.customer1);
      expect(result).toBeDefined();
    });

    it('should allow Farm Manager to view any order', async () => {
      const chain = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(orders.pendingOrder)
      };
      db.mockReturnValue(chain);

      const result = await service.getById('test-order-001', users.admin);
      expect(result).toBeDefined();
    });

    it('should allow Sales Assistant to view any order', async () => {
      const chain = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(orders.pendingOrder)
      };
      db.mockReturnValue(chain);

      const result = await service.getById('test-order-001', users.salesAssistant);
      expect(result).toBeDefined();
    });

    it('should reject other customers viewing different order', async () => {
      const chain = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(orders.pendingOrder)
      };
      db.mockReturnValue(chain);

      await expect(service.getById('test-order-001', users.customer2))
        .rejects.toThrow('Not authorized');
    });
  });

  describe('cancel', () => {
    it('should cancel order and set reason', async () => {
      const orderChain = { where: jest.fn().mockReturnThis(), first: jest.fn() };
      orderChain.first
        .mockResolvedValueOnce(orders.confirmedOrder)
        .mockResolvedValueOnce({ ...orders.confirmedOrder, status: 'Cancelled' });
      db.where.mockReturnValue(orderChain);
      db.update.mockResolvedValue();

      // Mock inventory lookup
      const invChain = { where: jest.fn().mockReturnThis(), first: jest.fn(), update: jest.fn() };
      invChain.first.mockResolvedValue({ quantity: 20 });

      const result = await service.cancel('test-order-002', 'Changed mind', users.customer2);

      expect(result).toBeDefined();
    });

    it('should prevent cancellation after shipping', async () => {
      const chain = { where: jest.fn().mockReturnThis(), first: jest.fn() };
      chain.first.mockResolvedValueOnce(orders.shippedOrder);
      db.where.mockReturnValue(chain);

      await expect(service.cancel('test-order-003', 'Reason', users.customer1))
        .rejects.toThrow('Cannot cancel after shipping');
    });

    it('should prevent cancellation after delivery', async () => {
      const deliveredOrder = { ...orders.confirmedOrder, status: 'Delivered' };
      const chain = { where: jest.fn().mockReturnThis(), first: jest.fn() };
      chain.first.mockResolvedValueOnce(deliveredOrder);
      db.where.mockReturnValue(chain);

      await expect(service.cancel('test-order-002', 'Reason', users.customer2))
        .rejects.toThrow('Cannot cancel after shipping');
    });

    it('should only allow owner or Farm Manager to cancel', async () => {
      const chain = { where: jest.fn().mockReturnThis(), first: jest.fn() };
      chain.first.mockResolvedValueOnce(orders.pendingOrder);
      db.where.mockReturnValue(chain);

      // customer2 is not the owner of order-001 (which belongs to customer1)
      // and customer2 is not Farm Manager
      await expect(service.cancel('test-order-001', 'Reason', users.customer2))
        .rejects.toThrow('Not authorized');
    });

    it('should throw if order not found', async () => {
      const chain = { where: jest.fn().mockReturnThis(), first: jest.fn() };
      chain.first.mockResolvedValueOnce(null);
      db.where.mockReturnValue(chain);

      await expect(service.cancel('nonexistent', 'Reason', users.admin))
        .rejects.toThrow('Order not found');
    });
  });

  describe('count', () => {
    it('should return total count of orders', async () => {
      const chain = { where: jest.fn().mockReturnThis(), count: jest.fn().mockReturnThis(), first: jest.fn() };
      chain.first.mockResolvedValue({ count: 10 });
      db.mockReturnValue(chain);

      const result = await service.count();

      expect(result).toBe(10);
    });

    it('should filter by status', async () => {
      const chain = { where: jest.fn().mockReturnThis(), count: jest.fn().mockReturnThis(), first: jest.fn() };
      chain.first.mockResolvedValue({ count: 3 });
      db.mockReturnValue(chain);

      const result = await service.count({ status: 'Pending' });

      expect(result).toBe(3);
    });
  });
});
