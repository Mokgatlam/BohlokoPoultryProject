/**
 * HarvestService Unit Tests
 * =========================
 * 
 * SRS Reference: FR-007 (Harvesting & Processing), FR-008 (Inventory Management)
 * 
 * Tests HarvestService methods with mocked BaseRepository.
 */

const { harvestBatches, processingBatches } = require('./__fixtures__');

let mockRepo;

beforeAll(() => {
  jest.resetModules();
  mockRepo = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    count: jest.fn(),
    collection: { update: jest.fn() }
  };
  jest.mock('../repositories/BaseRepository', () => {
    return jest.fn().mockImplementation(() => mockRepo);
  });
  jest.mock('../config/db', () => ({}));
});

describe('HarvestService', () => {
  let HarvestService;

  beforeEach(() => {
    jest.clearAllMocks();
    HarvestService = require('../services/HarvestService');
  });

  describe('createHarvestBatch', () => {
    it('should create harvest batch with createdBy field', async () => {
      const data = { cycle: 'test-cycle-001', harvestDate: '2026-08-10', birdCount: 100 };
      mockRepo.create.mockResolvedValue({ _id: 'new-harvest', ...data, createdBy: 'test-admin-001' });

      const result = await HarvestService.createHarvestBatch(data, 'test-admin-001');
      expect(result.createdBy).toBe('test-admin-001');
      expect(mockRepo.create).toHaveBeenCalledWith({ ...data, createdBy: 'test-admin-001' });
    });
  });

  describe('getHarvestBatches', () => {
    it('should return all harvest batches with no filters', async () => {
      mockRepo.find.mockResolvedValue([harvestBatches.scheduledBatch, harvestBatches.completedBatch]);

      const result = await HarvestService.getHarvestBatches();
      expect(result).toHaveLength(2);
      expect(mockRepo.find).toHaveBeenCalledWith({});
    });

    it('should filter by status', async () => {
      mockRepo.find.mockResolvedValue([harvestBatches.inProgressBatch]);

      const result = await HarvestService.getHarvestBatches({ status: 'In Progress' });
      expect(mockRepo.find).toHaveBeenCalledWith({ status: 'In Progress' });
    });

    it('should filter by cycle', async () => {
      mockRepo.find.mockResolvedValue([harvestBatches.inProgressBatch]);

      const result = await HarvestService.getHarvestBatches({ cycle: 'test-cycle-001' });
      expect(mockRepo.find).toHaveBeenCalledWith({ cycle: 'test-cycle-001' });
    });
  });

  describe('getHarvestBatchById', () => {
    it('should return harvest batch when found', async () => {
      mockRepo.findById.mockResolvedValue(harvestBatches.completedBatch);

      const result = await HarvestService.getHarvestBatchById('test-harvest-003');
      expect(result).toEqual(harvestBatches.completedBatch);
    });

    it('should return null when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      const result = await HarvestService.getHarvestBatchById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('updateHarvestBatch', () => {
    it('should update harvest batch fields', async () => {
      const updated = { ...harvestBatches.scheduledBatch, birdCount: 200 };
      mockRepo.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await HarvestService.updateHarvestBatch('test-harvest-001', { birdCount: 200 });
      expect(result.birdCount).toBe(200);
    });
  });

  describe('startHarvestBatch', () => {
    it('should set status to In Progress with start details', async () => {
      const started = { ...harvestBatches.scheduledBatch, status: 'In Progress', startedAt: new Date(), startedBy: 'test-attendant-001' };
      mockRepo.findByIdAndUpdate.mockResolvedValue(started);

      const result = await HarvestService.startHarvestBatch('test-harvest-001', 'test-attendant-001');
      expect(result.status).toBe('In Progress');
      expect(result.startedBy).toBe('test-attendant-001');
    });
  });

  describe('completeHarvestBatch', () => {
    it('should set status to Completed with actual results', async () => {
      const completed = { ...harvestBatches.inProgressBatch, status: 'Completed', actualWeight: 850, actualCount: 490, notes: 'Good harvest' };
      mockRepo.findByIdAndUpdate.mockResolvedValue(completed);

      const result = await HarvestService.completeHarvestBatch('test-harvest-002', { actualWeight: 850, actualCount: 490, notes: 'Good harvest' }, 'test-attendant-001');
      expect(result.status).toBe('Completed');
      expect(result.actualWeight).toBe(850);
    });
  });

  describe('createProcessingBatch', () => {
    it('should create processing batch with createdBy field', async () => {
      const data = { harvestBatch: 'test-harvest-001', productType: 'Whole Chicken', processingDate: '2026-08-11' };
      mockRepo.create.mockResolvedValue({ _id: 'new-proc', ...data, createdBy: 'test-admin-001' });

      const result = await HarvestService.createProcessingBatch(data, 'test-admin-001');
      expect(result.createdBy).toBe('test-admin-001');
    });
  });

  describe('getProcessingBatchs', () => {
    it('should return all processing batches', async () => {
      mockRepo.find.mockResolvedValue([processingBatches.scheduledBatch, processingBatches.completedBatch]);

      const result = await HarvestService.getProcessingBatchs();
      expect(result).toHaveLength(2);
    });

    it('should filter by status', async () => {
      mockRepo.find.mockResolvedValue([processingBatches.processingBatch]);

      await HarvestService.getProcessingBatchs({ status: 'Processing' });
      expect(mockRepo.find).toHaveBeenCalledWith({ status: 'Processing' });
    });
  });

  describe('getProcessingBatchById', () => {
    it('should return processing batch when found', async () => {
      mockRepo.findById.mockResolvedValue(processingBatches.completedBatch);

      const result = await HarvestService.getProcessingBatchById('test-proc-003');
      expect(result).toEqual(processingBatches.completedBatch);
    });
  });

  describe('updateProcessingBatch', () => {
    it('should update processing batch fields', async () => {
      const updated = { ...processingBatches.scheduledBatch, expectedOutput: 200 };
      mockRepo.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await HarvestService.updateProcessingBatch('test-proc-001', { expectedOutput: 200 });
      expect(result.expectedOutput).toBe(200);
    });
  });

  describe('startProcessingBatch', () => {
    it('should set status to Processing with start details', async () => {
      const started = { ...processingBatches.scheduledBatch, status: 'Processing', startedAt: new Date(), startedBy: 'test-processing-001' };
      mockRepo.findByIdAndUpdate.mockResolvedValue(started);

      const result = await HarvestService.startProcessingBatch('test-proc-001', 'test-processing-001');
      expect(result.status).toBe('Processing');
      expect(result.startedBy).toBe('test-processing-001');
    });
  });

  describe('completeProcessingBatch', () => {
    it('should set status to Completed with output metrics', async () => {
      const completed = { ...processingBatches.processingBatch, status: 'Completed', outputQuantity: 140, outputWeight: 110, wasteWeight: 10 };
      mockRepo.findByIdAndUpdate.mockResolvedValue(completed);

      const result = await HarvestService.completeProcessingBatch('test-proc-002', { outputQuantity: 140, outputWeight: 110, wasteWeight: 10 }, 'test-processing-001');
      expect(result.status).toBe('Completed');
      expect(result.outputQuantity).toBe(140);
    });

    it('should create inventory item when createInventory is true', async () => {
      const batch = { ...processingBatches.processingBatch, harvestBatch: 'test-harvest-003' };
      const harvest = { ...harvestBatches.completedBatch, cycle: 'test-cycle-003' };
      const inventoryItem = { _id: 'new-inv', productType: 'Breast', quantity: 140 };

      mockRepo.findByIdAndUpdate
        .mockResolvedValueOnce(batch) // completeProcessingBatch
        .mockResolvedValueOnce({ ...batch, inventoryItem: 'new-inv' }); // link inventory

      mockRepo.findById.mockResolvedValue(harvest);
      mockRepo.create.mockResolvedValue(inventoryItem);

      const result = await HarvestService.completeProcessingBatch('test-proc-002', { 
        outputQuantity: 140, outputWeight: 110, createInventory: true 
      }, 'test-processing-001');

      expect(mockRepo.create).toHaveBeenCalled();
    });
  });

  describe('createProcessingStep', () => {
    it('should create processing step with createdBy field', async () => {
      const data = { processingBatch: 'test-proc-001', stepType: 'Slaughter' };
      mockRepo.create.mockResolvedValue({ _id: 'new-step', ...data, createdBy: 'test-processing-001' });

      const result = await HarvestService.createProcessingStep(data, 'test-processing-001');
      expect(result.createdBy).toBe('test-processing-001');
    });
  });

  describe('getProcessingSteps', () => {
    it('should return steps for a batch', async () => {
      mockRepo.find.mockResolvedValue([{ _id: 'step-1', processingBatch: 'test-proc-001' }]);

      const result = await HarvestService.getProcessingSteps('test-proc-001');
      expect(result).toHaveLength(1);
      expect(mockRepo.find).toHaveBeenCalledWith({ processingBatch: 'test-proc-001' });
    });
  });

  describe('completeProcessingStep', () => {
    it('should set status to Completed with completion details', async () => {
      const completed = { _id: 'step-1', status: 'Completed', endTime: new Date(), outputQuantity: 50 };
      mockRepo.findByIdAndUpdate.mockResolvedValue(completed);

      const result = await HarvestService.completeProcessingStep('step-1', { outputQuantity: 50 }, 'test-processing-001');
      expect(result.status).toBe('Completed');
      expect(result.outputQuantity).toBe(50);
    });
  });

  describe('createYieldRecord', () => {
    it('should calculate yield percentage automatically', async () => {
      const data = { processingBatch: 'test-proc-003', inputWeight: 100, outputWeight: 85 };
      mockRepo.create.mockResolvedValue({ _id: 'new-yield', ...data, yieldPercentage: 85 });

      const result = await HarvestService.createYieldRecord(data, 'test-processing-001');
      expect(result.yieldPercentage).toBe(85);
      expect(mockRepo.create).toHaveBeenCalledWith({ ...data, yieldPercentage: 85, recordedBy: 'test-processing-001' });
    });
  });

  describe('getYieldRecords', () => {
    it('should return all yield records with no filters', async () => {
      mockRepo.find.mockResolvedValue([{ _id: 'yield-1', yieldPercentage: 85 }]);

      const result = await HarvestService.getYieldRecords();
      expect(result).toHaveLength(1);
    });

    it('should filter by processingBatch', async () => {
      mockRepo.find.mockResolvedValue([{ _id: 'yield-1', processingBatch: 'test-proc-003' }]);

      await HarvestService.getYieldRecords({ processingBatch: 'test-proc-003' });
      expect(mockRepo.find).toHaveBeenCalledWith({ processingBatch: 'test-proc-003' });
    });
  });

  describe('createQualityCheck', () => {
    it('should create quality check with inspectedBy field', async () => {
      const data = { processingBatch: 'test-proc-003', checkType: 'Visual', result: 'Pass' };
      mockRepo.create.mockResolvedValue({ _id: 'new-qc', ...data, inspectedBy: 'test-admin-001' });

      const result = await HarvestService.createQualityCheck(data, 'test-admin-001');
      expect(result.inspectedBy).toBe('test-admin-001');
    });
  });

  describe('getQualityChecks', () => {
    it('should return quality checks for a batch', async () => {
      mockRepo.find.mockResolvedValue([{ _id: 'qc-1', processingBatch: 'test-proc-003' }]);

      const result = await HarvestService.getQualityChecks('test-proc-003');
      expect(result).toHaveLength(1);
    });
  });

  describe('createStaffAssignment', () => {
    it('should create staff assignment with assignedBy field', async () => {
      const data = { staff: 'test-processing-001', processingBatch: 'test-proc-001', role: 'Operator' };
      mockRepo.create.mockResolvedValue({ _id: 'new-assign', ...data, assignedBy: 'test-admin-001' });

      const result = await HarvestService.createStaffAssignment(data, 'test-admin-001');
      expect(result.assignedBy).toBe('test-admin-001');
    });
  });

  describe('getStaffAssignments', () => {
    it('should return staff assignments for a batch', async () => {
      mockRepo.find.mockResolvedValue([{ _id: 'assign-1', processingBatch: 'test-proc-001' }]);

      const result = await HarvestService.getStaffAssignments('test-proc-001');
      expect(result).toHaveLength(1);
    });
  });

  describe('getHarvestDashboard', () => {
    it('should aggregate harvest dashboard data', async () => {
      mockRepo.find
        .mockResolvedValueOnce([harvestBatches.completedBatch]) // harvestBatches
        .mockResolvedValueOnce([processingBatches.completedBatch]) // processingBatches
        .mockResolvedValueOnce([{ yieldPercentage: 85 }]); // yieldRecords

      const result = await HarvestService.getHarvestDashboard();
      expect(result.totalHarvests).toBe(1);
      expect(result.totalProcessing).toBe(1);
      expect(result.totalBirdsHarvested).toBe(195);
    });

    it('should calculate average yield correctly', async () => {
      mockRepo.find
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ yieldPercentage: 80 }, { yieldPercentage: 90 }]);

      const result = await HarvestService.getHarvestDashboard();
      expect(result.avgYield).toBe('85.0');
    });
  });
});
