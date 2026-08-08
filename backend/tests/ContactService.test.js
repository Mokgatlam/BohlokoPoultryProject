/**
 * ContactService Unit Tests
 * =========================
 * 
 * SRS Reference: FR-016 (Customer Relationship Management)
 * 
 * Tests ContactService methods with mocked BaseRepository and database.
 */

const mockRepo = {
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  deleteById: jest.fn(),
  count: jest.fn()
};

jest.mock('../repositories/BaseRepository', () => {
  return jest.fn().mockImplementation(() => mockRepo);
});

jest.mock('../config/db', () => ({
  contactMessages: {}
}));

let ContactService;

beforeAll(() => {
  jest.resetModules();
  ContactService = require('../services/ContactService');
});

describe('ContactService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createMessage', () => {
    it('should create a contact message with valid data', async () => {
      const data = { name: 'John Doe', email: 'john@example.com', subject: 'Inquiry', message: 'Hello there' };
      mockRepo.create.mockResolvedValue({ _id: 'msg-001', ...data, status: 'unread' });

      const result = await ContactService.createMessage(data);
      expect(result.status).toBe('unread');
      expect(result.name).toBe('John Doe');
      expect(mockRepo.create).toHaveBeenCalledTimes(1);
    });

    it('should trim and lowercase email', async () => {
      const data = { name: 'Jane', email: 'Jane@Example.COM', subject: 'Test', message: 'Body' };
      mockRepo.create.mockResolvedValue({ _id: 'msg-002', email: 'jane@example.com' });

      await ContactService.createMessage(data);
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'jane@example.com', name: 'Jane' })
      );
    });

    it('should handle optional phone field', async () => {
      const data = { name: 'Bob', email: 'bob@test.com', subject: 'Hi', message: 'Msg', phone: 123456 };
      mockRepo.create.mockResolvedValue({ _id: 'msg-003' });

      await ContactService.createMessage(data);
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ phone: '123456' })
      );
    });

    it('should set empty string when phone is not provided', async () => {
      const data = { name: 'Bob', email: 'bob@test.com', subject: 'Hi', message: 'Msg' };
      mockRepo.create.mockResolvedValue({ _id: 'msg-004' });

      await ContactService.createMessage(data);
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ phone: '' })
      );
    });

    it('should throw if name is missing', async () => {
      await expect(ContactService.createMessage({ email: 'a@b.com', subject: 'S', message: 'M' }))
        .rejects.toThrow('Name is required');
    });

    it('should throw if name is empty after trim', async () => {
      await expect(ContactService.createMessage({ name: '   ', email: 'a@b.com', subject: 'S', message: 'M' }))
        .rejects.toThrow('Name is required');
    });

    it('should throw if email is missing', async () => {
      await expect(ContactService.createMessage({ name: 'A', subject: 'S', message: 'M' }))
        .rejects.toThrow('Valid email is required');
    });

    it('should throw if email is invalid format', async () => {
      await expect(ContactService.createMessage({ name: 'A', email: 'not-an-email', subject: 'S', message: 'M' }))
        .rejects.toThrow('Valid email is required');
    });

    it('should throw if email has no domain', async () => {
      await expect(ContactService.createMessage({ name: 'A', email: 'user@', subject: 'S', message: 'M' }))
        .rejects.toThrow('Valid email is required');
    });

    it('should throw if subject is missing', async () => {
      await expect(ContactService.createMessage({ name: 'A', email: 'a@b.com', message: 'M' }))
        .rejects.toThrow('Subject is required');
    });

    it('should throw if message is missing', async () => {
      await expect(ContactService.createMessage({ name: 'A', email: 'a@b.com', subject: 'S' }))
        .rejects.toThrow('Message is required');
    });
  });

  describe('getAll', () => {
    it('should return all messages sorted by createdAt DESC', async () => {
      const messages = [
        { _id: '1', name: 'A', createdAt: new Date('2026-08-02') },
        { _id: '2', name: 'B', createdAt: new Date('2026-08-01') }
      ];
      mockRepo.find.mockResolvedValue(messages);

      const result = await ContactService.getAll();
      expect(result).toEqual(messages);
      expect(mockRepo.find).toHaveBeenCalledWith({}, { sort: { createdAt: -1 } });
    });

    it('should pass query filters', async () => {
      mockRepo.find.mockResolvedValue([]);

      await ContactService.getAll({ status: 'unread' });
      expect(mockRepo.find).toHaveBeenCalledWith({ status: 'unread' }, { sort: { createdAt: -1 } });
    });
  });

  describe('getById', () => {
    it('should return message when found', async () => {
      const msg = { _id: 'msg-001', name: 'Test' };
      mockRepo.findById.mockResolvedValue(msg);

      const result = await ContactService.getById('msg-001');
      expect(result).toEqual(msg);
    });

    it('should throw when message not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(ContactService.getById('nonexistent')).rejects.toThrow('Message not found');
    });
  });

  describe('updateStatus', () => {
    it('should update status to read', async () => {
      const updated = { _id: 'msg-001', status: 'read' };
      mockRepo.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await ContactService.updateStatus('msg-001', 'read');
      expect(result.status).toBe('read');
    });

    it('should update status to responded', async () => {
      mockRepo.findByIdAndUpdate.mockResolvedValue({ status: 'responded' });
      const result = await ContactService.updateStatus('msg-001', 'responded');
      expect(result.status).toBe('responded');
    });

    it('should update status to archived', async () => {
      mockRepo.findByIdAndUpdate.mockResolvedValue({ status: 'archived' });
      const result = await ContactService.updateStatus('msg-001', 'archived');
      expect(result.status).toBe('archived');
    });

    it('should throw if status is invalid', async () => {
      await expect(ContactService.updateStatus('msg-001', 'invalid')).rejects.toThrow('Invalid status');
    });

    it('should throw for empty string status', async () => {
      await expect(ContactService.updateStatus('msg-001', '')).rejects.toThrow('Invalid status');
    });
  });

  describe('delete', () => {
    it('should delete an existing message', async () => {
      mockRepo.findById.mockResolvedValue({ _id: 'msg-001' });
      mockRepo.deleteById.mockResolvedValue();

      const result = await ContactService.delete('msg-001');
      expect(result.message).toBe('Message deleted');
      expect(mockRepo.deleteById).toHaveBeenCalledWith('msg-001');
    });

    it('should throw if message not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(ContactService.delete('nonexistent')).rejects.toThrow('Message not found');
    });
  });

  describe('getStatistics', () => {
    it('should return counts by status', async () => {
      const messages = [
        { status: 'unread' },
        { status: 'unread' },
        { status: 'read' },
        { status: 'responded' },
        { status: 'archived' },
        { status: 'archived' },
        { status: 'archived' }
      ];
      mockRepo.find.mockResolvedValue(messages);

      const stats = await ContactService.getStatistics();
      expect(stats.total).toBe(7);
      expect(stats.unread).toBe(2);
      expect(stats.read).toBe(1);
      expect(stats.responded).toBe(1);
      expect(stats.archived).toBe(3);
    });

    it('should return zeros when no messages exist', async () => {
      mockRepo.find.mockResolvedValue([]);

      const stats = await ContactService.getStatistics();
      expect(stats.total).toBe(0);
      expect(stats.unread).toBe(0);
      expect(stats.read).toBe(0);
      expect(stats.responded).toBe(0);
      expect(stats.archived).toBe(0);
    });
  });
});
