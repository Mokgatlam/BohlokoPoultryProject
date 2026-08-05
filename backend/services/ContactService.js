/**
 * Contact Service
 * ===============
 * 
 * SRS Reference: FR-016 (Customer Relationship Management)
 * 
 * Business logic layer for handling public contact form messages.
 * Manages the lifecycle of contact messages from submission through
 * response to archival.
 * 
 * Responsibilities:
 *   - Contact message creation with validation
 *   - Message listing and retrieval
 *   - Status management (unread -> read -> responded -> archived)
 *   - Message deletion (hard delete)
 *   - Contact statistics aggregation
 * 
 * Message Lifecycle:
 *   unread -> read -> responded -> archived
 * 
 * Design Principles:
 *   - Input validation at service level (defense in depth)
 *   - Email format validation via regex
 *   - Hard delete for contact messages (not soft-delete)
 * 
 * Dependencies: BaseRepository, db (database)
 */

const BaseRepository = require('../repositories/BaseRepository');
const db = require('../config/db');

class ContactService {
  /**
   * Initialize the contact messages repository.
   */
  constructor() {
    this.repo = new BaseRepository(db.contactMessages);
  }

  /**
   * Create a new contact message with validation.
   * 
   * SRS: FR-016 - Customer inquiry handling
   * 
   * Validates:
   *   - name: Required, trimmed
   *   - email: Required, valid email format (regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/)
   *   - subject: Required, trimmed
   *   - message: Required, trimmed
   *   - phone: Optional, converted to string
   * 
   * Auto-sets: status = 'unread'
   * 
   * @param {Object} data - { name, email, subject, message, phone }
   * @returns {Object} Created contact message
   * @throws {Error} If validation fails
   */
  async createMessage(data) {
    const { name, email, subject, message, phone } = data;
    if (!name || !name.trim()) throw new Error('Name is required');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Valid email is required');
    if (!subject || !subject.trim()) throw new Error('Subject is required');
    if (!message || !message.trim()) throw new Error('Message is required');

    return await this.repo.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? String(phone).trim() : '',
      subject: subject.trim(),
      message: message.trim(),
      status: 'unread'
    });
  }

  /**
   * Get all contact messages with optional query and sorting.
   * 
   * SRS: FR-016 - View contact messages
   * Default sort: createdAt DESC (newest first)
   * 
   * @param {Object} query - Optional filter criteria
   * @returns {Array} Contact messages
   */
  async getAll(query = {}) {
    return await this.repo.find(query, { sort: { createdAt: -1 } });
  }

  /**
   * Get a single contact message by ID.
   * 
   * SRS: FR-016 - View contact message details
   * 
   * @param {string} id - Message ID
   * @returns {Object} Contact message
   * @throws {Error} If message not found
   */
  async getById(id) {
    const message = await this.repo.findById(id);
    if (!message) throw new Error('Message not found');
    return message;
  }

  /**
   * Update contact message status.
   * 
   * SRS: FR-016 - Contact message management
   * 
   * Valid statuses: 'unread', 'read', 'responded', 'archived'
   * 
   * @param {string} id - Message ID
   * @param {string} status - New status
   * @returns {Object} Updated message
   * @throws {Error} If invalid status
   */
  async updateStatus(id, status) {
    const valid = ['unread', 'read', 'responded', 'archived'];
    if (!valid.includes(status)) throw new Error('Invalid status');
    return await this.repo.findByIdAndUpdate(id, { status });
  }

  /**
   * Hard-delete a contact message.
   * 
   * SRS: FR-016 - Contact message cleanup
   * 
   * Note: Uses hard delete (not soft-delete) for contact messages.
   * 
   * @param {string} id - Message ID
   * @returns {Object} Deletion confirmation
   * @throws {Error} If message not found
   */
  async delete(id) {
    const message = await this.repo.findById(id);
    if (!message) throw new Error('Message not found');
    await this.repo.deleteById(id);
    return { message: 'Message deleted' };
  }

  /**
   * Get contact message statistics.
   * 
   * SRS: FR-016 - Contact analytics
   * 
   * Returns counts by status: total, unread, read, responded, archived
   * 
   * @returns {Object} Status breakdown
   */
  async getStatistics() {
    const all = await this.repo.find({});
    return {
      total: all.length,
      unread: all.filter(m => m.status === 'unread').length,
      read: all.filter(m => m.status === 'read').length,
      responded: all.filter(m => m.status === 'responded').length,
      archived: all.filter(m => m.status === 'archived').length
    };
  }
}

module.exports = new ContactService();