/**
 * Notification Config Service
 * ============================
 * 
 * SRS Reference: FR-022 (System Configuration)
 * 
 * Business logic for notification template and channel management.
 * Controls how notifications are delivered (email, SMS, push, in-app).
 * 
 * Responsibilities:
 *   - CRUD operations for notification configurations
 *   - Toggle enabled/disabled status
 *   - Query by type and enabled status
 *   - Default channel configuration
 * 
 * Architecture:
 *   - Repository Pattern: BaseRepository over notificationConfigs collection
 *   - Singleton Pattern: Exported as a single instance
 * 
 * Data Store: notificationConfigs.db (via BaseRepository)
 * 
 * FR-022 Coverage:
 *   4. Configure notification templates
 * 
 * Notification Configuration Structure:
 *   - type: Notification type identifier
 *   - name: Human-readable name
 *   - description: Description of the notification
 *   - enabled: Whether this notification is active
 *   - channels: Which delivery channels to use
 *     - email: Boolean
 *     - sms: Boolean
 *     - push: Boolean
 *     - inApp: Boolean
 *   - recipients: Who receives this notification
 *     - roles: Array of role names
 *     - users: Array of user IDs
 *   - template: Message template content
 *   - subject: Email subject line
 *   - schedule: When to send (cron-like or event-based)
 *   - conditions: Conditions that must be met to trigger
 *   - rateLimit: { maxPerHour, maxPerDay }
 *   - priority: low, normal, high, urgent
 *   - createdBy: User who created the config
 */

const BaseRepository = require('../repositories/BaseRepository');
const db = require('../config/db');

class NotificationConfigService {
  /**
   * Initialize the repository for notification configurations.
   */
  constructor() {
    this.repo = new BaseRepository(db.notificationConfigs);
  }

  /**
   * Create a new notification configuration.
   * 
   * @param {Object} data - Configuration data
   * @param {string} data.type - Notification type (e.g., 'order_confirmation')
   * @param {string} data.name - Human-readable name
   * @param {string} [data.description] - Description
   * @param {boolean} [data.enabled=true] - Whether enabled
   * @param {Object} [data.channels] - Channel config (email, sms, push, inApp)
   * @param {Object} [data.recipients] - Recipient config (roles, users)
   * @param {string} [data.template] - Message template
   * @param {string} [data.subject] - Email subject
   * @param {Object} [data.schedule] - Schedule config
   * @param {Object} [data.conditions] - Trigger conditions
   * @param {Object} [data.rateLimit] - Rate limit config
   * @param {string} [data.priority='normal'] - Priority level
   * @param {string} userId - Creator user ID
   * @returns {Object} Created configuration
   */
  async create(data, userId) {
    return await this.repo.create({
      type: data.type,
      name: data.name,
      description: data.description || '',
      enabled: data.enabled !== false,
      channels: data.channels || { email: true, sms: false, push: true, inApp: true },
      recipients: data.recipients || { roles: [], users: [] },
      template: data.template || '',
      subject: data.subject || '',
      schedule: data.schedule || null,
      conditions: data.conditions || {},
      rateLimit: data.rateLimit || { maxPerHour: 10, maxPerDay: 50 },
      priority: data.priority || 'normal',
      metadata: data.metadata || {},
      createdBy: userId
    });
  }

  /**
   * Get all notification configurations with optional filtering.
   * 
   * @param {Object} [filters] - { type, enabled }
   * @returns {Array} Matching configurations
   */
  async getAll(filters = {}) {
    const query = {};
    if (filters.type) query.type = filters.type;
    if (filters.enabled !== undefined) query.enabled = filters.enabled;
    return await this.repo.find(query);
  }

  /**
   * Get a notification configuration by ID.
   * 
   * @param {string} id - Configuration ID
   * @returns {Object|null} Configuration or null
   */
  async getById(id) {
    return await this.repo.findById(id);
  }

  /**
   * Get a notification configuration by type.
   * 
   * @param {string} type - Notification type
   * @returns {Object|null} Configuration or null
   */
  async getByType(type) {
    return await this.repo.findOne({ type });
  }

  /**
   * Update a notification configuration.
   * 
   * @param {string} id - Configuration ID
   * @param {Object} data - Fields to update
   * @returns {Object} Updated configuration
   */
  async update(id, data) {
    return await this.repo.findByIdAndUpdate(id, data);
  }

  /**
   * Toggle the enabled status of a notification configuration.
   * 
   * @param {string} id - Configuration ID
   * @returns {Object} Configuration with toggled status
   * @throws {Error} If config not found
   */
  async toggle(id) {
    const config = await this.repo.findById(id);
    if (!config) throw new Error('Config not found');
    return await this.repo.findByIdAndUpdate(id, { enabled: !config.enabled });
  }

  /**
   * Delete a notification configuration.
   * 
   * @param {string} id - Configuration ID
   */
  async delete(id) {
    await this.repo.collection.remove({ _id: id });
  }

  /**
   * Get the count of all notification configurations.
   * 
   * @returns {number} Total count
   */
  async count() {
    return await this.repo.count();
  }
}

module.exports = new NotificationConfigService();