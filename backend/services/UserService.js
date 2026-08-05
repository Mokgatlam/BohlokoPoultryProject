/**
 * User Service - FR-001, FR-002, FR-003
 * =======================================
 * 
 * Business logic layer for user authentication, registration, and management.
 * Implements the Service Layer pattern - encapsulates business rules separate from routes.
 * 
 * Architecture: Singleton instance with BaseRepository for data access
 * Pattern: Service -> Repository -> NeDB Database
 * 
 * Dependencies:
 *   - bcryptjs: Password hashing (salt rounds: 12)
 *   - jsonwebtoken: JWT token generation
 *   - BaseRepository: Generic CRUD operations
 * 
 * Design Principles:
 *   - Single Responsibility: Handles all user-related business logic
 *   - Encapsulation: Password hashing and token generation are internal concerns
 *   - Fail-Fast: Throws descriptive errors for upstream handling
 *   - Immutability: Returns user objects without sensitive fields (password, lockUntil)
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const BaseRepository = require('../repositories/BaseRepository');
const db = require('../config/db');

class UserService {
  /**
   * Initialize UserService with user data repository.
   * Uses BaseRepository pattern for consistent data access.
   */
  constructor() {
    this.repo = new BaseRepository(db.users);
  }

  /**
   * Generate JWT access token for authenticated user.
   * 
   * FR-002.4: JWT token contains user ID and expiry from environment config.
   * 
   * @param {string} id - User's unique identifier
   * @returns {string} Signed JWT token
   */
  generateToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
  }

  /**
   * Register a new user account.
   * 
   * FR-001.3: Email uniqueness validated - throws if email already exists
   * FR-001.4: Password hashed with bcrypt (12 salt rounds)
   * FR-001.5: Account status set to "pending" (requires Farm Manager approval)
   * FR-001.9: Self-registration restricts role to 'Customer' only
   * 
   * @param {Object} data - Registration data
   * @param {string} data.firstName - User's first name
   * @param {string} data.lastName - User's last name
   * @param {string} data.email - User's email (will be lowercased)
   * @param {string} data.password - Plain text password (will be hashed)
   * @param {string} data.userType - One of: Consumer, Restaurant, Retailer, Distributor, Farm Gate, Institution
   * @returns {Object} { user: { _id, firstName, ... } } (without password)
   * @throws {Error} "Email already registered" if email exists
   */
  async register(data) {
    // Check email uniqueness (FR-001.3)
    const existing = await this.repo.findOne({ email: data.email.toLowerCase() });
    if (existing) throw new Error('Email already registered');

    // Hash password with bcrypt, 12 salt rounds (FR-001.4)
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    // Create user with pending status (FR-001.5)
    const user = await this.repo.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      userType: data.userType,
      role: 'Customer', // Self-registration only allows Customer role (FR-001.9)
      phone: data.phone || '',
      businessName: data.businessName || '',
      address: data.address || {},
      status: 'pending', // All new accounts require approval (FR-001.5)
      failedLoginAttempts: 0,
      lockUntil: null,
      lastLogin: null
    });

    // Strip sensitive fields before returning (security best practice)
    const { password, failedLoginAttempts, lockUntil, lastLogin, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  }

  /**
   * Authenticate user and issue access token.
   * 
   * FR-002.1: Validates credentials against stored bcrypt hash
   * FR-002.2: Account locked after 5 failed attempts for 30 minutes
   * FR-002.5: Validates account status (approved, pending, suspended, rejected)
   * FR-002.6: Updates lastLogin timestamp on successful login
   * FR-002.7: Returns specific error messages for each failure type
   * 
   * @param {string} email - User's email address
   * @param {string} password - Plain text password to verify
   * @returns {Object} { user, token } - User object and JWT token
   * @throws {Error} Specific error message based on failure type
   */
  async login(email, password) {
    // Find user by email (case-insensitive)
    const user = await this.repo.findOne({ email: email.toLowerCase() });
    if (!user) throw new Error('Invalid email or password'); // Generic message prevents user enumeration

    // Check if account is locked (FR-002.2)
    if (user.lockUntil && user.lockUntil > Date.now()) {
      throw new Error('Account is temporarily locked due to multiple failed login attempts');
    }

    // Verify password against bcrypt hash (FR-002.1)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Increment failed attempts and potentially lock account (FR-002.2)
      await this.incrementLoginAttempts(user._id, user);
      throw new Error('Invalid email or password'); // Generic message prevents user enumeration
    }

    // Validate account status (FR-002.5)
    if (user.status !== 'approved') {
      const messages = {
        pending: 'Your account is pending approval by the Farm Manager',
        suspended: 'Your account has been suspended',
        rejected: 'Your account registration was rejected'
      };
      throw new Error(messages[user.status] || 'Account not active');
    }

    // Reset failed attempts and update last login time (FR-002.6)
    await this.repo.findByIdAndUpdate(user._id, { failedLoginAttempts: 0, lockUntil: null, lastLogin: new Date() });

    // Generate JWT access token (FR-002.4)
    const token = this.generateToken(user._id);
    const { password: _, failedLoginAttempts, lockUntil, lastLogin, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  /**
   * Increment failed login attempts and lock account if threshold reached.
   * 
   * FR-002.2: Account locked after 5 failed attempts for 30 minutes.
   * 
   * @param {string} userId - User's unique identifier
   * @param {Object} user - Current user object with failedLoginAttempts count
   */
  async incrementLoginAttempts(userId, user) {
    const attempts = (user.failedLoginAttempts || 0) + 1;
    const updates = { failedLoginAttempts: attempts };
    // Lock account for 30 minutes after 5 failed attempts
    if (attempts >= 5) {
      updates.lockUntil = Date.now() + 30 * 60 * 1000; // 30 minutes from now
    }
    // Use raw collection update to bypass updatedAt timestamp
    await this.repo.collection.update({ _id: userId }, { $set: updates });
  }

  /**
   * Get all users with optional filtering and search.
   * 
   * Supports filtering by: status, userType, role
   * Supports search across: firstName, lastName, email
   * 
   * @param {Object} filters - Query filters
   * @param {string} filters.status - Filter by account status
   * @param {string} filters.userType - Filter by user type
   * @param {string} filters.role - Filter by role
   * @param {string} filters.search - Search term (regex-safe)
   * @returns {Array} Array of user objects (without passwords)
   */
  async getAll(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.userType) query.userType = filters.userType;
    if (filters.role) query.role = filters.role;
    if (filters.search) {
      // Escape regex special characters to prevent ReDoS attacks
      const safe = filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { firstName: new RegExp(safe, 'i') },
        { lastName: new RegExp(safe, 'i') },
        { email: new RegExp(safe, 'i') }
      ];
    }
    return await this.repo.find(query);
  }

  /**
   * Get all users with "pending" status awaiting approval.
   * 
   * FR-001.5: New accounts start with "pending" status.
   * 
   * @returns {Array} Array of pending user objects
   */
  async getPending() {
    return await this.repo.find({ status: 'pending' });
  }

  /**
   * Get user statistics for dashboard display.
   * 
   * Returns counts by status and breakdowns by userType and role.
   * 
   * @returns {Object} { total, pending, approved, suspended, rejected, byType, byRole }
   */
  async getStats() {
    const total = await this.repo.count();
    const pending = await this.repo.count({ status: 'pending' });
    const approved = await this.repo.count({ status: 'approved' });
    const suspended = await this.repo.count({ status: 'suspended' });
    const rejected = await this.repo.count({ status: 'rejected' });

    // Calculate breakdowns by userType and role
    const byType = {};
    const byRole = {};
    const users = await this.repo.find({});
    users.forEach(u => {
      byType[u.userType] = (byType[u.userType] || 0) + 1;
      byRole[u.role] = (byRole[u.role] || 0) + 1;
    });

    return { total, pending, approved, suspended, rejected, byType, byRole };
  }

  /**
   * Get a single user by ID.
   * 
   * @param {string} id - User's unique identifier
   * @returns {Object|null} User object or null if not found
   */
  async getById(id) {
    return await this.repo.findById(id);
  }

  /**
   * Get a single user by email address.
   * 
   * Used for password reset flow and duplicate email checking.
   * 
   * @param {string} email - Email address (will be lowercased)
   * @returns {Object|null} User object or null if not found
   */
  async getByEmail(email) {
    return await this.repo.findOne({ email: email.toLowerCase() });
  }

  /**
   * Reset user password with new bcrypt-hashed password.
   * 
   * FR-002.3: Password reset via email token flow.
   * 
   * @param {string} userId - User's unique identifier
   * @param {string} newPassword - New plain text password (will be hashed)
   * @returns {Object} Updated user object
   */
  async resetPassword(userId, newPassword) {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    return await this.repo.findByIdAndUpdate(userId, { password: hashedPassword });
  }

  /**
   * Create a new user account (admin-only, for Staff Members).
   * 
   * FR-001.9: Staff Members are created internally by Farm Manager.
   * FR-001.5: Admin-created accounts are automatically approved.
   * 
   * @param {Object} data - User data including role
   * @returns {Object} Created user object
   * @throws {Error} "Email already registered" if email exists
   */
  async create(data) {
    const existing = await this.repo.findOne({ email: data.email.toLowerCase() });
    if (existing) throw new Error('Email already registered');

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    return await this.repo.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      userType: data.userType,
      role: data.role, // Admin can assign any role (FR-003.1)
      phone: data.phone || '',
      businessName: data.businessName || '',
      status: 'approved' // Admin-created accounts are pre-approved
    });
  }

  /**
   * Update user's account status.
   * 
   * FR-001.5: Enables approval, suspension, or rejection of accounts.
   * 
   * @param {string} id - User's unique identifier
   * @param {string} status - New status: 'approved', 'suspended', 'rejected'
   * @returns {Object} Updated user object
   */
  async updateStatus(id, status) {
    return await this.repo.findByIdAndUpdate(id, { status });
  }

  /**
   * Update user's role within the system.
   * 
   * FR-003.4: Farm Manager can modify user roles.
   * 
   * @param {string} id - User's unique identifier
   * @param {string} role - New role: Farm Manager, Poultry Attendant, Processing Staff, Sales Assistant, Customer
   * @returns {Object} Updated user object
   */
  async updateRole(id, role) {
    return await this.repo.findByIdAndUpdate(id, { role });
  }

  /**
   * Update user profile with field whitelisting.
   * 
   * Authorization: Only the user themselves or Farm Manager can update profiles.
   * Allowed fields: firstName, lastName, phone, address, businessName
   * 
   * @param {string} id - User's unique identifier
   * @param {Object} updates - Fields to update
   * @param {Object} requestor - Current authenticated user
   * @returns {Object} Updated user object
   * @throws {Error} "Not authorized" if requestor is not the user or Farm Manager
   */
  async updateProfile(id, updates, requestor) {
    // Authorization check: only self or Farm Manager can update profile
    if (id !== requestor._id && requestor.role !== 'Farm Manager') {
      throw new Error('Not authorized');
    }
    // Whitelist allowed fields (prevents mass assignment attacks)
    const allowed = ['firstName', 'lastName', 'phone', 'address', 'businessName'];
    const filtered = {};
    allowed.forEach(f => { if (updates[f] !== undefined) filtered[f] = updates[f]; });
    return await this.repo.findByIdAndUpdate(id, filtered);
  }

  /**
   * Bulk update status for multiple users.
   * 
   * FR-001.5: Enables batch approval of pending registrations.
   * 
   * @param {Array<string>} ids - Array of user IDs
   * @param {string} status - New status for all users
   * @returns {string} Confirmation message with count
   */
  async bulkUpdateStatus(ids, status) {
    for (const id of ids) {
      await this.repo.findByIdAndUpdate(id, { status });
    }
    return `${ids.length} users updated to ${status}`;
  }

  /**
   * Soft-delete a user account (set status to 'deleted').
   * 
   * Safety constraint: Cannot delete Farm Manager accounts.
   * Uses soft-delete to preserve data integrity and audit trail.
   * 
   * @param {string} id - User's unique identifier
   * @returns {Object} Updated user object with status 'deleted'
   * @throws {Error} "User not found" or "Cannot delete Farm Manager"
   */
  async softDelete(id) {
    const user = await this.repo.findById(id);
    if (!user) throw new Error('User not found');
    if (user.role === 'Farm Manager') throw new Error('Cannot delete Farm Manager');
    return await this.repo.findByIdAndUpdate(id, { status: 'deleted' });
  }
}

// Export singleton instance (ensures consistent state across application)
module.exports = new UserService();
