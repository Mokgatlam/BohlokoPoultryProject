/**
 * CRM Service
 * ===========
 * 
 * SRS Reference: FR-016 (Customer Relationship Management)
 * 
 * Business logic layer for all CRM operations. Consolidates customer profiles,
 * loyalty programs, feedback management, and promotional campaigns into a
 * single service.
 * 
 * Responsibilities:
 *   - Customer profile CRUD with get-or-create pattern
 *   - Profile updates with field whitelisting (mass assignment prevention)
 *   - Customer search, segmentation, and CSV export
 *   - Loyalty program enrollment and reward catalog
 *   - Feedback/complaint submission, response, and resolution
 *   - Campaign creation, activation, pausing, and performance tracking
 *   - CRM dashboard statistics aggregation
 *   - Customer Lifetime Value (CLV) calculation
 * 
 * Design Patterns:
 *   - Singleton: Exported as instance
 *   - Facade: Delegates to 4 model classes (CustomerProfile, Loyalty, Feedback, Campaign)
 *   - Get-or-Create: Auto-initializes profile on first access
 *   - Field Whitelisting: Prevents mass assignment in profile updates
 * 
 * Dependencies:
 *   - CustomerProfile: Profile data operations
 *   - LoyaltyProgram, PointsTransaction, CustomerEnrollment: Loyalty models
 *   - Feedback: Feedback data operations
 *   - Campaign: Campaign data operations
 */

const CustomerProfile = require('../models/CustomerProfile');
const { LoyaltyProgram, PointsTransaction, CustomerEnrollment } = require('../models/Loyalty');
const Feedback = require('../models/Feedback');
const Campaign = require('../models/Campaign');

/**
 * REWARD_CATALOG - Static catalog of available loyalty rewards.
 * 
 * SRS: FR-016 - Loyalty rewards program
 * Each reward has: id, name, points cost, description
 * Users can "purchase" rewards when their points balance >= reward.points
 */
const REWARD_CATALOG = [
  { id: 1, name: '5% Discount', points: 500, description: 'Get 5% off your next order' },
  { id: 2, name: '10% Discount', points: 1000, description: 'Get 10% off your next order' },
  { id: 3, name: 'Free Delivery', points: 300, description: 'Free delivery on your next order' },
  { id: 4, name: 'Free Chicken (1kg)', points: 2000, description: 'Get a free whole chicken' },
  { id: 5, name: 'R100 Voucher', points: 1500, description: 'R100 off your next order' }
];

class CrmService {
  // =========================================================================
  // CUSTOMER PROFILES
  // =========================================================================

  /**
   * Get or create the current user's customer profile.
   * 
   * SRS: FR-016 - Customer profile management
   * 
   * Get-or-Create Pattern:
   *   1. Try to find existing profile by userId
   *   2. If not found, create new profile from user registration data
   *   3. Return profile (existing or newly created)
   * 
   * This ensures every user always has a profile without explicit initialization.
   * 
   * @param {Object} user - Authenticated user object
   * @returns {Object} Customer profile
   */
  async getMyProfile(user) {
    let profile = await CustomerProfile.findByUserId(user._id);
    if (!profile) {
      profile = await CustomerProfile.create({
        userId: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        userType: user.userType
      });
    }
    return profile;
  }

  /**
   * Get a customer profile by ID.
   * 
   * SRS: FR-016 - Admin customer view
   * 
   * @param {string} id - CustomerProfile ID
   * @returns {Object} Customer profile
   * @throws {Error} If profile not found
   */
  async getProfileById(id) {
    const profile = await CustomerProfile.findById(id);
    if (!profile) throw new Error('Profile not found');
    return profile;
  }

  /**
   * Update customer profile with authorization and field whitelisting.
   * 
   * SRS: FR-015 - Update user profiles, FR-016 - Customer profile management
   * 
   * Security:
   *   - Owner-based authorization: only profile owner or Farm Manager can update
   *   - Field whitelisting: only allowed fields are processed
   *   - Prevents mass assignment attacks (e.g., modifying role, loyalty, stats)
   * 
   * Allowed fields: firstName, lastName, phone, email, address, businessName, preferences
   * 
   * @param {string} id - CustomerProfile ID
   * @param {Object} data - Fields to update
   * @param {Object} user - Authenticated user
   * @returns {Object} Updated profile
   * @throws {Error} If not authorized or profile not found
   */
  async updateProfile(id, data, user) {
    const profile = await CustomerProfile.findById(id);
    if (!profile) throw new Error('Profile not found');

    // Owner-based authorization check
    if (profile.userId && profile.userId.toString() !== user._id.toString() && user.role !== 'Farm Manager') {
      throw new Error('Not authorized');
    }

    // Field whitelisting (prevents mass assignment)
    const allowedFields = ['firstName', 'lastName', 'phone', 'email', 'address', 'businessName', 'preferences'];
    const filtered = {};
    allowedFields.forEach(f => { if (data[f] !== undefined) filtered[f] = data[f]; });

    return await CustomerProfile.update(id, filtered);
  }

  /**
   * Search customers by name, email, or phone.
   * 
   * SRS: FR-016 - Customer search
   * Uses regex for case-insensitive partial matching across multiple fields.
   * 
   * @param {string} q - Search term
   * @returns {Array} Matching customer profiles
   */
  async searchCustomers(q) {
    if (!q) return [];
    return await CustomerProfile.search(q);
  }

  /**
   * Get all customer profiles.
   * 
   * SRS: FR-016 - Customer list
   * @returns {Array} All customer profiles
   */
  async getAllCustomers() {
    return await CustomerProfile.find();
  }

  /**
   * Segment customers by criteria (type, orders, spending, tier).
   * 
   * SRS: FR-016 - Customer segmentation by type and purchase volume
   * 
   * Criteria (all AND logic):
   *   - minOrders: Minimum total orders
   *   - maxOrders: Maximum total orders
   *   - minSpent: Minimum total spent
   *   - tier: Loyalty tier
   *   - userType: Customer type
   * 
   * @param {Object} criteria - Segmentation criteria
   * @returns {Array} Matching customer profiles
   */
  async segmentCustomers(criteria) {
    return await CustomerProfile.segment(criteria);
  }

  /**
   * Export all customers to CSV format.
   * 
   * SRS: FR-015 - Export user lists for communication
   * 
   * CSV columns: Name, Email, Phone, Type, Tier, Total Orders, Total Spent, Segment
   * 
   * @returns {String} CSV-formatted string
   */
  async exportCustomersCsv() {
    const customers = await CustomerProfile.find();
    const csv = 'Name,Email,Phone,Type,Tier,Total Orders,Total Spent,Segment\n' +
      customers.map(c =>
        `${c.firstName} ${c.lastName},${c.email},${c.phone},${c.userType},${c.loyalty?.tier || ''},${c.stats?.totalOrders || 0},${c.stats?.totalSpent || 0},${c.segment || ''}`
      ).join('\n');
    return csv;
  }

  // =========================================================================
  // LOYALTY PROGRAMS
  // =========================================================================

  /**
   * Enroll current user in the loyalty program.
   * 
   * SRS: FR-016 - Loyalty program enrollment
   * 
   * Process:
   *   1. Check if already enrolled (prevent duplicates)
   *   2. Get or create default loyalty program (Bohloko Rewards)
   *   3. Get user's customer profile
   *   4. Create enrollment record (Bronze tier, 0 points)
   *   5. Update profile with program ID and enrollment date
   * 
   * @param {Object} user - Authenticated user
   * @returns {Object} Enrollment record
   * @throws {Error} If already enrolled
   */
  async enrollLoyalty(user) {
    const existing = await CustomerEnrollment.findByUser(user._id);
    if (existing) throw new Error('Already enrolled');

    const program = await LoyaltyProgram.getDefault();
    const profile = await CustomerProfile.findByUserId(user._id);

    const enrollment = await CustomerEnrollment.create({
      customerId: profile?._id,
      userId: user._id,
      programId: program._id
    });

    // Update profile with loyalty program reference
    if (profile) {
      await CustomerProfile.update(profile._id, {
        'loyalty.programId': program._id,
        'loyalty.enrolledAt': new Date()
      });
    }

    return enrollment;
  }

  /**
   * Get available rewards based on user's points balance.
   * 
   * SRS: FR-016 - Loyalty rewards catalog
   * 
   * @param {Object} user - Authenticated user
   * @returns {Object} { points, rewards (full catalog), available (affordable) }
   */
  async getAvailableRewards(user) {
    const profile = await CustomerProfile.findByUserId(user._id);
    const points = profile?.loyalty?.points || 0;
    const available = REWARD_CATALOG.filter(r => points >= r.points);
    return { points, rewards: REWARD_CATALOG, available };
  }

  /**
   * Get loyalty points transaction history for a user.
   * 
   * SRS: FR-016 - Loyalty points tracking
   * 
   * @param {string} userId - User ID
   * @returns {Array} Points transactions sorted by createdAt DESC
   */
  async getLoyaltyTransactions(userId) {
    return await PointsTransaction.findByCustomer(userId);
  }

  // =========================================================================
  // FEEDBACK & COMPLAINTS
  // =========================================================================

  /**
   * Create a new feedback/complaint record.
   * 
   * SRS: FR-016 - Track customer feedback and complaints
   * 
   * @param {Object} data - { type, subject, message, rating, ... }
   * @param {Object} user - Authenticated user
   * @returns {Object} Created feedback with status='Open'
   */
  async createFeedback(data, user) {
    return await Feedback.create({
      ...data,
      customerId: user._id,
      userId: user._id,
      customerName: `${user.firstName} ${user.lastName}`
    });
  }

  /**
   * Get feedback with optional filtering.
   * 
   * SRS: FR-016 - View feedback (admin)
   * 
   * @param {Object} query - { status, type } optional filters
   * @returns {Array} Matching feedback records
   */
  async getFeedback(query = {}) {
    const { status, type } = query;
    const dbQuery = {};
    if (status) dbQuery.status = status;
    if (type) dbQuery.type = type;
    return await Feedback.find(dbQuery);
  }

  /**
   * Get aggregated feedback statistics.
   * 
   * SRS: FR-016 - Feedback analytics
   * @returns {Object} Statistics with counts by status, type, priority, avg rating
   */
  async getFeedbackStatistics() {
    return await Feedback.getStatistics();
  }

  /**
   * Respond to a feedback/complaint.
   * 
   * SRS: FR-016 - Respond to customer feedback
   * Sets status to 'Responded', records response text, respondedBy, respondedAt
   * 
   * @param {string} id - Feedback ID
   * @param {string} response - Admin response text
   * @param {string} userId - ID of responding admin
   * @returns {Object} Updated feedback
   */
  async respondToFeedback(id, response, userId) {
    return await Feedback.respond(id, response, userId);
  }

  /**
   * Mark feedback as resolved.
   * 
   * SRS: FR-016 - Resolve customer complaints
   * Sets status to 'Resolved', records resolvedAt timestamp
   * 
   * @param {string} id - Feedback ID
   * @returns {Object} Updated feedback
   */
  async resolveFeedback(id) {
    return await Feedback.resolve(id);
  }

  // =========================================================================
  // CAMPAIGNS
  // =========================================================================

  /**
   * Create a new promotional campaign.
   * 
   * SRS: FR-016 - Send promotional communications
   * Initial status: 'Draft', stats initialized to zeros
   * 
   * @param {Object} data - { name, type, channel, discount, content, ... }
   * @param {Object} user - Authenticated user (creator)
   * @returns {Object} Created campaign
   */
  async createCampaign(data, user) {
    return await Campaign.create({ ...data, createdBy: user._id });
  }

  /**
   * Get all campaigns.
   * 
   * SRS: FR-016 - Campaign management
   * @returns {Array} All campaigns sorted by createdAt DESC
   */
  async getCampaigns() {
    return await Campaign.find();
  }

  /**
   * Get performance metrics for a campaign.
   * 
   * SRS: FR-016 - Campaign performance tracking
   * Returns raw stats plus calculated conversionRate and ROI.
   * 
   * @param {string} id - Campaign ID
   * @returns {Object} Performance metrics
   * @throws {Error} If campaign not found
   */
  async getCampaignPerformance(id) {
    const performance = await Campaign.getPerformance(id);
    if (!performance) throw new Error('Campaign not found');
    return performance;
  }

  /**
   * Activate a draft or paused campaign.
   * 
   * SRS: FR-016 - Campaign lifecycle
   * Sets status to 'Active', records startDate
   * 
   * @param {string} id - Campaign ID
   * @returns {Object} Activated campaign
   */
  async activateCampaign(id) {
    return await Campaign.activate(id);
  }

  /**
   * Pause an active campaign.
   * 
   * SRS: FR-016 - Campaign lifecycle
   * Sets status to 'Paused'
   * 
   * @param {string} id - Campaign ID
   * @returns {Object} Paused campaign
   */
  async pauseCampaign(id) {
    return await Campaign.pause(id);
  }

  // =========================================================================
  // DASHBOARD & ANALYTICS
  // =========================================================================

  /**
   * Generate aggregated CRM dashboard statistics.
   * 
   * SRS: FR-016 - Customer analytics dashboard
   * 
   * Aggregates data from:
   *   - CustomerProfile: Segments, loyalty tiers, revenue, CLV
   *   - Feedback: Open/responded/resolved counts
   *   - Campaign: Active/draft/completed counts, total sent/converted/revenue
   * 
   * @returns {Object} Comprehensive CRM dashboard data
   */
  async getDashboardStats() {
    const customers = await CustomerProfile.find();
    const feedbackStats = await Feedback.getStatistics();
    const campaignStats = await Campaign.getAllStats();

    return {
      totalCustomers: customers.length,
      newCustomers: customers.filter(c => c.segment === 'New').length,
      returningCustomers: customers.filter(c => c.segment === 'Returning').length,
      vipCustomers: customers.filter(c => c.segment === 'VIP').length,
      totalRevenue: customers.reduce((sum, c) => sum + (c.stats?.totalSpent || 0), 0),
      averageLifetimeValue: customers.length > 0
        ? customers.reduce((sum, c) => sum + (c.lifetimeValue?.predicted || 0), 0) / customers.length
        : 0,
      loyaltyDistribution: {
        Bronze: customers.filter(c => c.loyalty?.tier === 'Bronze').length,
        Silver: customers.filter(c => c.loyalty?.tier === 'Silver').length,
        Gold: customers.filter(c => c.loyalty?.tier === 'Gold').length,
        Platinum: customers.filter(c => c.loyalty?.tier === 'Platinum').length,
        Diamond: customers.filter(c => c.loyalty?.tier === 'Diamond').length
      },
      feedback: feedbackStats,
      campaigns: campaignStats
    };
  }

  // =========================================================================
  // CUSTOMER LIFETIME VALUE
  // =========================================================================

  /**
   * Calculate Customer Lifetime Value for a specific customer.
   * 
   * SRS: FR-016 - Calculate customer lifetime value
   * 
   * CLV Formula: avgOrderValue * orderFrequency * customerLifespan
   *   - avgOrderValue: From profile stats.averageOrderValue
   *   - orderFrequency: From profile stats.totalOrders
   *   - customerLifespan: Fixed at 2.5 years
   * 
   * Retention Probability: min(0.95, 0.3 + (orderFrequency * 0.05))
   *   - Base: 30% retention
   *   - Increases by 5% per order, capped at 95%
   * 
   * Updates profile's lifetimeValue fields (historical, predicted, retentionProbability)
   * 
   * @param {string} id - CustomerProfile ID
   * @returns {Object} { historical, predicted, retentionProbability }
   * @throws {Error} If customer not found
   */
  async calculateCLV(id) {
    const clv = await CustomerProfile.calculateCLV(id);
    if (!clv) throw new Error('Customer not found');
    return clv;
  }
}

module.exports = new CrmService();