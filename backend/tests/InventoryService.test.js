/**
 * InventoryService Unit Tests
 * ===========================
 * 
 * SRS Reference: FR-008 (Inventory Management), FR-009 (Inventory Reporting)
 * 
 * Tests InventoryService methods with mocked BaseRepository and database.
 */

const { inventory } = require('./__fixtures__');

const mockRepo = {
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn()
};

jest.mock('../repositories/BaseRepository', () => {
  return jest.fn().mockImplementation(() => mockRepo);
});

const mockDb = {
  systemConfig: { findOne: jest.fn() },
  inventory: {}
};
jest.mock('../config/db', () => mockDb);

let InventoryService;

beforeAll(() => {
  jest.resetModules();
  InventoryService = require('../services/InventoryService');
});

describe('InventoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should generate batch number with BATCH prefix', async () => {
      const data = { productType: 'Whole Chicken', quantity: 50 };
      const user = { _id: 'test-user-001' };
      mockRepo.create.mockResolvedValue({ ...data, batchNumber: 'BATCH-12345-ABC', createdBy: user._id });

      const result = await InventoryService.create(data, user);

      expect(mockRepo.create).toHaveBeenCalled();
      const callData = mockRepo.create.mock.calls[0][0];
      expect(callData.batchNumber).toMatch(/^BATCH-/);
      expect(callData.createdBy).toBe('test-user-001');
    });
  });

  describe('getAll', () => {
    it('should return all inventory items with no filters', async () => {
      mockRepo.find.mockResolvedValue([inventory.wholeChicken1, inventory.breast1]);

      const result = await InventoryService.getAll();

      expect(mockRepo.find).toHaveBeenCalledWith({});
      expect(result).toHaveLength(2);
    });

    it('should filter by status', async () => {
      mockRepo.find.mockResolvedValue([inventory.wholeChicken1]);

      await InventoryService.getAll({ status: 'available' });

      expect(mockRepo.find).toHaveBeenCalledWith({ status: 'available' });
    });

    it('should filter by productType', async () => {
      mockRepo.find.mockResolvedValue([inventory.wholeChicken1]);

      await InventoryService.getAll({ productType: 'Whole Chicken' });

      expect(mockRepo.find).toHaveBeenCalledWith({ productType: 'Whole Chicken' });
    });

    it('should filter by location', async () => {
      mockRepo.find.mockResolvedValue([inventory.wholeChicken1]);

      await InventoryService.getAll({ location: 'Cold Storage A' });

      expect(mockRepo.find).toHaveBeenCalledWith({ storageLocation: 'Cold Storage A' });
    });
  });

  describe('getLowStock', () => {
    it('should return items below threshold', async () => {
      mockDb.systemConfig.findOne.mockResolvedValue({ key: 'lowStockThreshold', value: 10 });
      mockRepo.find.mockResolvedValue([
        { ...inventory.lowStockItem, quantity: 3 },
        { ...inventory.wholeChicken1, quantity: 50 }
      ]);

      const result = await InventoryService.getLowStock();

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(3);
    });

    it('should use default threshold of 10', async () => {
      mockDb.systemConfig.findOne.mockResolvedValue(null);
      mockRepo.find.mockResolvedValue([
        { quantity: 3 },
        { quantity: 50 }
      ]);

      const result = await InventoryService.getLowStock();

      expect(result).toHaveLength(1);
    });
  });

  describe('adjust', () => {
    it('should increase quantity with positive adjustment', async () => {
      mockRepo.findById.mockResolvedValue({ ...inventory.wholeChicken1, quantity: 50 });
      mockRepo.findByIdAndUpdate.mockResolvedValue({ quantity: 60 });

      await InventoryService.adjust('test-inv-001', 10, 'New stock');

      expect(mockRepo.findByIdAndUpdate).toHaveBeenCalledWith(
        'test-inv-001',
        expect.objectContaining({ quantity: 60 })
      );
    });

    it('should decrease quantity with negative adjustment', async () => {
      mockRepo.findById.mockResolvedValue({ ...inventory.wholeChicken1, quantity: 50 });
      mockRepo.findByIdAndUpdate.mockResolvedValue({ quantity: 45 });

      await InventoryService.adjust('test-inv-001', -5, 'Damaged');

      expect(mockRepo.findByIdAndUpdate).toHaveBeenCalledWith(
        'test-inv-001',
        expect.objectContaining({ quantity: 45 })
      );
    });

    it('should prevent negative stock (floor at 0)', async () => {
      mockRepo.findById.mockResolvedValue({ ...inventory.lowStockItem, quantity: 3 });
      mockRepo.findByIdAndUpdate.mockResolvedValue({ quantity: 0 });

      await InventoryService.adjust('test-inv-004', -10, 'Major damage');

      expect(mockRepo.findByIdAndUpdate).toHaveBeenCalledWith(
        'test-inv-004',
        expect.objectContaining({ quantity: 0 })
      );
    });

    it('should throw if batch not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(InventoryService.adjust('nonexistent', 5, 'reason'))
        .rejects.toThrow('Batch not found');
    });
  });

  describe('transfer', () => {
    it('should create new batch at destination', async () => {
      mockRepo.findById.mockResolvedValue({ ...inventory.wholeChicken1, quantity: 50 });
      mockRepo.create.mockResolvedValue({ batchNumber: 'TRF-123-ABC' });
      mockRepo.findByIdAndUpdate.mockResolvedValue({});

      await InventoryService.transfer('test-inv-001', 'Cold Storage B', 20, 'Rebalance', { _id: 'user-1' });

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          storageLocation: 'Cold Storage B',
          quantity: 20,
          transferredFrom: 'test-inv-001'
        })
      );
    });

    it('should reduce source batch quantity', async () => {
      mockRepo.findById.mockResolvedValue({ ...inventory.wholeChicken1, quantity: 50 });
      mockRepo.create.mockResolvedValue({});
      mockRepo.findByIdAndUpdate.mockResolvedValue({});

      await InventoryService.transfer('test-inv-001', 'Cold Storage B', 20, 'Rebalance', { _id: 'user-1' });

      expect(mockRepo.findByIdAndUpdate).toHaveBeenCalledWith(
        'test-inv-001',
        expect.objectContaining({ quantity: 30 })
      );
    });

    it('should mark source as transferred when depleted', async () => {
      mockRepo.findById.mockResolvedValue({ ...inventory.wholeChicken1, quantity: 20 });
      mockRepo.create.mockResolvedValue({});
      mockRepo.findByIdAndUpdate.mockResolvedValue({});

      await InventoryService.transfer('test-inv-001', 'Cold Storage B', 20, 'Rebalance', { _id: 'user-1' });

      expect(mockRepo.findByIdAndUpdate).toHaveBeenCalledWith(
        'test-inv-001',
        expect.objectContaining({ quantity: 0, status: 'transferred' })
      );
    });

    it('should throw if batch not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(InventoryService.transfer('nonexistent', 'Loc', 10, 'reason', { _id: 'u' }))
        .rejects.toThrow('Batch not found');
    });

    it('should throw if transfer quantity exceeds stock', async () => {
      mockRepo.findById.mockResolvedValue({ ...inventory.wholeChicken1, quantity: 5 });

      await expect(InventoryService.transfer('test-inv-001', 'Loc', 10, 'reason', { _id: 'u' }))
        .rejects.toThrow('Transfer quantity exceeds available stock');
    });
  });

  describe('getTransfers', () => {
    it('should return items with transferredFrom field', async () => {
      mockRepo.find.mockResolvedValue([{ _id: 'trf-001', transferredFrom: 'test-inv-001' }]);

      const result = await InventoryService.getTransfers();

      expect(mockRepo.find).toHaveBeenCalledWith({ transferredFrom: { $exists: true } });
      expect(result).toHaveLength(1);
    });
  });

  describe('getReport', () => {
    it('should calculate totalItems, totalValue, totalQuantity', async () => {
      mockRepo.find.mockResolvedValue([
        { quantity: 50, pricePerUnit: 89.99, status: 'available', productType: 'Whole Chicken', storageLocation: 'A', expiryDate: new Date('2026-12-31') },
        { quantity: 30, pricePerUnit: 129.99, status: 'available', productType: 'Breast', storageLocation: 'B', expiryDate: new Date('2026-12-31') }
      ]);

      const report = await InventoryService.getReport();

      expect(report.totalItems).toBe(2);
      expect(report.totalQuantity).toBe(80);
      expect(report.totalValue).toBeCloseTo(50 * 89.99 + 30 * 129.99, 2);
    });

    it('should group by status', async () => {
      mockRepo.find.mockResolvedValue([
        { quantity: 50, pricePerUnit: 89.99, status: 'available', productType: 'A', storageLocation: 'X', expiryDate: new Date('2026-12-31') },
        { quantity: 10, pricePerUnit: 89.99, status: 'reserved', productType: 'A', storageLocation: 'X', expiryDate: new Date('2026-12-31') }
      ]);

      const report = await InventoryService.getReport();

      expect(report.byStatus.available).toBe(1);
      expect(report.byStatus.reserved).toBe(1);
    });

    it('should identify near-expiry items', async () => {
      const nearExpiry = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      mockRepo.find.mockResolvedValue([
        { quantity: 50, pricePerUnit: 89.99, status: 'available', productType: 'WC', storageLocation: 'A', expiryDate: nearExpiry }
      ]);

      const report = await InventoryService.getReport();
      expect(report.nearExpiry).toHaveLength(1);
    });

    it('should identify expired items', async () => {
      mockRepo.find.mockResolvedValue([
        { quantity: 15, pricePerUnit: 99.99, status: 'available', productType: 'Wings', storageLocation: 'B', expiryDate: new Date('2026-06-08') }
      ]);

      const report = await InventoryService.getReport();
      expect(report.expired).toHaveLength(1);
    });

    it('should calculate turnover rate', async () => {
      mockRepo.find.mockResolvedValue([
        { quantity: 50, pricePerUnit: 89.99, status: 'sold', productType: 'A', storageLocation: 'X', expiryDate: new Date('2026-12-31') },
        { quantity: 50, pricePerUnit: 89.99, status: 'available', productType: 'A', storageLocation: 'X', expiryDate: new Date('2026-12-31') }
      ]);

      const report = await InventoryService.getReport();
      // turnoverRate = (summary.sold / totalQuantity * 100) = (1 / 100 * 100) = 1
      expect(parseFloat(report.turnoverRate)).toBe(1);
    });
  });

  describe('count', () => {
    it('should return count of inventory items', async () => {
      mockRepo.count.mockResolvedValue(6);

      const result = await InventoryService.count();
      expect(result).toBe(6);
    });

    it('should accept optional query', async () => {
      mockRepo.count.mockResolvedValue(3);

      const result = await InventoryService.count({ status: 'available' });
      expect(result).toBe(3);
    });
  });
});
