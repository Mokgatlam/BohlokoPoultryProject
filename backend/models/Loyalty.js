/**
 * Loyalty Models
 * ==============
 * 
 * SRS Reference: FR-016 (Customer Relationship Management - Loyalty Programs)
 * 
 * Three models for the loyalty rewards system:
 * 
 * 1. LoyaltyProgram - Defines a loyalty program with tiers and rewards
 * 2. PointsTransaction - Tracks points earning/spending history
 * 3. CustomerEnrollment - Links customers to loyalty programs
 * 
 * Loyalty Tier Structure:
 *   Bronze:   0+ points,     0% discount
 *   Silver:   1000+ points,   5% discount
 *   Gold:     2500+ points,  10% discount
 *   Platinum: 5000+ points,  15% discount
 *   Diamond:  10000+ points, 20% discount
 * 
 * Points Earning: 0.1 points per Rand spent (configurable)
 * 
 * Storage: NeDB collections
 *   - loyaltyPrograms: Program definitions
 *   - pointsTransactions: Points history
 *   - customerEnrollments: Customer-program links
 */

const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * LoyaltyProgram - Defines a loyalty program with tiers and earning rules.
 * 
 * Schema:
 *   _id:          UUID
 *   name:         String - Program name (e.g., 'Bohloko Rewards')
 *   description:  String - Program description
 *   tiers:        Array - Tier definitions [{ name, minPoints, discount }]
 *   pointsPerRand: Number - Points earned per Rand spent (default: 0.1)
 *   rewards:      Array - Available rewards
 *   active:       Boolean - Whether program is active
 *   createdAt:    Date
 */
class LoyaltyProgram {
  /**
   * Create a new loyalty program.
   * 
   * SRS: FR-016 - Define loyalty program
   * 
   * Default tiers (if not provided):
   *   Bronze (0pts, 0%), Silver (1000pts, 5%), Gold (2500pts, 10%),
   *   Platinum (5000pts, 15%), Diamond (10000pts, 20%)
   * 
   * @param {Object} data - Program data
   * @returns {Object} Created program
   */
  static async create(data) {
    const program = {
      _id: uuidv4(),
      name: data.name,
      description: data.description || '',
      tiers: data.tiers || [
        { name: 'Bronze', minPoints: 0, discount: 0 },
        { name: 'Silver', minPoints: 1000, discount: 5 },
        { name: 'Gold', minPoints: 2500, discount: 10 },
        { name: 'Platinum', minPoints: 5000, discount: 15 },
        { name: 'Diamond', minPoints: 10000, discount: 20 }
      ],
      pointsPerRand: data.pointsPerRand || 0.1,
      rewards: data.rewards || [],
      active: true,
      createdAt: new Date()
    };
    await db.loyaltyPrograms.insert(program);
    return program;
  }

  /**
   * Get or create the default loyalty program.
   * 
   * SRS: FR-016 - Default loyalty program
   * Uses get-or-create pattern: returns active program or creates 'Bohloko Rewards'.
   * 
   * @returns {Object} Active loyalty program
   */
  static async getDefault() {
    let program = await db.loyaltyPrograms.findOne({ active: true });
    if (!program) {
      program = await this.create({ name: 'Bohloko Rewards', description: 'Earn points with every purchase' });
    }
    return program;
  }
}

/**
 * PointsTransaction - Tracks loyalty points earning and spending history.
 * 
 * Schema:
 *   _id:        UUID
 *   userId:     String - Customer user ID
 *   amount:     Number - Points amount (positive = earned, negative = spent)
 *   type:       String - Transaction type (earned, redeemed, adjusted)
 *   reference:  String - Reference to order or reward
 *   createdAt:  Date
 * 
 * Usage: Each order automatically generates a points transaction.
 */
class PointsTransaction {
  /**
   * Get points transaction history for a customer.
   * 
   * SRS: FR-016 - Loyalty points tracking
   * Sorted by createdAt DESC (newest first)
   * 
   * @param {string} userId - Customer user ID
   * @returns {Array} Points transactions
   */
  static async findByCustomer(userId) {
    return await db.pointsTransactions.find({ userId }).sort({ createdAt: -1 }).exec();
  }
}

/**
 * CustomerEnrollment - Links a customer to a loyalty program.
 * 
 * Schema:
 *   _id:          UUID
 *   customerId:   String - CustomerProfile ID
 *   userId:       String - User account ID
 *   programId:    String - LoyaltyProgram ID
 *   tier:         String - Starting tier (Bronze)
 *   points:       Number - Starting points (0)
 *   enrolledAt:   Date - Enrollment timestamp
 *   active:       Boolean - Whether enrollment is active
 * 
 * Design: One active enrollment per user (prevents duplicate enrollments)
 */
class CustomerEnrollment {
  /**
   * Create a new customer enrollment in a loyalty program.
   * 
   * SRS: FR-016 - Loyalty program enrollment
   * Starts at Bronze tier with 0 points.
   * 
   * @param {Object} data - { customerId, userId, programId }
   * @returns {Object} Created enrollment
   */
  static async create(data) {
    const enrollment = {
      _id: uuidv4(),
      customerId: data.customerId,
      userId: data.userId,
      programId: data.programId,
      tier: 'Bronze',
      points: 0,
      enrolledAt: new Date(),
      active: true
    };
    await db.customerEnrollments.insert(enrollment);
    return enrollment;
  }

  /**
   * Find active enrollment for a user.
   * 
   * SRS: FR-016 - Check enrollment status
   * 
   * @param {string} userId - User ID
   * @returns {Object|null} Active enrollment or null
   */
  static async findByUser(userId) {
    return await db.customerEnrollments.findOne({ userId, active: true });
  }
}

module.exports = { LoyaltyProgram, PointsTransaction, CustomerEnrollment };