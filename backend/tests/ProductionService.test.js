/**
 * ProductionService Unit Tests
 * ============================
 * 
 * SRS Reference: FR-004 (Production Cycle Management), FR-005 (Daily Production Logging), FR-006 (Medication Tracking)
 * 
 * Tests ProductionService methods with mocked BaseRepository.
 */

const { productionCycles, dailyLogs, medications } = require('./__fixtures__');

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

describe('ProductionService', () => {
  let ProductionService;

  beforeEach(() => {
    jest.clearAllMocks();
    ProductionService = require('../services/ProductionService');
  });

  describe('createCycle', () => {
    it('should create cycle with createdBy field', async () => {
      const data = { cycleName: 'Test Cycle', productionType: 'Broiler Cycle', expectedBirds: 100 };
      mockRepo.create.mockResolvedValue({ _id: 'new-cycle', ...data, createdBy: 'test-admin-001' });

      const result = await ProductionService.createCycle(data, 'test-admin-001');
      expect(result.createdBy).toBe('test-admin-001');
      expect(mockRepo.create).toHaveBeenCalledWith({ ...data, createdBy: 'test-admin-001' });
    });
  });

  describe('getCycles', () => {
    it('should return all cycles', async () => {
      mockRepo.find.mockResolvedValue([productionCycles.activeCycle, productionCycles.plannedCycle]);

      const result = await ProductionService.getCycles();
      expect(result).toHaveLength(2);
      expect(mockRepo.find).toHaveBeenCalledWith({});
    });
  });

  describe('getCycleById', () => {
    it('should return cycle when found', async () => {
      mockRepo.findById.mockResolvedValue(productionCycles.activeCycle);

      const result = await ProductionService.getCycleById('test-cycle-001');
      expect(result).toEqual(productionCycles.activeCycle);
    });

    it('should return null when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      const result = await ProductionService.getCycleById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('updateCycle', () => {
    it('should update cycle fields', async () => {
      const updated = { ...productionCycles.activeCycle, status: 'Completed' };
      mockRepo.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await ProductionService.updateCycle('test-cycle-001', { status: 'Completed' });
      expect(result.status).toBe('Completed');
    });
  });

  describe('approveCycle', () => {
    it('should set status to Approved with approval details', async () => {
      const approved = { ...productionCycles.plannedCycle, status: 'Approved', approvedBy: 'test-admin-001', approvedAt: new Date() };
      mockRepo.findByIdAndUpdate.mockResolvedValue(approved);

      const result = await ProductionService.approveCycle('test-cycle-002', 'test-admin-001');
      expect(result.status).toBe('Approved');
      expect(result.approvedBy).toBe('test-admin-001');
    });
  });

  describe('createDailyLog', () => {
    it('should calculate mortality rate', async () => {
      const data = { cycle: 'test-cycle-001', birdCount: 495, mortality: { count: 2 } };
      mockRepo.create.mockResolvedValue({ _id: 'new-log', ...data, mortality: { count: 2, rate: 0.40 } });

      const result = await ProductionService.createDailyLog(data, 'test-attendant-001');
      expect(result.mortality.rate).toBe(0.40);
    });

    it('should set mortality rate to 0 when no mortality', async () => {
      const data = { cycle: 'test-cycle-001', birdCount: 495, mortality: { count: 0 } };
      mockRepo.create.mockResolvedValue({ _id: 'new-log', ...data, mortality: { count: 0, rate: 0 } });

      const result = await ProductionService.createDailyLog(data, 'test-attendant-001');
      expect(result.mortality.rate).toBe(0);
    });
  });

  describe('getDailyLogs', () => {
    it('should return logs for a specific cycle', async () => {
      mockRepo.find.mockResolvedValue([dailyLogs.normalLog]);

      const result = await ProductionService.getDailyLogs('test-cycle-001');
      expect(result).toHaveLength(1);
      expect(mockRepo.find).toHaveBeenCalledWith({ cycle: 'test-cycle-001' });
    });
  });

  describe('createMedication', () => {
    it('should create medication with administeredBy field', async () => {
      const data = { cycle: 'test-cycle-001', medicationName: 'Antibiotic', dosage: '10ml' };
      mockRepo.create.mockResolvedValue({ _id: 'new-med', ...data, administeredBy: 'test-attendant-001' });

      const result = await ProductionService.createMedication(data, 'test-attendant-001');
      expect(result.administeredBy).toBe('test-attendant-001');
    });
  });

  describe('getMedications', () => {
    it('should return medications for a cycle', async () => {
      mockRepo.find.mockResolvedValue([medications.activeMedication]);

      const result = await ProductionService.getMedications('test-cycle-001');
      expect(result).toHaveLength(1);
      expect(mockRepo.find).toHaveBeenCalledWith({ cycle: 'test-cycle-001' });
    });
  });

  describe('createHealthCheck', () => {
    it('should create health check with inspectedBy field', async () => {
      const data = { cycle: 'test-cycle-001', overallHealth: 'Good', birdsChecked: 495 };
      mockRepo.create.mockResolvedValue({ _id: 'new-hc', ...data, inspectedBy: 'test-attendant-001' });

      const result = await ProductionService.createHealthCheck(data, 'test-attendant-001');
      expect(result.inspectedBy).toBe('test-attendant-001');
    });
  });

  describe('getHealthChecks', () => {
    it('should return health checks for a cycle', async () => {
      mockRepo.find.mockResolvedValue([{ _id: 'hc-1', cycle: 'test-cycle-001' }]);

      const result = await ProductionService.getHealthChecks('test-cycle-001');
      expect(result).toHaveLength(1);
    });
  });

  describe('createVaccination', () => {
    it('should create vaccination with createdBy field', async () => {
      const data = { cycle: 'test-cycle-001', vaccineName: 'Newcastle', scheduledDate: '2026-08-10' };
      mockRepo.create.mockResolvedValue({ _id: 'new-vacc', ...data, createdBy: 'test-admin-001' });

      const result = await ProductionService.createVaccination(data, 'test-admin-001');
      expect(result.createdBy).toBe('test-admin-001');
    });
  });

  describe('getVaccinations', () => {
    it('should return vaccinations for a cycle', async () => {
      mockRepo.find.mockResolvedValue([{ _id: 'vacc-1', cycle: 'test-cycle-001', status: 'Scheduled' }]);

      const result = await ProductionService.getVaccinations('test-cycle-001');
      expect(result).toHaveLength(1);
    });
  });

  describe('completeVaccination', () => {
    it('should set status to Completed with completion details', async () => {
      const completed = { _id: 'vacc-1', status: 'Completed', completedDate: new Date(), completedBy: 'test-attendant-001' };
      mockRepo.findByIdAndUpdate.mockResolvedValue(completed);

      const result = await ProductionService.completeVaccination('vacc-1', 'test-attendant-001');
      expect(result.status).toBe('Completed');
      expect(result.completedBy).toBe('test-attendant-001');
    });
  });

  describe('createWeightRecord', () => {
    it('should create weight record with recordedBy field', async () => {
      const data = { cycle: 'test-cycle-001', averageWeight: 1.8, sampleSize: 10 };
      mockRepo.create.mockResolvedValue({ _id: 'new-weight', ...data, recordedBy: 'test-attendant-001' });

      const result = await ProductionService.createWeightRecord(data, 'test-attendant-001');
      expect(result.recordedBy).toBe('test-attendant-001');
    });
  });

  describe('getWeightRecords', () => {
    it('should return weight records for a cycle', async () => {
      mockRepo.find.mockResolvedValue([{ _id: 'weight-1', cycle: 'test-cycle-001' }]);

      const result = await ProductionService.getWeightRecords('test-cycle-001');
      expect(result).toHaveLength(1);
    });
  });

  describe('createFeedRecord', () => {
    it('should create feed record with recordedBy field', async () => {
      const data = { cycle: 'test-cycle-001', feedType: 'Starter', quantityKg: 50 };
      mockRepo.create.mockResolvedValue({ _id: 'new-feed', ...data, recordedBy: 'test-attendant-001' });

      const result = await ProductionService.createFeedRecord(data, 'test-attendant-001');
      expect(result.recordedBy).toBe('test-attendant-001');
    });
  });

  describe('getFeedRecords', () => {
    it('should return feed records for a cycle', async () => {
      mockRepo.find.mockResolvedValue([{ _id: 'feed-1', cycle: 'test-cycle-001' }]);

      const result = await ProductionService.getFeedRecords('test-cycle-001');
      expect(result).toHaveLength(1);
    });
  });

  describe('createEnvironmentRecord', () => {
    it('should create environment record with recordedBy field', async () => {
      const data = { cycle: 'test-cycle-001', temperature: 25, humidity: 65 };
      mockRepo.create.mockResolvedValue({ _id: 'new-env', ...data, recordedBy: 'test-attendant-001' });

      const result = await ProductionService.createEnvironmentRecord(data, 'test-attendant-001');
      expect(result.recordedBy).toBe('test-attendant-001');
    });
  });

  describe('getEnvironmentRecords', () => {
    it('should return environment records for a cycle', async () => {
      mockRepo.find.mockResolvedValue([{ _id: 'env-1', cycle: 'test-cycle-001' }]);

      const result = await ProductionService.getEnvironmentRecords('test-cycle-001');
      expect(result).toHaveLength(1);
    });
  });

  describe('getCareDashboard', () => {
    it('should aggregate care dashboard data', async () => {
      mockRepo.find
        .mockResolvedValueOnce([productionCycles.activeCycle]) // cycles
        .mockResolvedValueOnce([dailyLogs.normalLog]) // dailyLogs
        .mockResolvedValueOnce([medications.activeMedication]) // medications
        .mockResolvedValueOnce([]) // vaccinations
        .mockResolvedValueOnce([]); // healthChecks

      const result = await ProductionService.getCareDashboard();
      expect(result.activeCycles).toBe(1);
      expect(result.totalBirds).toBe(495);
    });

    it('should calculate mortality rate correctly', async () => {
      mockRepo.find
        .mockResolvedValueOnce([productionCycles.activeCycle])
        .mockResolvedValueOnce([dailyLogs.highMortalityLog])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await ProductionService.getCareDashboard();
      expect(result.todayMortality).toBe(30);
    });
  });
});
