/**
 * SystemLogService Unit Tests
 * ===========================
 * 
 * SRS Reference: FR-023 (Data Management)
 * 
 * Tests SystemLogService methods with mocked BaseRepository and database.
 */

const mockRepo = {
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  count: jest.fn(),
  collection: { remove: jest.fn() }
};

jest.mock('../repositories/BaseRepository', () => {
  return jest.fn().mockImplementation(() => mockRepo);
});

jest.mock('../config/db', () => ({
  systemLogs: {}
}));

let SystemLogService;

beforeAll(() => {
  jest.resetModules();
  SystemLogService = require('../services/SystemLogService');
});

describe('SystemLogService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a log entry with default values', async () => {
      const data = { message: 'System started' };
      mockRepo.create.mockResolvedValue({ _id: 'log-001', level: 'info', category: 'system', ...data });

      const result = await SystemLogService.create(data);
      expect(result.level).toBe('info');
      expect(result.category).toBe('system');
      expect(mockRepo.create).toHaveBeenCalledTimes(1);
    });

    it('should pass all provided fields', async () => {
      const data = {
        level: 'error', message: 'Failed', category: 'order',
        userId: 'usr-001', userName: 'Admin', action: 'create_order',
        resource: 'order', resourceId: 'ord-001', details: { error: 'test' },
        ipAddress: '127.0.0.1', userAgent: 'Mozilla/5.0', method: 'POST',
        path: '/api/orders', statusCode: 500, responseTime: 250,
        error: 'Internal error', stack: 'Error at ...'
      };
      mockRepo.create.mockResolvedValue({ _id: 'log-002', ...data });

      const result = await SystemLogService.create(data);
      expect(result.level).toBe('error');
      expect(result.statusCode).toBe(500);
      expect(result.action).toBe('create_order');
    });

    it('should always set timestamp', async () => {
      mockRepo.create.mockResolvedValue({ _id: 'log-003' });

      await SystemLogService.create({ message: 'Test' });
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ timestamp: expect.any(Date) })
      );
    });
  });

  describe('getAll', () => {
    it('should return all logs with no filters', async () => {
      const logs = [{ _id: '1', level: 'info' }, { _id: '2', level: 'error' }];
      mockRepo.find.mockResolvedValue(logs);

      const result = await SystemLogService.getAll();
      expect(result).toEqual(logs);
      expect(mockRepo.find).toHaveBeenCalledWith({});
    });

    it('should filter by level', async () => {
      mockRepo.find.mockResolvedValue([]);

      await SystemLogService.getAll({ level: 'error' });
      expect(mockRepo.find).toHaveBeenCalledWith({ level: 'error' });
    });

    it('should filter by category', async () => {
      mockRepo.find.mockResolvedValue([]);

      await SystemLogService.getAll({ category: 'auth' });
      expect(mockRepo.find).toHaveBeenCalledWith({ category: 'auth' });
    });

    it('should filter by userId', async () => {
      mockRepo.find.mockResolvedValue([]);

      await SystemLogService.getAll({ userId: 'usr-001' });
      expect(mockRepo.find).toHaveBeenCalledWith({ userId: 'usr-001' });
    });

    it('should filter by date range', async () => {
      mockRepo.find.mockResolvedValue([]);

      await SystemLogService.getAll({ startDate: '2026-01-01', endDate: '2026-08-08' });
      expect(mockRepo.find).toHaveBeenCalledWith({
        timestamp: { $gte: new Date('2026-01-01'), $lte: new Date('2026-08-08') }
      });
    });

    it('should combine multiple filters', async () => {
      mockRepo.find.mockResolvedValue([]);

      await SystemLogService.getAll({ level: 'error', category: 'order', userId: 'usr-001' });
      expect(mockRepo.find).toHaveBeenCalledWith({
        level: 'error', category: 'order', userId: 'usr-001'
      });
    });
  });

  describe('getById', () => {
    it('should return log when found', async () => {
      const log = { _id: 'log-001', level: 'info' };
      mockRepo.findById.mockResolvedValue(log);

      const result = await SystemLogService.getById('log-001');
      expect(result).toEqual(log);
    });

    it('should return null when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      const result = await SystemLogService.getById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getByLevel', () => {
    it('should return logs matching level', async () => {
      const logs = [{ _id: '1', level: 'error' }];
      mockRepo.find.mockResolvedValue(logs);

      const result = await SystemLogService.getByLevel('error');
      expect(result).toEqual(logs);
      expect(mockRepo.find).toHaveBeenCalledWith({ level: 'error' });
    });
  });

  describe('getByUser', () => {
    it('should return logs for a specific user', async () => {
      mockRepo.find.mockResolvedValue([]);

      await SystemLogService.getByUser('usr-001');
      expect(mockRepo.find).toHaveBeenCalledWith({ userId: 'usr-001' });
    });
  });

  describe('getByCategory', () => {
    it('should return logs matching category', async () => {
      mockRepo.find.mockResolvedValue([]);

      await SystemLogService.getByCategory('payment');
      expect(mockRepo.find).toHaveBeenCalledWith({ category: 'payment' });
    });
  });

  describe('getRecent', () => {
    it('should return recent logs with default limit', async () => {
      const logs = Array.from({ length: 150 }, (_, i) => ({ _id: `log${i}` }));
      mockRepo.find.mockResolvedValue(logs);

      const result = await SystemLogService.getRecent();
      expect(result).toHaveLength(100);
    });

    it('should respect custom limit', async () => {
      const logs = Array.from({ length: 10 }, (_, i) => ({ _id: `log${i}` }));
      mockRepo.find.mockResolvedValue(logs);

      const result = await SystemLogService.getRecent(5);
      expect(result).toHaveLength(5);
    });
  });

  describe('getErrors', () => {
    it('should return error logs with default limit', async () => {
      const errors = Array.from({ length: 60 }, (_, i) => ({ _id: `err${i}`, level: 'error' }));
      mockRepo.find.mockResolvedValue(errors);

      const result = await SystemLogService.getErrors();
      expect(result).toHaveLength(50);
    });

    it('should respect custom limit', async () => {
      const errors = [{ _id: 'e1' }, { _id: 'e2' }];
      mockRepo.find.mockResolvedValue(errors);

      const result = await SystemLogService.getErrors(10);
      expect(result).toHaveLength(2);
    });
  });

  describe('clearOldLogs', () => {
    it('should delete logs older than specified days', async () => {
      const oldLogs = [{ _id: 'old1' }, { _id: 'old2' }];
      mockRepo.find.mockResolvedValue(oldLogs);
      mockRepo.collection.remove.mockResolvedValue();

      const count = await SystemLogService.clearOldLogs(90);
      expect(count).toBe(2);
      expect(mockRepo.collection.remove).toHaveBeenCalledTimes(2);
    });

    it('should return 0 when no old logs', async () => {
      mockRepo.find.mockResolvedValue([]);

      const count = await SystemLogService.clearOldLogs(90);
      expect(count).toBe(0);
      expect(mockRepo.collection.remove).not.toHaveBeenCalled();
    });

    it('should use custom days parameter', async () => {
      mockRepo.find.mockResolvedValue([]);

      await SystemLogService.clearOldLogs(30);
      expect(mockRepo.find).toHaveBeenCalled();
    });
  });

  describe('count', () => {
    it('should return total log count', async () => {
      mockRepo.count.mockResolvedValue(250);

      const result = await SystemLogService.count();
      expect(result).toBe(250);
    });
  });
});
