/**
 * Customer Profile Model
 * ======================
 * 
 * SRS Reference: FR-016 (Customer Relationship Management)
 * 
 * Data model for customer CRM profiles. Each profile is linked to a user account
 * and contains enriched customer data including purchase statistics, loyalty tier,
 * lifetime value, and segmentation.
 * 
 * Schema Fields:
 *   _id:              UUID - Unique identifier
 *   userId:           String - Reference to User account ID
 *   firstName:        String - Customer's first name
 *   lastName:         String - Customer's last name
 *   email:            String - Contact email
 *   phone:            String - Contact phone
 *   userType:         String - Customer type (Consumer, Restaurant, etc.)
 *   address:          Object - Physical address
 *   preferences:      Object - Communication preferences
 *     - communication: String - Preferred method (email, sms)
 *     - newsletter:    Boolean - Newsletter subscription
 *     - promotions:    Boolean - Promotional communications opt-in
 *   stats:            Object - Purchase statistics
 *     - totalOrders:     Number - Total order count
 *     - totalSpent:      Number - Total amount spent (ZAR)
 *     - averageOrderValue: Number - Average order value
 *     - lastOrderDate:   Date - Date of most recent order
 *     - firstOrderDate:  Date - Date of first order
 *     - orderFrequency:  Number - Orders per time period
 *   loyalty:          Object - Loyalty program data
 *     - tier:         String - Current tier (Bronze, Silver, Gold, Platinum, Diamond)
 *     - points:       Number - Current points balance
 *     - programId:    String - Loyalty program reference
 *     - enrolledAt:   Date - Enrollment timestamp
 *   lifetimeValue:    Object - Customer Lifetime Value metrics
 *     - historical:       Number - Actual total spent
 *     - predicted:        Number - Predicted CLV (avgOrder * frequency * lifespan)
 *     - retentionProbability: Number - Predicted retention rate (0-0.95)
 *   segment:          String - Auto-calculated segment (New, Returning, VIP)
 *   notes:            Array - Admin notes about the customer
 *   createdAt:        Date - Profile creation timestamp
 *   updatedAt:        Date - Last modification timestamp
 * 
 * Storage: NeDB collection 'customerProfiles'
 * Sorting: Default sort by createdAt DESC
 * 
 * Design Patterns:
 *   - Active Record: Model handles its own persistence
 *   - Get-or-Create: Profile auto-creates from user data on first access
 *   - Denormalized Stats: Purchase stats stored in profile for fast reads
 */

const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class CustomerProfile {
  /**
   * Create a new customer profile with default values.
   * 
   * SRS: FR-016 - Customer profile creation
   * 
   * Defaults:
   *   - stats: All zeros (no orders yet)
   *   - loyalty: Bronze tier, 0 points, not enrolled
   *   - lifetimeValue: All zeros, 50% retention probability
   *   - segment: 'New'
   *   - preferences: email comms, newsletter on, promotions on
   * 
   * @param {Object} data - Profile data (userId, firstName, lastName, email, etc.)
   * @returns {Object} Created profile with _id and timestamps
   */
  static async create(data) {
    const profile = {
      _id: uuidv4(),
      userId: data.userId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || '',
      userType: data.userType || 'Consumer',
      address: data.address || {},
      preferences: {
        communication: data.communication || 'email',
        newsletter: data.newsletter !== false,
        promotions: data.promotions !== false
      },
      stats: {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        lastOrderDate: null,
        firstOrderDate: null,
        orderFrequency: 0
      },
      loyalty: {
        tier: 'Bronze',
        points: 0,
        programId: null,
        enrolledAt: null
      },
      lifetimeValue: {
        historical: 0,
        predicted: 0,
        retentionProbability: 0.5
      },
      segment: 'New',
      notes: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await db.customerProfiles.insert(profile);
    return profile;
  }

  /**
   * Find a profile by its _id.
   * 
   * @param {string} id - Profile UUID
   * @returns {Object|null} Profile or null
   */
  static async findById(id) {
    return await db.customerProfiles.findOne({ _id: id });
  }

  /**
   * Find a profile by linked userId.
   * 
   * SRS: FR-016 - Get profile for authenticated user
   * Used by get-or-create pattern to find existing profile.
   * 
   * @param {string} userId - User account ID
   * @returns {Object|null} Profile or null
   */
  static async findByUserId(userId) {
    return await db.customerProfiles.findOne({ userId });
  }

  /**
   * Find all profiles matching a query.
   * 
   * Default sort: createdAt DESC (newest profiles first)
   * 
   * @param {Object} query - NeDB query filter
   * @returns {Array} Matching profiles
   */
  static async find(query = {}) {
    return await db.customerProfiles.find(query, { sort: { createdAt: -1 } });
  }

  /**
   * Update a profile's fields.
   * 
   * Automatically updates the updatedAt timestamp.
   * 
   * @param {string} id - Profile UUID
   * @param {Object} updates - Fields to update
   * @returns {Object} Updated profile
   */
  static async update(id, updates) {
    updates.updatedAt = new Date();
    await db.customerProfiles.update({ _id: id }, { $set: updates });
    return await db.customerProfiles.findOne({ _id: id });
  }

  /**
   * Search profiles by name, email, or phone.
   * 
   * SRS: FR-016 - Customer search
   * Uses case-insensitive regex across multiple fields.
   * 
   * @param {string} searchTerm - Search term
   * @returns {Array} Matching profiles
   */
  static async search(searchTerm) {
    const regex = new RegExp(searchTerm, 'i');
    return await db.customerProfiles.find({
      $or: [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { phone: regex }
      ]
    });
  }

  /**
   * Segment customers by criteria (AND logic).
   * 
   * SRS: FR-016 - Customer segmentation by type and purchase volume
   * 
   * Supported criteria:
   *   - minOrders: Minimum totalOrders
   *   - maxOrders: Maximum totalOrders
   *   - minSpent: Minimum totalSpent
   *   - tier: Exact loyalty tier match
   *   - userType: Exact userType match
   * 
   * @param {Object} criteria - Segmentation criteria
   * @returns {Array} Profiles matching ALL criteria
   */
  static async segment(criteria) {
    const all = await db.customerProfiles.find({});
    return all.filter(profile => {
      if (criteria.minOrders && profile.stats.totalOrders < criteria.minOrders) return false;
      if (criteria.maxOrders && profile.stats.totalOrders > criteria.maxOrders) return false;
      if (criteria.minSpent && profile.stats.totalSpent < criteria.minSpent) return false;
      if (criteria.tier && profile.loyalty.tier !== criteria.tier) return false;
      if (criteria.userType && profile.userType !== criteria.userType) return false;
      return true;
    });
  }

  /**
   * Calculate Customer Lifetime Value (CLV) for a profile.
   * 
   * SRS: FR-016 - Calculate customer lifetime value
   * 
   * CLV Formula: avgOrderValue * orderFrequency * customerLifespan
   *   - avgOrderValue: stats.averageOrderValue (or 0)
   *   - orderFrequency: stats.totalOrders (or 0)
   *   - customerLifespan: Fixed at 2.5 years
   * 
   * Retention Probability: min(0.95, 0.3 + (orderFrequency * 0.05))
   *   - Base: 30% chance of retention
   *   - Increases by 5% per order placed
   *   - Capped at 95%
   * 
   * Updates profile's lifetimeValue fields and returns the calculation.
   * 
   * @param {string} id - Profile UUID
   * @returns {Object|null} { historical, predicted, retentionProbability } or null
   */
  static async calculateCLV(id) {
    const profile = await this.findById(id);
    if (!profile) return null;

    const stats = profile.stats;
    const avgOrderValue = stats.averageOrderValue || 0;
    const orderFrequency = stats.totalOrders || 0;
    const customerLifespan = 2.5;
    const clv = avgOrderValue * orderFrequency * customerLifespan;
    const retention = Math.min(0.95, 0.3 + (orderFrequency * 0.05));

    // Persist calculated CLV back to profile
    await this.update(id, {
      'lifetimeValue.historical': stats.totalSpent,
      'lifetimeValue.predicted': clv,
      'lifetimeValue.retentionProbability': retention
    });

    return { historical: stats.totalSpent, predicted: clv, retentionProbability: retention };
  }
}

module.exports = CustomerProfile;