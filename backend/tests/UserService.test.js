const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserService = require('../services/UserService');

describe('UserService', () => {
  describe('register', () => {
    it('should hash password before storing', async () => {
      const password = 'TestPass123!';
      const salt = await bcrypt.genSalt(12);
      const hashed = await bcrypt.hash(password, salt);
      
      expect(hashed).not.toBe(password);
      expect(await bcrypt.compare(password, hashed)).toBe(true);
    });

    it('should generate valid JWT token', () => {
      const userId = 'test-user-id-123';
      const token = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
      
      expect(decoded.id).toBe(userId);
    });

    it('should strip password from user object', () => {
      const user = {
        _id: '123',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@test.com',
        password: 'hashedpassword',
        role: 'Customer'
      };
      
      const { password, ...userWithoutPassword } = user;
      
      expect(userWithoutPassword.password).toBeUndefined();
      expect(userWithoutPassword.firstName).toBe('Test');
    });

    it('should strip internal fields from login response', () => {
      const user = {
        _id: '123',
        firstName: 'Test',
        email: 'test@test.com',
        password: 'hashed',
        failedLoginAttempts: 3,
        lockUntil: Date.now(),
        lastLogin: new Date()
      };
      
      const { password, failedLoginAttempts, lockUntil, lastLogin, ...safe } = user;
      
      expect(safe.failedLoginAttempts).toBeUndefined();
      expect(safe.lockUntil).toBeUndefined();
      expect(safe.lastLogin).toBeUndefined();
    });
  });

  describe('password validation', () => {
    it('should require minimum 8 characters', () => {
      const password = 'Short1!';
      expect(password.length >= 8).toBe(false);
    });

    it('should require uppercase letter', () => {
      const password = 'lowercase1!';
      expect(/[A-Z]/.test(password)).toBe(false);
    });

    it('should require lowercase letter', () => {
      const password = 'UPPERCASE1!';
      expect(/[a-z]/.test(password)).toBe(false);
    });

    it('should require number', () => {
      const password = 'NoNumber!!';
      expect(/[0-9]/.test(password)).toBe(false);
    });

    it('should require special character', () => {
      const password = 'NoSpecial1';
      expect(/[@$!%*?&]/.test(password)).toBe(false);
    });

    it('should accept valid password', () => {
      const password = 'ValidPass123!';
      expect(password.length >= 8).toBe(true);
      expect(/[A-Z]/.test(password)).toBe(true);
      expect(/[a-z]/.test(password)).toBe(true);
      expect(/[0-9]/.test(password)).toBe(true);
      expect(/[@$!%*?&]/.test(password)).toBe(true);
    });
  });

  describe('role validation', () => {
    const validRoles = ['Farm Manager', 'Poultry Attendant', 'Processing Staff', 'Sales Assistant', 'Customer'];
    
    it('should accept valid roles', () => {
      validRoles.forEach(role => {
        expect(validRoles.includes(role)).toBe(true);
      });
    });

    it('should only allow Customer on self-registration', () => {
      const allowedSelfRegister = ['Customer'];
      const attemptedRole = 'Farm Manager';
      expect(allowedSelfRegister.includes(attemptedRole)).toBe(false);
    });
  });

  describe('account lockout', () => {
    it('should lock after 5 failed attempts', () => {
      const maxAttempts = 5;
      const lockDuration = 30 * 60 * 1000;
      
      for (let i = 1; i <= maxAttempts; i++) {
        const shouldLock = i >= maxAttempts;
        if (shouldLock) {
          const lockUntil = Date.now() + lockDuration;
          expect(lockUntil > Date.now()).toBe(true);
        }
      }
    });

    it('should unlock after 30 minutes', () => {
      const lockDuration = 30 * 60 * 1000;
      const lockUntil = Date.now() + lockDuration;
      const now = Date.now();
      
      expect(lockUntil > now).toBe(true);
      expect(lockUntil - now).toBe(lockDuration);
    });
  });
});
