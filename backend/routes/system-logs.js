/**
 * System Logs Routes
 * ===================
 * 
 * SRS Reference: FR-023 (Data Management)
 * 
 * REST API endpoints for system log querying, filtering, and cleanup.
 * Provides audit trail visibility for system operations.
 * 
 * Endpoints Summary (7 endpoints):
 * 
 *   GET  /api/system-logs           - List all logs (with filters)
 *   GET  /api/system-logs/recent    - Get recent logs (with limit)
 *   GET  /api/system-logs/errors    - Get error-level logs
 *   GET  /api/system-logs/:id       - Get log by ID
 *   GET  /api/system-logs/level/:level - Filter by log level
 *   GET  /api/system-logs/user/:userId - Filter by user
 *   GET  /api/system-logs/category/:category - Filter by category
 *   DELETE /api/system-logs/clear-old - Delete logs older than N days
 * 
 * Design Principles:
 *   - Farm Manager only (all endpoints)
 *   - Read-heavy (7 GET endpoints, 1 DELETE)
 *   - Multiple filter dimensions: level, user, category, date range
 *   - Log cleanup to prevent unbounded growth
 * 
 * FR-023 Requirements Covered:
 *   6. Implement data archiving for historical records
 * 
 * Log Levels:
 *   - info: Informational messages
 *   - warn: Warning messages
 *   - error: Error messages
 *   - debug: Debug messages
 * 
 * Log Categories:
 *   - auth: Authentication events
 *   - production: Production operations
 *   - harvest: Harvest operations
 *   - inventory: Inventory operations
 *   - order: Order operations
 *   - payment: Payment operations
 *   - system: System events
 *   - crm: CRM operations
 */

const express = require('express');
const router = express.Router();
const systemLogService = require('../services/SystemLogService');
const { protect, authorize } = require('../middleware/auth');

/**
 * GET /api/system-logs
 * List all system logs with optional filtering.
 * 
 * SRS: FR-023.6 - View system logs
 * Access: Farm Manager only
 * 
 * Query params:
 *   - level: Filter by log level (info, warn, error, debug)
 *   - category: Filter by category (auth, production, etc.)
 *   - userId: Filter by user ID
 *   - startDate: Start of date range (ISO 8601)
 *   - endDate: End of date range (ISO 8601)
 * 
 * @returns {Array} Matching log records
 */
router.get('/', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const logs = await systemLogService.getAll(req.query);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/system-logs/recent
 * Get the most recent system logs.
 * 
 * SRS: FR-023.6 - View recent system activity
 * Access: Farm Manager only
 * 
 * Query params:
 *   - limit: Number of logs to return (default: 100, max: 1000)
 * 
 * @returns {Array} Most recent log records
 */
router.get('/recent', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logs = await systemLogService.getRecent(limit);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/system-logs/errors
 * Get error-level system logs.
 * 
 * SRS: FR-023.6 - View system errors
 * Access: Farm Manager only
 * 
 * Query params:
 *   - limit: Number of errors to return (default: 50)
 * 
 * @returns {Array} Error log records
 */
router.get('/errors', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = await systemLogService.getErrors(limit);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/system-logs/:id
 * Get a specific system log by ID.
 * 
 * Access: Farm Manager only
 * 
 * @param {string} id - Log record ID
 * @returns {Object} Log record
 */
router.get('/:id', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const log = await systemLogService.getById(req.params.id);
    if (!log) return res.status(404).json({ success: false, message: 'Log not found' });
    res.json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/system-logs/level/:level
 * Filter system logs by log level.
 * 
 * Access: Farm Manager only
 * 
 * @param {string} level - Log level (info, warn, error, debug)
 * @returns {Array} Matching log records
 */
router.get('/level/:level', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const logs = await systemLogService.getByLevel(req.params.level);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/system-logs/user/:userId
 * Filter system logs by user ID.
 * 
 * Access: Farm Manager only
 * 
 * @param {string} userId - User ID to filter by
 * @returns {Array} Log records for the specified user
 */
router.get('/user/:userId', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const logs = await systemLogService.getByUser(req.params.userId);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/system-logs/category/:category
 * Filter system logs by category.
 * 
 * Access: Farm Manager only
 * 
 * @param {string} category - Category (auth, production, harvest, inventory, order, payment, system, crm)
 * @returns {Array} Matching log records
 */
router.get('/category/:category', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const logs = await systemLogService.getByCategory(req.params.category);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/system-logs/clear-old
 * Delete system logs older than a specified number of days.
 * 
 * SRS: FR-023.6 - Implement data archiving for historical records
 * Access: Farm Manager only
 * 
 * Process:
 *   1. Calculate cutoff date (now - days)
 *   2. Find all logs with timestamp < cutoff
 *   3. Delete each matching log
 *   4. Return count of deleted logs
 * 
 * Security: days parameter clamped to 1-365 range.
 * 
 * @param {number} [days=90] - Number of days to keep
 * @returns {Object} Count of deleted logs
 */
router.delete('/clear-old', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const days = Math.max(1, Math.min(365, parseInt(req.body.days) || 90));
    const deleted = await systemLogService.clearOldLogs(days);
    res.json({ success: true, message: `${deleted} old logs cleared` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;