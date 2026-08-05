/**
 * Feedback Model
 * ==============
 * 
 * SRS Reference: FR-016 (Customer Relationship Management - Feedback)
 * 
 * Data model for customer feedback, complaints, suggestions, and inquiries.
 * Tracks the full lifecycle from submission through response to resolution.
 * 
 * Schema Fields:
 *   _id:           UUID - Unique identifier
 *   customerId:    String - Submitting customer's user ID
 *   userId:        String - Submitting user ID (same as customerId)
 *   customerName:  String - Display name (denormalized from user)
 *   type:          String - Feedback type (feedback|complaint|suggestion|inquiry)
 *   category:      String - Category (default: 'General')
 *   subject:       String - Feedback subject line
 *   message:       String - Full feedback message
 *   rating:        Number|null - Customer rating (1-5, optional)
 *   orderId:       String|null - Related order ID (optional)
 *   status:        String - Current status (Open|Responded|Resolved)
 *   priority:      String - Priority level (Low|Medium|High|Urgent)
 *   response:      String|null - Admin response text
 *   respondedBy:   String|null - Admin user ID who responded
 *   respondedAt:   Date|null - Response timestamp
 *   resolvedAt:    Date|null - Resolution timestamp
 *   createdAt:     Date - Submission timestamp
 *   updatedAt:     Date - Last modification timestamp
 * 
 * Lifecycle:
 *   Open -> Responded -> Resolved
 * 
 * Storage: NeDB collection 'feedbackComplaints'
 * Sorting: Default sort by createdAt DESC
 * 
 * Statistics: getStatistics() aggregates counts by status, type, priority, and avg rating
 */

const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class Feedback {
  /**
   * Create a new feedback record.
   * 
   * SRS: FR-016 - Submit customer feedback/complaint
   * 
   * Defaults:
   *   - status: 'Open' (requires admin attention)
   *   - priority: 'Medium' (if not specified)
   *   - response: null (not yet responded)
   * 
   * @param {Object} data - Feedback data
   * @param {string} data.type - feedback|complaint|suggestion|inquiry
   * @param {string} data.subject - Subject line
   * @param {string} data.message - Full message
   * @param {number} [data.rating] - Optional 1-5 rating
   * @param {string} [data.customerName] - Customer display name
   * @returns {Object} Created feedback record
   */
  static async create(data) {
    const feedback = {
      _id: uuidv4(),
      customerId: data.customerId,
      userId: data.userId,
      customerName: data.customerName || 'Anonymous',
      type: data.type,
      category: data.category || 'General',
      subject: data.subject,
      message: data.message,
      rating: data.rating || null,
      orderId: data.orderId || null,
      status: 'Open',
      priority: data.priority || 'Medium',
      response: null,
      respondedBy: null,
      respondedAt: null,
      resolvedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await db.feedbackComplaints.insert(feedback);
    return feedback;
  }

  /**
   * Find all feedback matching a query.
   * 
   * Default sort: createdAt DESC (newest first)
   * 
   * @param {Object} query - NeDB query filter
   * @returns {Array} Matching feedback records
   */
  static async find(query = {}) {
    return await db.feedbackComplaints.find(query, { sort: { createdAt: -1 } });
  }

  /**
   * Find a single feedback record by ID.
   * 
   * @param {string} id - Feedback UUID
   * @returns {Object|null} Feedback or null
   */
  static async findById(id) {
    return await db.feedbackComplaints.findOne({ _id: id });
  }

  /**
   * Update feedback fields.
   * 
   * Automatically updates the updatedAt timestamp.
   * 
   * @param {string} id - Feedback UUID
   * @param {Object} updates - Fields to update
   * @returns {Object} Updated feedback
   */
  static async update(id, updates) {
    updates.updatedAt = new Date();
    await db.feedbackComplaints.update({ _id: id }, { $set: updates });
    return await db.feedbackComplaints.findOne({ _id: id });
  }

  /**
   * Respond to a feedback/complaint.
   * 
   * SRS: FR-016 - Respond to customer feedback
   * 
   * Sets:
   *   - response: Admin response text
   *   - respondedBy: Admin user ID
   *   - respondedAt: Current timestamp
   *   - status: 'Responded'
   * 
   * @param {string} id - Feedback UUID
   * @param {string} response - Admin response text
   * @param {string} respondedBy - Admin user ID
   * @returns {Object} Updated feedback
   */
  static async respond(id, response, respondedBy) {
    return await this.update(id, {
      response,
      respondedBy,
      respondedAt: new Date(),
      status: 'Responded'
    });
  }

  /**
   * Mark feedback as resolved.
   * 
   * SRS: FR-016 - Resolve customer complaints
   * 
   * Sets:
   *   - status: 'Resolved'
   *   - resolvedAt: Current timestamp
   * 
   * @param {string} id - Feedback UUID
   * @returns {Object} Updated feedback
   */
  static async resolve(id) {
    return await this.update(id, {
      status: 'Resolved',
      resolvedAt: new Date()
    });
  }

  /**
   * Get aggregated feedback statistics.
   * 
   * SRS: FR-016 - Feedback analytics
   * 
   * Returns:
   *   - total: Total feedback count
   *   - open: Open feedback count
   *   - responded: Responded feedback count
   *   - resolved: Resolved feedback count
   *   - byType: Count by type (feedback, complaint, suggestion, inquiry)
   *   - byPriority: Count by priority (Low, Medium, High, Urgent)
   *   - averageRating: Average rating across all rated feedback
   * 
   * @returns {Object} Feedback statistics
   */
  static async getStatistics() {
    const all = await db.feedbackComplaints.find({});
    return {
      total: all.length,
      open: all.filter(f => f.status === 'Open').length,
      responded: all.filter(f => f.status === 'Responded').length,
      resolved: all.filter(f => f.status === 'Resolved').length,
      byType: {
        feedback: all.filter(f => f.type === 'feedback').length,
        complaint: all.filter(f => f.type === 'complaint').length,
        suggestion: all.filter(f => f.type === 'suggestion').length,
        inquiry: all.filter(f => f.type === 'inquiry').length
      },
      byPriority: {
        low: all.filter(f => f.priority === 'Low').length,
        medium: all.filter(f => f.priority === 'Medium').length,
        high: all.filter(f => f.priority === 'High').length,
        urgent: all.filter(f => f.priority === 'Urgent').length
      },
      averageRating: all.filter(f => f.rating).reduce((sum, f, _, arr) => sum + f.rating / arr.length, 0)
    };
  }
}

module.exports = Feedback;