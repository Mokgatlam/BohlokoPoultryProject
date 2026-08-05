/**
 * System Log Service
 * ==================
 * 
 * SRS Reference: FR-023 (Data Management)
 * 
 * Business logic for system logging, querying, and cleanup. Provides the
 * audit trail layer for all system operations.
 * 
 * Responsibilities:
 *   - Create structured log entries with context
 *   - Query logs by level, user, category, date range
 *   - Cleanup old logs to prevent unbounded growth
 *   - Provide recent/error log views
 * 
 * Architecture:
 *   - Repository Pattern: BaseRepository over systemLogs collection
 *   - Structured Logging: Each entry includes level, message, context
 *   - Singleton Pattern: Exported as a single instance
 * 
 * Data Store: systemLogs.db (via BaseRepository)
 * 
 * FR-023 Coverage:
 *   6. Implement data archiving for historical records (log cleanup)
 * 
 * Log Entry Structure:
 *   - level: info | warn | error | debug
 *   - message: Human-readable description
 *   - category: auth | production | harvest | inventory | order | payment | system | crm
 *   - userId: User who performed the action
 *   - userName: User's display name
 *   - action: Action taken (e.g., 'login', 'create_order')
 *   - resource: Resource type (e.g., 'order', 'inventory')
 *   - resourceId: Specific resource ID
 *   - details: Additional context data
 *   - ipAddress: Client IP address
 *   - userAgent: Client user agent string
 *   - method: HTTP method (GET, POST, etc.)
 *   - path: Request path
 *   - statusCode: Response status code
 *   - responseTime: Response time in ms
 *   - error: Error message
 *   - stack: Error stack trace
 *   - timestamp: When the log was created
 */

const BaseRepository = require('../repositories/BaseRepository');
const db = require('../config/db');

class SystemLogService {
  /**
   * Initialize the repository for system logs.
   */
  constructor() {
    this.repo = new BaseRepository(db.systemLogs);
  }

  /**
   * Create a new system log entry.
   * 
   * @param {Object} data - Log data
   * @param {string} [data.level='info'] - Log level
   * @param {string} data.message - Log message
   * @param {string} [data.category='system'] - Log category
   * @param {string} [data.userId] - User ID
   * @param {string} [data.userName] - User name
   * @param {string} [data.action] - Action taken
   * @param {string} [data.resource] - Resource type
   * @param {string} [data.resourceId] - Resource ID
   * @param {Object} [data.details] - Additional details
   * @param {string} [data.ipAddress] - Client IP
   * @param {string} [data.userAgent] - Client user agent
   * @param {string} [data.method] - HTTP method
   * @param {string} [data.path] - Request path
   * @param {number} [data.statusCode] - Response status
   * @param {number} [data.responseTime] - Response time (ms)
   * @param {string} [data.error] - Error message
   * @param {string} [data.stack] - Error stack trace
   * @returns {Object} Created log entry
   */
  async create(data) {
    return await this.repo.create({
      level: data.level || 'info',
      message: data.message,
      category: data.category || 'system',
      userId: data.userId || null,
      userName: data.userName || null,
      action: data.action || null,
      resource: data.resource || null,
      resourceId: data.resourceId || null,
      details: data.details || {},
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      method: data.method || null,
      path: data.path || null,
      statusCode: data.statusCode || null,
      responseTime: data.responseTime || null,
      error: data.error || null,
      stack: data.stack || null,
      timestamp: new Date()
    });
  }

  /**
   * Get logs with multiple filter dimensions.
   * 
   * @param {Object} [filters] - Filter criteria
   * @param {string} [filters.level] - Log level
   * @param {string} [filters.category] - Category
   * @param {string} [filters.userId] - User ID
   * @param {string} [filters.startDate] - Start date (ISO 8601)
   * @param {string} [filters.endDate] - End date (ISO 8601)
   * @returns {Array} Matching log entries
   */
  async getAll(filters = {}) {
    const query = {};
    if (filters.level) query.level = filters.level;
    if (filters.category) query.category = filters.category;
    if (filters.userId) query.userId = filters.userId;
    if (filters.startDate && filters.endDate) {
      query.timestamp = { $gte: new Date(filters.startDate), $lte: new Date(filters.endDate) };
    }
    return await this.repo.find(query);
  }

  /**
   * Get a log entry by ID.
   * 
   * @param {string} id - Log ID
   * @returns {Object|null} Log entry or null
   */
  async getById(id) {
    return await this.repo.findById(id);
  }

  /**
   * Get all logs with a specific level.
   * 
   * @param {string} level - Log level (info, warn, error, debug)
   * @returns {Array} Matching log entries
   */
  async getByLevel(level) {
    return await this.repo.find({ level });
  }

  /**
   * Get all logs for a specific user.
   * 
   * @param {string} userId - User ID
   * @returns {Array} Log entries for the user
   */
  async getByUser(userId) {
    return await this.repo.find({ userId });
  }

  /**
   * Get all logs in a specific category.
   * 
   * @param {string} category - Category name
   * @returns {Array} Matching log entries
   */
  async getByCategory(category) {
    return await this.repo.find({ category });
  }

  /**
   * Get the most recent log entries.
   * 
   * @param {number} [limit=100] - Maximum entries to return
   * @returns {Array} Most recent log entries
   */
  async getRecent(limit = 100) {
    const all = await this.repo.find({});
    return all.slice(0, limit);
  }

  /**
   * Get error-level log entries.
   * 
   * @param {number} [limit=50] - Maximum entries to return
   * @returns {Array} Error log entries
   */
  async getErrors(limit = 50) {
    const all = await this.repo.find({ level: 'error' });
    return all.slice(0, limit);
  }

  /**
   * Delete system logs older than a specified number of days.
   * 
   * SRS: FR-023.6 - Data archiving for historical records
   * 
   * Process:
   *   1. Calculate cutoff date (now - days)
   *   2. Find all logs with timestamp < cutoff
   *   3. Delete each matching log
   *   4. Return count of deleted logs
   * 
   * @param {number} [days=90] - Days to keep
   * @returns {number} Count of deleted logs
   */
  async clearOldLogs(days = 90) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const old = await this.repo.find({ timestamp: { $lt: cutoff } });
    for (const log of old) {
      await this.repo.collection.remove({ _id: log._id });
    }
    return old.length;
  }

  /**
   * Get the count of all system log entries.
   * 
   * @returns {number} Total log count
   */
  async count() {
    return await this.repo.count();
  }
}

module.exports = new SystemLogService();