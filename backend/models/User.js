/**
 * User Model - FR-001, FR-002, FR-003
 * ======================================
 * 
 * Data model for user accounts in the Bohloko Family Farm system.
 * Defines the schema and static methods for user data operations.
 * 
 * Architecture: Active Record pattern (model handles its own persistence)
 * Database: NeDB (file-based, MongoDB-compatible)
 * 
 * FR-001 Requirements:
 *   - FR-001.1: User types - Consumer, Restaurant, Retailer, Distributor, Farm Gate, Institution, Staff
 *   - FR-001.4: Password stored as bcrypt hash (12 salt rounds)
 *   - FR-001.5: Status field tracks approval state (pending/approved/suspended/rejected)
 *   - FR-001.9: Business registration fields (businessRegNumber, taxId)
 * 
 * FR-002 Requirements:
 *   - FR-002.2: failedLoginAttempts and lockUntil fields for account lockout
 *   - FR-002.6: lastLogin and lastLoginIP fields for audit tracking
 * 
 * FR-003 Requirements:
 *   - FR-003.1: role field stores user's system role
 * 
 * Design Principles:
 *   - Encapsulation: Password hashing is automatic in create()
 *   - Immutability: find() returns users without password field
 *   - Audit Trail: createdAt and updatedAt timestamps on all records
 */

const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class User {
  /**
   * Create a new user with automatic password hashing.
   * 
   * FR-001.4: Password is automatically hashed with bcrypt (12 salt rounds)
   * FR-001.5: Default status is 'pending' if not specified
   * FR-003.1: Default role is 'Customer' if not specified
   * 
   * @param {Object} userData - User data object
   * @param {string} userData.firstName - Required
   * @param {string} userData.lastName - Required
   * @param {string} userData.email - Required (will be lowercased)
   * @param {string} userData.password - Required (will be hashed)
   * @param {string} userData.userType - Required (Consumer, Restaurant, etc.)
   * @param {string} [userData.role='Customer'] - User's system role
   * @param {string} [userData.phone] - Contact phone number
   * @param {string} [userData.businessName] - Business name for commercial users
   * @param {string} [userData.businessRegNumber] - Business registration number (FR-001.9)
   * @param {string} [userData.taxId] - Tax identification number (FR-001.10)
   * @param {Object} [userData.address] - Physical address
   * @param {string} [userData.status='pending'] - Account status
   * 
   * @returns {Object} Created user (without password field)
   */
  static async create(userData) {
    // Hash password with bcrypt before storage (FR-001.4)
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    const user = {
      _id: uuidv4(), // Generate unique identifier
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email.toLowerCase(), // Normalize email to lowercase
      password: hashedPassword,
      userType: userData.userType,
      role: userData.role || 'Customer', // Default role (FR-001.9)
      phone: userData.phone || '',
      businessName: userData.businessName || '',
      businessRegNumber: userData.businessRegNumber || '', // FR-001.9
      taxId: userData.taxId || '', // FR-001.10
      address: userData.address || {},
      status: userData.status || 'pending', // FR-001.5: New accounts pending approval
      failedLoginAttempts: 0, // FR-002.2: Track login failures
      lockUntil: null, // FR-002.2: Account lock expiry timestamp
      lastLogin: null, // FR-002.6: Last successful login timestamp
      lastLoginIP: null, // FR-002.6: Last login IP address
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.users.insert(user);
    // Return user without password (security best practice)
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Find a single user by query.
   * 
   * @param {Object} query - MongoDB-style query (e.g., { email: 'user@example.com' })
   * @returns {Object|null} User object or null if not found
   */
  static async findOne(query) {
    return await db.users.findOne(query);
  }

  /**
   * Find a user by their unique ID.
   * 
   * @param {string} id - User's UUID
   * @returns {Object|null} User object or null if not found
   */
  static async findById(id) {
    return await db.users.findOne({ _id: id });
  }

  /**
   * Update a user by ID with automatic updatedAt timestamp.
   * 
   * @param {string} id - User's UUID
   * @param {Object} updates - Fields to update
   * @returns {Object} Updated user object
   */
  static async findByIdAndUpdate(id, updates) {
    updates.updatedAt = new Date(); // Auto-update timestamp
    await db.users.update({ _id: id }, { $set: updates });
    return await db.users.findOne({ _id: id });
  }

  /**
   * Find multiple users with optional sorting and limiting.
   * 
   * Security: Automatically strips password field from all returned users.
   * 
   * @param {Object} [query={}] - MongoDB-style query
   * @param {Object} [options={}] - Query options
   * @param {Object} [options.sort] - Sort specification (e.g., { createdAt: -1 })
   * @param {number} [options.limit] - Maximum number of results
   * @returns {Array} Array of user objects (without passwords)
   */
  static async find(query = {}, options = {}) {
    const users = await db.users.find(query, options);
    // Strip password from all returned users (security)
    return users.map(({ password, ...user }) => user);
  }

  /**
   * Count users matching a query.
   * 
   * @param {Object} [query={}] - MongoDB-style query
   * @returns {number} Count of matching users
   */
  static async count(query = {}) {
    return await db.users.count(query);
  }

  /**
   * Delete multiple users matching a query (hard delete).
   * 
   * Note: Prefer softDelete (setting status to 'deleted') for data integrity.
   * 
   * @param {Object} [query={}] - MongoDB-style query
   * @returns {number} Number of deleted documents
   */
  static async deleteMany(query = {}) {
    return await db.users.remove(query, { multi: true });
  }
}

module.exports = User;
