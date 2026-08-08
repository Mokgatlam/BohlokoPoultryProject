/**
 * NotificationService Unit Tests
 * ==============================
 * 
 * SRS Reference: FR-015 (Notification System)
 * 
 * Tests NotificationService methods with mocked BaseRepository and database.
 */

const mockRepo = {
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  count: jest.fn()
};

jest.mock('../repositories/BaseRepository', () => {
  return jest.fn().mockImplementation(() => mockRepo);
});

jest.mock('../config/db', () => ({
  notifications: {}
}));

let NotificationService;

beforeAll(() => {
  jest.resetModules();
  NotificationService = require('../services/NotificationService');
});

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a notification with default values', async () => {
      const data = { userId: 'usr-001', type: 'info', title: 'Test', message: 'Hello' };
      mockRepo.create.mockResolvedValue({ _id: 'notif-001', ...data, priority: 'normal' });

      const result = await NotificationService.create(data);
      expect(result.priority).toBe('normal');
      expect(mockRepo.create).toHaveBeenCalledTimes(1);
    });

    it('should pass custom priority', async () => {
      const data = { userId: 'usr-001', type: 'warning', title: 'Alert', message: 'Low stock', priority: 'high' };
      mockRepo.create.mockResolvedValue({ _id: 'notif-002', priority: 'high' });

      const result = await NotificationService.create(data);
      expect(result.priority).toBe('high');
    });

    it('should pass actionUrl and expiresAt', async () => {
      const expires = new Date('2026-12-31');
      const data = { userId: 'usr-001', type: 'info', title: 'T', message: 'M', actionUrl: '/orders/123', expiresAt: expires };
      mockRepo.create.mockResolvedValue({ _id: 'notif-003' });

      await NotificationService.create(data);
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ actionUrl: '/orders/123', expiresAt: expires })
      );
    });
  });

  describe('getByUser', () => {
    it('should return notifications for a user', async () => {
      const notifs = [{ _id: '1', userId: 'usr-001' }];
      mockRepo.find.mockResolvedValue(notifs);

      const result = await NotificationService.getByUser('usr-001');
      expect(result).toEqual(notifs);
      expect(mockRepo.find).toHaveBeenCalledWith({ userId: 'usr-001' });
    });

    it('should filter unread only', async () => {
      mockRepo.find.mockResolvedValue([]);

      await NotificationService.getByUser('usr-001', { unreadOnly: true });
      expect(mockRepo.find).toHaveBeenCalledWith({ userId: 'usr-001', read: false });
    });

    it('should filter by type', async () => {
      mockRepo.find.mockResolvedValue([]);

      await NotificationService.getByUser('usr-001', { type: 'order' });
      expect(mockRepo.find).toHaveBeenCalledWith({ userId: 'usr-001', type: 'order' });
    });

    it('should combine unread and type filters', async () => {
      mockRepo.find.mockResolvedValue([]);

      await NotificationService.getByUser('usr-001', { unreadOnly: true, type: 'payment' });
      expect(mockRepo.find).toHaveBeenCalledWith({ userId: 'usr-001', read: false, type: 'payment' });
    });
  });

  describe('getById', () => {
    it('should return notification when found', async () => {
      const notif = { _id: 'notif-001', title: 'Test' };
      mockRepo.findById.mockResolvedValue(notif);

      const result = await NotificationService.getById('notif-001');
      expect(result).toEqual(notif);
    });

    it('should return null when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      const result = await NotificationService.getById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockRepo.findByIdAndUpdate.mockResolvedValue({ _id: 'notif-001', read: true });

      const result = await NotificationService.markAsRead('notif-001');
      expect(result.read).toBe(true);
      expect(mockRepo.findByIdAndUpdate).toHaveBeenCalledWith('notif-001', { read: true, readAt: expect.any(Date) });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      const unread = [{ _id: 'n1' }, { _id: 'n2' }];
      mockRepo.find.mockResolvedValue(unread);
      mockRepo.findByIdAndUpdate.mockResolvedValue({});

      await NotificationService.markAllAsRead('usr-001');
      expect(mockRepo.find).toHaveBeenCalledWith({ userId: 'usr-001', read: false });
      expect(mockRepo.findByIdAndUpdate).toHaveBeenCalledTimes(2);
    });

    it('should do nothing when no unread notifications', async () => {
      mockRepo.find.mockResolvedValue([]);

      await NotificationService.markAllAsRead('usr-001');
      expect(mockRepo.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      mockRepo.count.mockResolvedValue(5);

      const result = await NotificationService.getUnreadCount('usr-001');
      expect(result).toBe(5);
      expect(mockRepo.count).toHaveBeenCalledWith({ userId: 'usr-001', read: false });
    });
  });

  describe('delete', () => {
    it('should soft delete a notification', async () => {
      mockRepo.findByIdAndUpdate.mockResolvedValue({ deleted: true });

      await NotificationService.delete('notif-001');
      expect(mockRepo.findByIdAndUpdate).toHaveBeenCalledWith('notif-001', { deleted: true });
    });
  });

  describe('deleteAll', () => {
    it('should soft delete all notifications for a user', async () => {
      mockRepo.find.mockResolvedValue([{ _id: 'n1' }, { _id: 'n2' }, { _id: 'n3' }]);
      mockRepo.findByIdAndUpdate.mockResolvedValue({});

      await NotificationService.deleteAll('usr-001');
      expect(mockRepo.findByIdAndUpdate).toHaveBeenCalledTimes(3);
    });

    it('should do nothing when user has no notifications', async () => {
      mockRepo.find.mockResolvedValue([]);

      await NotificationService.deleteAll('usr-001');
      expect(mockRepo.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('getRecent', () => {
    it('should return recent notifications with default limit', async () => {
      const notifs = Array.from({ length: 15 }, (_, i) => ({ _id: `n${i}` }));
      mockRepo.find.mockResolvedValue(notifs);

      const result = await NotificationService.getRecent();
      expect(result).toHaveLength(10);
    });

    it('should respect custom limit', async () => {
      const notifs = Array.from({ length: 5 }, (_, i) => ({ _id: `n${i}` }));
      mockRepo.find.mockResolvedValue(notifs);

      const result = await NotificationService.getRecent(3);
      expect(result).toHaveLength(3);
    });
  });

  describe('count', () => {
    it('should return total notification count', async () => {
      mockRepo.count.mockResolvedValue(42);

      const result = await NotificationService.count();
      expect(result).toBe(42);
    });
  });
});
