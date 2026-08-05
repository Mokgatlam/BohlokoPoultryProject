/**
 * Campaign Model
 * ==============
 * 
 * SRS Reference: FR-016 (Customer Relationship Management - Campaigns)
 * 
 * Data model for promotional marketing campaigns. Tracks campaign creation,
 * lifecycle management, and performance metrics.
 * 
 * Schema Fields:
 *   _id:              UUID - Unique identifier
 *   name:             String - Campaign name
 *   description:      String - Campaign description
 *   type:             String - Campaign type (discount|promotion|newsletter|announcement)
 *   channel:          String - Communication channel (email|sms|both)
 *   subject:          String - Email/SMS subject line
 *   content:          String - Campaign content/message body
 *   targetAudience:   String - Target audience (default: 'all')
 *   targetCriteria:   Object - Segmentation criteria for targeting
 *   discount:         Number - Discount amount (if applicable)
 *   discountType:     String - Discount type (percentage|fixed, default: 'percentage')
 *   startDate:        Date - Campaign start date
 *   endDate:          Date|null - Campaign end date (null = ongoing)
 *   status:           String - Campaign status (Draft|Active|Paused|Completed)
 *   stats:            Object - Performance metrics
 *     - sent:       Number - Messages sent
 *     - opened:     Number - Messages opened
 *     - clicked:    Number - Links clicked
 *     - converted:  Number - Conversions (orders placed)
 *     - revenue:    Number - Revenue generated (ZAR)
 *   createdBy:        String - Admin user ID who created campaign
 *   createdAt:        Date - Creation timestamp
 *   updatedAt:        Date - Last modification timestamp
 * 
 * Lifecycle:
 *   Draft -> Active -> Paused -> Active (resume)
 *   Draft -> Active -> Completed
 * 
 * Storage: NeDB collection 'promotionalCampaigns'
 * Sorting: Default sort by createdAt DESC
 * 
 * Performance Metrics:
 *   - conversionRate: (converted / sent) * 100
 *   - roi: ((revenue - discount) / discount) * 100
 */

const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class Campaign {
  /**
   * Create a new promotional campaign.
   * 
   * SRS: FR-016 - Create promotional campaign
   * 
   * Defaults:
   *   - status: 'Draft' (requires activation)
   *   - stats: All zeros (no activity yet)
   *   - targetAudience: 'all'
   *   - discountType: 'percentage'
   * 
   * @param {Object} data - Campaign data
   * @param {string} data.name - Campaign name (required)
   * @param {string} data.type - discount|promotion|newsletter|announcement
   * @param {string} data.channel - email|sms|both
   * @param {number} [data.discount] - Discount amount
   * @param {string} [data.createdBy] - Admin user ID
   * @returns {Object} Created campaign
   */
  static async create(data) {
    const campaign = {
      _id: uuidv4(),
      name: data.name,
      description: data.description || '',
      type: data.type,
      channel: data.channel,
      subject: data.subject || '',
      content: data.content || '',
      targetAudience: data.targetAudience || 'all',
      targetCriteria: data.targetCriteria || {},
      discount: data.discount || 0,
      discountType: data.discountType || 'percentage',
      startDate: data.startDate || new Date(),
      endDate: data.endDate || null,
      status: 'Draft',
      stats: {
        sent: 0,
        opened: 0,
        clicked: 0,
        converted: 0,
        revenue: 0
      },
      createdBy: data.createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await db.promotionalCampaigns.insert(campaign);
    return campaign;
  }

  /**
   * Find all campaigns matching a query.
   * 
   * Default sort: createdAt DESC (newest first)
   * 
   * @param {Object} query - NeDB query filter
   * @returns {Array} Matching campaigns
   */
  static async find(query = {}) {
    return await db.promotionalCampaigns.find(query).sort({ createdAt: -1 }).exec();
  }

  /**
   * Find a single campaign by ID.
   * 
   * @param {string} id - Campaign UUID
   * @returns {Object|null} Campaign or null
   */
  static async findById(id) {
    return await db.promotionalCampaigns.findOne({ _id: id });
  }

  /**
   * Update campaign fields.
   * 
   * Automatically updates the updatedAt timestamp.
   * 
   * @param {string} id - Campaign UUID
   * @param {Object} updates - Fields to update
   * @returns {Object} Updated campaign
   */
  static async update(id, updates) {
    updates.updatedAt = new Date();
    await db.promotionalCampaigns.update({ _id: id }, { $set: updates });
    return await db.promotionalCampaigns.findOne({ _id: id });
  }

  /**
   * Activate a draft or paused campaign.
   * 
   * SRS: FR-016 - Campaign lifecycle management
   * Sets status to 'Active', records startDate as current time.
   * 
   * @param {string} id - Campaign UUID
   * @returns {Object} Activated campaign
   */
  static async activate(id) {
    return await this.update(id, { status: 'Active', startDate: new Date() });
  }

  /**
   * Pause an active campaign.
   * 
   * SRS: FR-016 - Campaign lifecycle management
   * Sets status to 'Paused'.
   * 
   * @param {string} id - Campaign UUID
   * @returns {Object} Paused campaign
   */
  static async pause(id) {
    return await this.update(id, { status: 'Paused' });
  }

  /**
   * Get performance metrics for a campaign.
   * 
   * SRS: FR-016 - Campaign performance tracking
   * 
   * Returns:
   *   - Raw stats: sent, opened, clicked, converted, revenue
   *   - conversionRate: (converted / sent) * 100 (2 decimal places)
   *   - roi: ((revenue - discount) / discount) * 100 (2 decimal places)
   * 
   * @param {string} id - Campaign UUID
   * @returns {Object|null} Performance metrics or null if not found
   */
  static async getPerformance(id) {
    const campaign = await this.findById(id);
    if (!campaign) return null;
    return {
      ...campaign.stats,
      conversionRate: campaign.stats.sent > 0 ? ((campaign.stats.converted / campaign.stats.sent) * 100).toFixed(2) : 0,
      roi: campaign.stats.revenue > 0 ? ((campaign.stats.revenue - (campaign.discount || 0)) / (campaign.discount || 1) * 100).toFixed(2) : 0
    };
  }

  /**
   * Get aggregated statistics across all campaigns.
   * 
   * SRS: FR-016 - Campaign analytics dashboard
   * 
   * Returns:
   *   - total, active, draft, completed: Campaign counts by status
   *   - totalSent: Sum of all sent metrics
   *   - totalConverted: Sum of all conversion metrics
   *   - totalRevenue: Sum of all revenue metrics
   * 
   * @returns {Object} Campaign statistics
   */
  static async getAllStats() {
    const all = await db.promotionalCampaigns.find({});
    return {
      total: all.length,
      active: all.filter(c => c.status === 'Active').length,
      draft: all.filter(c => c.status === 'Draft').length,
      completed: all.filter(c => c.status === 'Completed').length,
      totalSent: all.reduce((sum, c) => sum + (c.stats?.sent || 0), 0),
      totalConverted: all.reduce((sum, c) => sum + (c.stats?.converted || 0), 0),
      totalRevenue: all.reduce((sum, c) => sum + (c.stats?.revenue || 0), 0)
    };
  }
}

module.exports = Campaign;