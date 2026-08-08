/**
 * UserService Unit Tests
 * 
 * Tests the UserService class with mocked repository and dependencies.
 * Covers: Registration, Login, Password Management, User CRUD, RBAC, Security
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { users, HASHED_PASSWORD } = require('./__fixtures__');

// Mock dependencies before requiring the service
jest.mock('../config/db', () => ({
  users: { find: jest.fn(), findOne: jest.fn(), insert: jest.fn(), update: jest.fn(), count: jest.fn() }
}));

jest.mock('../repositories/BaseRepository', () => {
  return jest.fn().mockImplementation(() => ({
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    collection: { update: jest.fn() }
  }));
});

const db = require('../config/db');
const BaseRepository = require('../repositories/BaseRepository');

// We need to require UserService after mocks are set up
let UserService;
beforeAll(() => {
  // Clear module cache to pick up mocks
  jest.resetModules();
  UserService = require('../services/UserService');
});

describe('UserService', () => {
  let service;
  let mockRepo;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserService();
    mockRepo = service.repo;
  });

  describe('generateToken', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env.JWT_SECRET = 'test-secret-key';
      process.env.JWT_EXPIRES_IN = '1h';
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should generate a valid JWT token', () => {
      const token = service.generateToken('user-123');
      const decoded = jwt.verify(token, 'test-secret-key');
      expect(decoded.id).toBe('user-123');
    });

    it('should include expiry in the token', () => {
      const token = service.generateToken('user-123');
      const decoded = jwt.verify(token, 'test-secret-key');
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });

    it('should throw if JWT_SECRET is missing', () => {
      delete process.env.JWT_SECRET;
      expect(() => service.generateToken('user-123')).toThrow();
    });
  });

  describe('register', () => {
    it('should create user with hashed password (not plaintext)', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockImplementation(async (data) => ({ _id: 'new-id', ...data }));

      const result = await service.register({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'Test@123456',
        userType: 'Consumer'
      });

      expect(mockRepo.create).toHaveBeenCalled();
      const createdData = mockRepo.create.mock.calls[0][0];
      expect(createdData.password).not.toBe('Test@123456');
      expect(await bcrypt.compare('Test@123456', createdData.password)).toBe(true);
    });

    it('should set status to pending by default', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockImplementation(async (data) => ({ _id: 'new-id', ...data }));

      await service.register({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'Test@123456',
        userType: 'Consumer'
      });

      const createdData = mockRepo.create.mock.calls[0][0];
      expect(createdData.status).toBe('pending');
    });

    it('should force role to Customer regardless of input', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockImplementation(async (data) => ({ _id: 'new-id', ...data }));

      await service.register({
        firstName: 'Test',
        lastName: 'Hacker',
        email: 'hacker@example.com',
        password: 'Test@123456',
        userType: 'Consumer',
        role: 'Farm Manager' // Attempting escalation
      });

      const createdData = mockRepo.create.mock.calls[0][0];
      expect(createdData.role).toBe('Customer');
    });

    it('should throw on duplicate email', async () => {
      mockRepo.findOne.mockResolvedValue({ email: 'existing@example.com' });

      await expect(service.register({
        firstName: 'Test',
        lastName: 'User',
        email: 'existing@example.com',
        password: 'Test@123456',
        userType: 'Consumer'
      })).rejects.toThrow('Email already registered');
    });

    it('should lowercase email before storage', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockImplementation(async (data) => ({ _id: 'new-id', ...data }));

      await service.register({
        firstName: 'Test',
        lastName: 'User',
        email: 'TEST@EXAMPLE.COM',
        password: 'Test@123456',
        userType: 'Consumer'
      });

      const createdData = mockRepo.create.mock.calls[0][0];
      expect(createdData.email).toBe('test@example.com');
    });

    it('should strip sensitive fields from response', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockImplementation(async (data) => ({
        _id: 'new-id',
        ...data,
        failedLoginAttempts: 0,
        lockUntil: null,
        lastLogin: null
      }));

      const result = await service.register({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'Test@123456',
        userType: 'Consumer'
      });

      expect(result.user.password).toBeUndefined();
      expect(result.user.failedLoginAttempts).toBeUndefined();
      expect(result.user.lockUntil).toBeUndefined();
      expect(result.user.lastLogin).toBeUndefined();
    });

    it('should initialize failedLoginAttempts to 0', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockImplementation(async (data) => ({ _id: 'new-id', ...data }));

      await service.register({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'Test@123456',
        userType: 'Consumer'
      });

      const createdData = mockRepo.create.mock.calls[0][0];
      expect(createdData.failedLoginAttempts).toBe(0);
      expect(createdData.lockUntil).toBeNull();
    });
  });

  describe('login', () => {
    it('should return user and token on valid credentials', async () => {
      const mockUser = { ...users.customer1, password: HASHED_PASSWORD };
      mockRepo.findOne.mockResolvedValue(mockUser);
      mockRepo.findByIdAndUpdate.mockResolvedValue(mockUser);

      const result = await service.login('customer1@example.com', 'Test@123456');

      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe('customer1@example.com');
      expect(result.user.password).toBeUndefined();
    });

    it('should use generic error for wrong email (prevent enumeration)', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.login('nonexistent@example.com', 'Test@123456'))
        .rejects.toThrow('Invalid email or password');
    });

    it('should use generic error for wrong password', async () => {
      const mockUser = { ...users.customer1, password: HASHED_PASSWORD };
      mockRepo.findOne.mockResolvedValue(mockUser);
      mockRepo.collection.update.mockResolvedValue();

      await expect(service.login('customer1@example.com', 'WrongPassword'))
        .rejects.toThrow('Invalid email or password');
    });

    it('should reject login when account is locked', async () => {
      const lockedUser = { ...users.lockedUser, password: HASHED_PASSWORD };
      mockRepo.findOne.mockResolvedValue(lockedUser);

      await expect(service.login('locked@example.com', 'Test@123456'))
        .rejects.toThrow('Account is temporarily locked');
    });

    it('should reject login when status is pending', async () => {
      const pendingUser = { ...users.pendingUser, password: HASHED_PASSWORD };
      mockRepo.findOne.mockResolvedValue(pendingUser);

      await expect(service.login('pending@example.com', 'Test@123456'))
        .rejects.toThrow('pending approval');
    });

    it('should reject login when status is suspended', async () => {
      const suspendedUser = { ...users.suspendedUser, password: HASHED_PASSWORD };
      mockRepo.findOne.mockResolvedValue(suspendedUser);

      await expect(service.login('suspended@example.com', 'Test@123456'))
        .rejects.toThrow('suspended');
    });

    it('should reset failedLoginAttempts on successful login', async () => {
      const mockUser = { ...users.customer1, password: HASHED_PASSWORD, failedLoginAttempts: 3 };
      mockRepo.findOne.mockResolvedValue(mockUser);
      mockRepo.findByIdAndUpdate.mockResolvedValue(mockUser);

      await service.login('customer1@example.com', 'Test@123456');

      expect(mockRepo.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id,
        expect.objectContaining({ failedLoginAttempts: 0, lockUntil: null })
      );
    });

    it('should update lastLogin timestamp on success', async () => {
      const mockUser = { ...users.customer1, password: HASHED_PASSWORD };
      mockRepo.findOne.mockResolvedValue(mockUser);
      mockRepo.findByIdAndUpdate.mockResolvedValue(mockUser);

      await service.login('customer1@example.com', 'Test@123456');

      const updateCall = mockRepo.findByIdAndUpdate.mock.calls[0][1];
      expect(updateCall.lastLogin).toBeInstanceOf(Date);
    });
  });

  describe('incrementLoginAttempts', () => {
    it('should increment counter on each failed attempt', async () => {
      mockRepo.collection.update.mockResolvedValue();

      await service.incrementLoginAttempts('user-123', { failedLoginAttempts: 2 });

      expect(mockRepo.collection.update).toHaveBeenCalledWith(
        { _id: 'user-123' },
        { $set: { failedLoginAttempts: 3 } }
      );
    });

    it('should lock account after 5 failed attempts', async () => {
      mockRepo.collection.update.mockResolvedValue();

      await service.incrementLoginAttempts('user-123', { failedLoginAttempts: 4 });

      const updateCall = mockRepo.collection.update.mock.calls[0][1];
      expect(updateCall.$set.lockUntil).toBeDefined();
      expect(updateCall.$set.lockUntil).toBeGreaterThan(Date.now());
    });

    it('should not lock before 5 attempts', async () => {
      mockRepo.collection.update.mockResolvedValue();

      await service.incrementLoginAttempts('user-123', { failedLoginAttempts: 3 });

      const updateCall = mockRepo.collection.update.mock.calls[0][1];
      expect(updateCall.$set.lockUntil).toBeUndefined();
      expect(updateCall.$set.failedLoginAttempts).toBe(4);
    });
  });

  describe('getAll', () => {
    it('should return all users with no filters', async () => {
      const mockUsers = [users.admin, users.customer1];
      mockRepo.find.mockResolvedValue(mockUsers);

      const result = await service.getAll();

      expect(result).toEqual(mockUsers);
      expect(mockRepo.find).toHaveBeenCalledWith({});
    });

    it('should filter by status', async () => {
      mockRepo.find.mockResolvedValue([users.pendingUser]);

      const result = await service.getAll({ status: 'pending' });

      expect(mockRepo.find).toHaveBeenCalledWith({ status: 'pending' });
    });

    it('should filter by userType', async () => {
      mockRepo.find.mockResolvedValue([users.customer1, users.customer2]);

      await service.getAll({ userType: 'Consumer' });

      expect(mockRepo.find).toHaveBeenCalledWith({ userType: 'Consumer' });
    });

    it('should search by name with regex', async () => {
      mockRepo.find.mockResolvedValue([users.customer1]);

      await service.getAll({ search: 'John' });

      const query = mockRepo.find.mock.calls[0][0];
      expect(query.$or).toBeDefined();
      expect(query.$or.length).toBe(3); // firstName, lastName, email
    });

    it('should handle special regex characters safely', async () => {
      mockRepo.find.mockResolvedValue([]);

      // Should not throw ReDoS
      await service.getAll({ search: '.*+?^${}()|[]' });

      expect(mockRepo.find).toHaveBeenCalled();
    });
  });

  describe('getPending', () => {
    it('should return only pending users', async () => {
      mockRepo.find.mockResolvedValue([users.pendingUser]);

      const result = await service.getPending();

      expect(mockRepo.find).toHaveBeenCalledWith({ status: 'pending' });
      expect(result).toHaveLength(1);
    });
  });

  describe('getStats', () => {
    it('should return correct counts by status', async () => {
      mockRepo.count.mockResolvedValueOnce(10); // total
      mockRepo.count.mockResolvedValueOnce(2);  // pending
      mockRepo.count.mockResolvedValueOnce(7);  // approved
      mockRepo.count.mockResolvedValueOnce(1);  // suspended
      mockRepo.count.mockResolvedValueOnce(0);  // rejected
      mockRepo.find.mockResolvedValue([
        users.admin, users.poultryAttendant, users.processingStaff,
        users.salesAssistant, users.customer1, users.customer2,
        users.pendingUser, users.suspendedUser, users.lockedUser,
        { ...users.customer1, _id: 'extra', role: 'Customer' }
      ]);

      const stats = await service.getStats();

      expect(stats.total).toBe(10);
      expect(stats.pending).toBe(2);
      expect(stats.approved).toBe(7);
      expect(stats.suspended).toBe(1);
    });
  });

  describe('getById', () => {
    it('should return user when found', async () => {
      mockRepo.findById.mockResolvedValue(users.admin);

      const result = await service.getById('test-admin-001');

      expect(result).toEqual(users.admin);
    });

    it('should return null when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      const result = await service.getById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getByEmail', () => {
    it('should find user by lowercase email', async () => {
      mockRepo.findOne.mockResolvedValue(users.customer1);

      await service.getByEmail('Customer1@Example.COM');

      expect(mockRepo.findOne).toHaveBeenCalledWith({ email: 'customer1@example.com' });
    });
  });

  describe('resetPassword', () => {
    it('should hash new password before storing', async () => {
      mockRepo.findByIdAndUpdate.mockResolvedValue({});

      await service.resetPassword('user-123', 'NewPassword123!');

      const updateCall = mockRepo.findByIdAndUpdate.mock.calls[0][1];
      expect(updateCall.password).not.toBe('NewPassword123!');
      expect(await bcrypt.compare('NewPassword123!', updateCall.password)).toBe(true);
    });
  });

  describe('create', () => {
    it('should create user with status approved (admin-created)', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockImplementation(async (data) => ({ _id: 'new-id', ...data }));

      const result = await service.create({
        firstName: 'Staff',
        lastName: 'Member',
        email: 'staff@bohlokofarm.co.za',
        password: 'Staff@123456',
        userType: 'Staff',
        role: 'Poultry Attendant'
      });

      const createdData = mockRepo.create.mock.calls[0][0];
      expect(createdData.status).toBe('approved');
    });

    it('should allow assigning any role', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockImplementation(async (data) => ({ _id: 'new-id', ...data }));

      await service.create({
        firstName: 'Manager',
        lastName: 'Test',
        email: 'manager@bohlokofarm.co.za',
        password: 'Manager@123456',
        userType: 'Staff',
        role: 'Farm Manager'
      });

      const createdData = mockRepo.create.mock.calls[0][0];
      expect(createdData.role).toBe('Farm Manager');
    });

    it('should throw on duplicate email', async () => {
      mockRepo.findOne.mockResolvedValue({ email: 'existing@example.com' });

      await expect(service.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'existing@example.com',
        password: 'Test@123456',
        userType: 'Staff',
        role: 'Customer'
      })).rejects.toThrow('Email already registered');
    });
  });

  describe('updateStatus', () => {
    it('should update user status', async () => {
      mockRepo.findByIdAndUpdate.mockResolvedValue({ status: 'approved' });

      const result = await service.updateStatus('user-123', 'approved');

      expect(mockRepo.findByIdAndUpdate).toHaveBeenCalledWith('user-123', { status: 'approved' });
    });
  });

  describe('updateRole', () => {
    it('should update user role', async () => {
      mockRepo.findByIdAndUpdate.mockResolvedValue({ role: 'Poultry Attendant' });

      await service.updateRole('user-123', 'Poultry Attendant');

      expect(mockRepo.findByIdAndUpdate).toHaveBeenCalledWith('user-123', { role: 'Poultry Attendant' });
    });
  });

  describe('updateProfile', () => {
    it('should allow user to update own profile', async () => {
      mockRepo.findByIdAndUpdate.mockResolvedValue({});

      await service.updateProfile('user-123', { firstName: 'NewName' }, { _id: 'user-123', role: 'Customer' });

      expect(mockRepo.findByIdAndUpdate).toHaveBeenCalledWith('user-123', { firstName: 'NewName' });
    });

    it('should allow Farm Manager to update any profile', async () => {
      mockRepo.findByIdAndUpdate.mockResolvedValue({});

      await service.updateProfile('user-123', { firstName: 'Changed' }, { _id: 'admin-456', role: 'Farm Manager' });

      expect(mockRepo.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('should reject unauthorized updates', async () => {
      await expect(
        service.updateProfile('user-123', { firstName: 'Hacked' }, { _id: 'other-user', role: 'Customer' })
      ).rejects.toThrow('Not authorized');
    });

    it('should only whitelist allowed fields', async () => {
      mockRepo.findByIdAndUpdate.mockResolvedValue({});

      await service.updateProfile('user-123', {
        firstName: 'Good',
        email: 'bad@example.com', // Not allowed
        role: 'Farm Manager'      // Not allowed
      }, { _id: 'user-123', role: 'Customer' });

      const updateCall = mockRepo.findByIdAndUpdate.mock.calls[0][1];
      expect(updateCall.firstName).toBe('Good');
      expect(updateCall.email).toBeUndefined();
      expect(updateCall.role).toBeUndefined();
    });
  });

  describe('bulkUpdateStatus', () => {
    it('should update multiple users at once', async () => {
      mockRepo.findByIdAndUpdate.mockResolvedValue({});

      const result = await service.bulkUpdateStatus(['user-1', 'user-2', 'user-3'], 'approved');

      expect(mockRepo.findByIdAndUpdate).toHaveBeenCalledTimes(3);
      expect(result).toContain('3');
    });
  });

  describe('softDelete', () => {
    it('should set status to deleted (not hard delete)', async () => {
      mockRepo.findById.mockResolvedValue(users.customer1);
      mockRepo.findByIdAndUpdate.mockResolvedValue({ status: 'deleted' });

      await service.softDelete('test-customer-001');

      expect(mockRepo.findByIdAndUpdate).toHaveBeenCalledWith('test-customer-001', { status: 'deleted' });
    });

    it('should prevent deletion of Farm Manager', async () => {
      mockRepo.findById.mockResolvedValue(users.admin);

      await expect(service.softDelete('test-admin-001'))
        .rejects.toThrow('Cannot delete Farm Manager');
    });

    it('should throw if user not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.softDelete('nonexistent'))
        .rejects.toThrow('User not found');
    });
  });
});
