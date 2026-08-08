/**
 * MedicationService Unit Tests
 * ============================
 * 
 * SRS Reference: FR-006 (Medication Tracking)
 * 
 * Tests MedicationService methods with mocked BaseRepository.
 */

const { medications } = require('./__fixtures__');

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

describe('MedicationService', () => {
  let MedicationService;

  beforeEach(() => {
    jest.clearAllMocks();
    MedicationService = require('../services/MedicationService');
  });

  describe('create', () => {
    it('should create medication with administeredBy field', async () => {
      const data = { cycle: 'test-cycle-001', medicationName: 'Antibiotic', dosage: '10ml' };
      mockRepo.create.mockResolvedValue({ _id: 'new-med', ...data, administeredBy: 'test-attendant-001', status: 'Active' });

      const result = await MedicationService.create(data, 'test-attendant-001');
      expect(result.administeredBy).toBe('test-attendant-001');
      expect(mockRepo.create).toHaveBeenCalledWith({ ...data, administeredBy: 'test-attendant-001', status: 'Active' });
    });

    it('should use provided status if given', async () => {
      const data = { cycle: 'test-cycle-001', medicationName: 'Vitamin', status: 'Completed' };
      mockRepo.create.mockResolvedValue({ _id: 'new-med', ...data, administeredBy: 'test-attendant-001' });

      const result = await MedicationService.create(data, 'test-attendant-001');
      expect(mockRepo.create).toHaveBeenCalledWith({ ...data, administeredBy: 'test-attendant-001', status: 'Completed' });
    });
  });

  describe('getAll', () => {
    it('should return all medications with no filters', async () => {
      mockRepo.find.mockResolvedValue([medications.activeMedication, medications.completedMedication]);

      const result = await MedicationService.getAll();
      expect(result).toHaveLength(2);
      expect(mockRepo.find).toHaveBeenCalledWith({});
    });

    it('should filter by status', async () => {
      mockRepo.find.mockResolvedValue([medications.activeMedication]);

      await MedicationService.getAll({ status: 'Active' });
      expect(mockRepo.find).toHaveBeenCalledWith({ status: 'Active' });
    });

    it('should filter by cycle', async () => {
      mockRepo.find.mockResolvedValue([medications.activeMedication]);

      await MedicationService.getAll({ cycle: 'test-cycle-001' });
      expect(mockRepo.find).toHaveBeenCalledWith({ cycle: 'test-cycle-001' });
    });

    it('should filter by medicationType', async () => {
      mockRepo.find.mockResolvedValue([medications.activeMedication]);

      await MedicationService.getAll({ medicationType: 'Antibiotic' });
      expect(mockRepo.find).toHaveBeenCalledWith({ medicationType: 'Antibiotic' });
    });
  });

  describe('getById', () => {
    it('should return medication when found', async () => {
      mockRepo.findById.mockResolvedValue(medications.activeMedication);

      const result = await MedicationService.getById('test-med-001');
      expect(result).toEqual(medications.activeMedication);
    });

    it('should return null when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      const result = await MedicationService.getById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getByCycle', () => {
    it('should return medications for a specific cycle', async () => {
      mockRepo.find.mockResolvedValue([medications.activeMedication]);

      const result = await MedicationService.getByCycle('test-cycle-001');
      expect(result).toHaveLength(1);
      expect(mockRepo.find).toHaveBeenCalledWith({ cycle: 'test-cycle-001' });
    });
  });

  describe('getActive', () => {
    it('should return only active medications', async () => {
      mockRepo.find.mockResolvedValue([medications.activeMedication, medications.expiringMedication]);

      const result = await MedicationService.getActive();
      expect(result).toHaveLength(2);
      expect(mockRepo.find).toHaveBeenCalledWith({ status: 'Active' });
    });
  });

  describe('getExpiring', () => {
    it('should return medications expiring within specified days', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      
      mockRepo.find.mockResolvedValue([
        { ...medications.expiringMedication, expiryDate: new Date('2026-08-10') }, // expiring soon
        { ...medications.activeMedication, expiryDate: new Date('2027-08-01') } // not expiring
      ]);

      const result = await MedicationService.getExpiring(30);
      expect(result).toHaveLength(1);
      expect(result[0].medicationName).toBe('Dewormer');
    });

    it('should default to 30 days if no parameter provided', async () => {
      mockRepo.find.mockResolvedValue([]);
      await MedicationService.getExpiring();
      expect(mockRepo.find).toHaveBeenCalledWith({ status: 'Active' });
    });
  });

  describe('update', () => {
    it('should update medication fields', async () => {
      const updated = { ...medications.activeMedication, dosage: '15ml' };
      mockRepo.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MedicationService.update('test-med-001', { dosage: '15ml' });
      expect(result.dosage).toBe('15ml');
    });
  });

  describe('complete', () => {
    it('should set status to Completed with completion timestamp', async () => {
      const completed = { ...medications.activeMedication, status: 'Completed', completedAt: new Date() };
      mockRepo.findByIdAndUpdate.mockResolvedValue(completed);

      const result = await MedicationService.complete('test-med-001');
      expect(result.status).toBe('Completed');
      expect(result.completedAt).toBeDefined();
    });
  });

  describe('cancel', () => {
    it('should set status to Cancelled with reason and timestamp', async () => {
      const cancelled = { 
        ...medications.activeMedication, 
        status: 'Cancelled', 
        cancellationReason: 'Adverse reaction',
        cancelledAt: new Date() 
      };
      mockRepo.findByIdAndUpdate.mockResolvedValue(cancelled);

      const result = await MedicationService.cancel('test-med-001', 'Adverse reaction');
      expect(result.status).toBe('Cancelled');
      expect(result.cancellationReason).toBe('Adverse reaction');
      expect(result.cancelledAt).toBeDefined();
    });
  });

  describe('count', () => {
    it('should return total medication count', async () => {
      mockRepo.count.mockResolvedValue(15);

      const result = await MedicationService.count();
      expect(result).toBe(15);
    });
  });
});
