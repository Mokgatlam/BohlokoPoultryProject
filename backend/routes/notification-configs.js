/**
 * Notification Configuration Routes
 * ===================================
 * 
 * SRS Reference: FR-022 (System Configuration)
 * 
 * REST API endpoints for managing notification templates, channels, recipients,
 * schedules, and rate limits. Controls how and when notifications are sent.
 * 
 * Endpoints Summary (6 endpoints):
 * 
 *   GET  /api/notification-configs          - List all notification configs
 *   GET  /api/notification-configs/:id      - Get config by ID
 *   POST /api/notification-configs          - Create notification config
 *   PUT  /api/notification-configs/:id      - Update notification config
 *   PUT  /api/notification-configs/:id/toggle - Toggle enabled/disabled
 *   DELETE /api/notification-configs/:id    - Delete notification config
 * 
 * Design Principles:
 *   - Farm Manager only (all endpoints)
 *   - CRUD operations for notification rules
 *   - Toggle endpoint for quick enable/disable
 *   - Multi-channel support: email, SMS, push, in-app
 *   - Rate limiting per config
 * 
 * FR-022 Requirements Covered:
 *   4. Configure notification templates
 * 
 * Notification Types:
 *   - order_confirmation: Sent when order is placed
 *   - payment_received: Sent when payment is processed
 *   - shipment_update: Sent when order status changes
 *   - low_stock_alert: Sent when inventory is low
 *   - harvest_complete: Sent when harvest is recorded
 *   - quality_alert: Sent when quality check fails
 *   - promotional: Marketing/promotional messages
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const validate = require('../middleware/validate');
const notificationConfigService = require('../services/NotificationConfigService');
const { protect, authorize } = require('../middleware/auth');

/**
 * GET /api/notification-configs
 * List all notification configurations with optional filtering.
 * 
 * SRS: FR-022 - View notification configuration
 * Access: Farm Manager only
 * 
 * Query params:
 *   - type: Filter by notification type
 *   - enabled: Filter by enabled status (true/false)
 * 
 * @returns {Array} Notification configuration records
 */
router.get('/', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const configs = await notificationConfigService.getAll(req.query);
    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/notification-configs/:id
 * Get a specific notification configuration by ID.
 * 
 * SRS: FR-022 - View notification template details
 * Access: Farm Manager only
 * 
 * @param {string} id - Configuration ID
 * @returns {Object} Notification configuration record
 */
router.get('/:id', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const config = await notificationConfigService.getById(req.params.id);
    if (!config) return res.status(404).json({ success: false, message: 'Config not found' });
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/notification-configs
 * Create a new notification configuration.
 * 
 * SRS: FR-022 - Configure notification templates
 * Access: Farm Manager only
 * 
 * Validates:
 *   - type: Required (notification type identifier)
 *   - name: Required (human-readable name)
 * 
 * Default values applied for:
 *   - enabled: true
 *   - channels: { email: true, sms: false, push: true, inApp: true }
 *   - recipients: { roles: [], users: [] }
 *   - rateLimit: { maxPerHour: 10, maxPerDay: 50 }
 *   - priority: 'normal'
 * 
 * @param {string} type - Notification type (e.g., 'order_confirmation')
 * @param {string} name - Human-readable name
 * @param {string} [description] - Description
 * @param {Object} [channels] - Channel configuration
 * @param {Object} [recipients] - Recipient configuration
 * @param {string} [template] - Message template
 * @param {string} [subject] - Email subject line
 * @param {Object} [schedule] - Schedule configuration
 * @param {Object} [conditions] - Trigger conditions
 * @param {Object} [rateLimit] - Rate limiting config
 * @param {string} [priority] - Priority level (low, normal, high, urgent)
 * @returns {Object} Created configuration
 */
router.post('/', protect, authorize('Farm Manager'), [
  body('type').notEmpty().withMessage('Type is required'),
  body('name').notEmpty().withMessage('Name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const config = await notificationConfigService.create(req.body, req.user._id);
    res.status(201).json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/notification-configs/:id
 * Update an existing notification configuration.
 * 
 * SRS: FR-022 - Update notification templates
 * Access: Farm Manager only
 * 
 * Validates:
 *   - name: Optional, cannot be empty
 *   - type: Optional, cannot be empty
 *   - active: Optional, must be boolean
 *   - thresholds: Optional, must be object
 * 
 * @param {string} id - Configuration ID
 * @param {Object} data - Fields to update
 * @returns {Object} Updated configuration
 */
router.put('/:id', protect, authorize('Farm Manager'), [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('type').optional().trim().notEmpty().withMessage('Type cannot be empty'),
  body('active').optional().isBoolean().withMessage('Active must be a boolean'),
  body('thresholds').optional().isObject().withMessage('Thresholds must be an object')
], validate, async (req, res) => {
  try {
    const config = await notificationConfigService.update(req.params.id, req.body);
    if (!config) return res.status(404).json({ success: false, message: 'Config not found' });
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/notification-configs/:id/toggle
 * Toggle a notification configuration between enabled and disabled.
 * 
 * SRS: FR-022 - Enable/disable notification templates
 * Access: Farm Manager only
 * 
 * @param {string} id - Configuration ID
 * @returns {Object} Configuration with toggled enabled status
 */
router.put('/:id/toggle', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const config = await notificationConfigService.toggle(req.params.id);
    if (!config) return res.status(404).json({ success: false, message: 'Config not found' });
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/notification-configs/:id
 * Delete a notification configuration.
 * 
 * SRS: FR-022 - Remove notification templates
 * Access: Farm Manager only
 * 
 * @param {string} id - Configuration ID
 * @returns {Object} Success message
 */
router.delete('/:id', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    await notificationConfigService.delete(req.params.id);
    res.json({ success: true, message: 'Config deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;