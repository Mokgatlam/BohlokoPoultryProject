/**
 * ConfigService Unit Tests
 * ========================
 * 
 * SRS Reference: FR-022 (System Configuration)
 * 
 * Tests ConfigService methods with mocked BaseRepository and database.
 */

const mockCollection = {
  update: jest.fn(),
  insert: jest.fn(),
  remove: jest.fn()
};

const mockRepo = {
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  count: jest.fn(),
  collection: mockCollection
};

jest.mock('../repositories/BaseRepository', () => {
  return jest.fn().mockImplementation(() => mockRepo);
});

jest.mock('../config/db', () => ({
  systemConfig: {}
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234')
}));

let ConfigService;

beforeAll(() => {
  jest.resetModules();
  ConfigService = require('../services/ConfigService');
});

describe('ConfigService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all configs as key-value object', async () => {
      mockRepo.find.mockResolvedValue([
        { key: 'taxRate', value: 15 },
        { key: 'currency', value: 'ZAR' }
      ]);

      const result = await ConfigService.getAll();
      expect(result).toEqual({ taxRate: 15, currency: 'ZAR' });
    });

    it('should return empty object when no configs exist', async () => {
      mockRepo.find.mockResolvedValue([]);
      const result = await ConfigService.getAll();
      expect(result).toEqual({});
    });
  });

  describe('get', () => {
    it('should return value for existing key', async () => {
      mockRepo.findOne.mockResolvedValue({ key: 'taxRate', value: 15 });
      const result = await ConfigService.get('taxRate');
      expect(result).toBe(15);
    });

    it('should return null for non-existent key', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await ConfigService.get('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should create new config when key does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockCollection.insert.mockResolvedValue();

      await ConfigService.set('taxRate', 15, 'user-001');
      expect(mockCollection.insert).toHaveBeenCalledTimes(1);
      expect(mockCollection.update).not.toHaveBeenCalled();
    });

    it('should update existing config when key exists', async () => {
      mockRepo.findOne.mockResolvedValue({ key: 'taxRate', value: 10 });
      mockCollection.update.mockResolvedValue();

      await ConfigService.set('taxRate', 20, 'user-001');
      expect(mockCollection.update).toHaveBeenCalledTimes(1);
      expect(mockCollection.insert).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update allowed keys', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockCollection.insert.mockResolvedValue();
      mockRepo.find.mockResolvedValue([{ key: 'taxRate', value: 20 }]);

      const result = await ConfigService.update({ taxRate: 20 }, 'user-001');
      expect(result).toHaveProperty('taxRate');
    });

    it('should filter out disallowed keys', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockCollection.insert.mockResolvedValue();

      await expect(ConfigService.update({ hackedKey: 'value' }, 'user-001'))
        .rejects.toThrow('No valid config keys provided');
    });

    it('should throw when no valid keys provided', async () => {
      await expect(ConfigService.update({}, 'user-001'))
        .rejects.toThrow('No valid config keys provided');
    });

    it('should update multiple allowed keys at once', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockCollection.insert.mockResolvedValue();
      mockRepo.find.mockResolvedValue([
        { key: 'taxRate', value: 15 },
        { key: 'shippingLocal', value: 75 }
      ]);

      const result = await ConfigService.update({ taxRate: 15, shippingLocal: 75 }, 'user-001');
      expect(mockCollection.insert).toHaveBeenCalledTimes(2);
    });
  });

  describe('initDefaults', () => {
    it('should create default configs that do not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockCollection.insert.mockResolvedValue();

      await ConfigService.initDefaults();
      expect(mockRepo.findOne).toHaveBeenCalled();
      expect(mockCollection.insert).toHaveBeenCalled();
    });

    it('should skip configs that already exist', async () => {
      mockRepo.findOne.mockResolvedValue({ key: 'taxRate', value: 15 });

      await ConfigService.initDefaults();
      expect(mockCollection.insert).not.toHaveBeenCalled();
    });
  });
});
