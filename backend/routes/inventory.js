/**
 * Inventory Management Routes
 * ===========================
 * 
 * SRS Reference: FR-008 (Inventory Management), FR-009 (Inventory Tracking & Reporting)
 * 
 * This file defines all REST API endpoints for managing poultry product inventory,
 * including stock adjustments, inter-location transfers, picking lists for orders,
 * and inventory reports.
 * 
 * Endpoints Summary:
 *   POST   /api/inventory              - Create a new inventory batch (Farm Manager, Processing Staff)
 *   GET    /api/inventory              - List all inventory items with filters (any authenticated user)
 *   GET    /api/inventory/low-stock    - Get items below stock threshold (any authenticated user)
 *   PUT    /api/inventory/:id/adjust   - Adjust stock quantity with reason (Farm Manager, Processing Staff)
 *   PUT    /api/inventory/:id/transfer - Transfer stock between locations (Farm Manager, Processing Staff)
 *   GET    /api/inventory/transfers    - List all transfer records (any authenticated user)
 *   GET    /api/inventory/picking-list/:orderId - Generate picking list for an order (Farm Manager, Processing Staff, Sales Assistant)
 *   GET    /api/inventory/report       - Get inventory analytics report (Farm Manager, Sales Assistant)
 * 
 * Authentication: All endpoints require JWT via protect middleware.
 * Authorization: Role-based via authorize() middleware.
 * 
 * Inventory Lifecycle:
 *   1. Created via harvest batch completion OR manual creation
 *   2. Status transitions: available -> reserved/sold/expired/damaged/transferred
 *   3. Quantity adjustments tracked with reason audit trail
 *   4. Transfers create new batch at destination, reduce source batch
 *   5. Expiry monitoring with near-expiry (7-day) and expired flags
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const inventoryService = require('../services/InventoryService');
const { protect, authorize } = require('../middleware/auth');
const { PRODUCT_TYPES } = require('../config/constants');

/**
 * POST /api/inventory
 * Create a new inventory batch manually.
 * 
 * SRS: FR-008 - Manual inventory creation
 * Validates: cycle (required), productType (in PRODUCT_TYPES), quantity (>= 0),
 *            harvestDate (ISO 8601), expiryDate (ISO 8601), storageLocation (required)
 * Auto-generates: batchNumber (format: BATCH-{timestamp}-{random})
 * Authorization: Farm Manager, Processing Staff
 * 
 * @param {string} cycle - Production cycle ID
 * @param {string} productType - One of PRODUCT_TYPES from constants.js
 * @param {number} quantity - Quantity in units
 * @param {string} harvestDate - ISO 8601 harvest date
 * @param {string} expiryDate - ISO 8601 expiry date
 * @param {string} storageLocation - Storage location name
 * @returns {Object} Created inventory batch with batchNumber
 */
router.post('/', protect, authorize('Farm Manager', 'Processing Staff'), [
  body('cycle').notEmpty(),
  body('productType').isIn(PRODUCT_TYPES),
  body('quantity').isFloat({ min: 0 }),
  body('harvestDate').isISO8601(),
  body('expiryDate').isISO8601(),
  body('storageLocation').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const batch = await inventoryService.create(req.body, req.user);
    res.status(201).json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

/**
 * GET /api/inventory
 * Retrieve all inventory items with optional filtering.
 * 
 * SRS: FR-008 - View inventory, FR-009 - Inventory listing
 * Query params: status (available|reserved|sold|expired|damaged|transferred),
 *               productType (one of PRODUCT_TYPES), location (storage location name)
 * Authorization: Any authenticated user
 * 
 * @returns {Array} List of inventory batch objects, sorted by harvestDate descending
 */
router.get('/', protect, async (req, res) => {
  try {
    const inventory = await inventoryService.getAll(req.query);
    res.json({ success: true, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * GET /api/inventory/low-stock
 * Get inventory items that are below the configured low stock threshold.
 * 
 * SRS: FR-009 - Low stock alerts, reorder point monitoring
 * Threshold: Read from systemConfig collection (key: 'lowStockThreshold'), defaults to 10
 * Only includes items with status = 'available'
 * Authorization: Any authenticated user
 * 
 * @returns {Array} Inventory items where quantity < threshold
 */
router.get('/low-stock', protect, async (req, res) => {
  try {
    const lowStock = await inventoryService.getLowStock();
    res.json({ success: true, data: lowStock });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * PUT /api/inventory/:id/adjust
 * Adjust inventory quantity for a batch (positive or negative adjustment).
 * 
 * SRS: FR-008 - Stock adjustment (waste, damage, corrections)
 * Validates: adjustment (numeric - can be negative), reason (required for audit trail)
 * Minimum quantity after adjustment is 0 (Math.max(0, newQty))
 * Authorization: Farm Manager, Processing Staff
 * 
 * @param {string} id - Inventory batch ID
 * @param {number} adjustment - Amount to add (positive) or subtract (negative)
 * @param {string} reason - Reason for adjustment (audit trail)
 * @returns {Object} Updated inventory batch
 */
router.put('/:id/adjust', protect, authorize('Farm Manager', 'Processing Staff'), [
  body('adjustment').isNumeric(),
  body('reason').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const batch = await inventoryService.adjust(req.params.id, req.body.adjustment, req.body.reason);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

/**
 * PUT /api/inventory/:id/transfer
 * Transfer inventory from one storage location to another.
 * 
 * SRS: FR-008 - Inter-location transfer, FR-009 - Transfer tracking
 * Creates a new inventory batch at the destination location and reduces the source.
 * If source quantity becomes 0, its status changes to 'transferred'.
 * Validates: toLocation (required), quantity (> 0), reason (required)
 * Authorization: Farm Manager, Processing Staff
 * 
 * @param {string} id - Source inventory batch ID
 * @param {Object} body - { toLocation: string, quantity: number, reason: string }
 * @returns {Object} { from: updated source batch, to: new destination batch }
 * @throws {Error} If batch not found or transfer quantity exceeds available stock
 */
router.put('/:id/transfer', protect, authorize('Farm Manager', 'Processing Staff'), [
  body('toLocation').notEmpty().withMessage('Destination location is required'),
  body('quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
  body('reason').notEmpty().withMessage('Reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const result = await inventoryService.transfer(req.params.id, req.body.toLocation, parseFloat(req.body.quantity), req.body.reason, req.user);
    res.json({ success: true, data: result });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 :
                       error.message.includes('exceeds') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message || 'Server error' });
  }
});

/**
 * GET /api/inventory/transfers
 * Get all inventory transfer records.
 * 
 * SRS: FR-009 - Transfer history/audit
 * Returns items that have a transferredFrom field (i.e., were created via transfer)
 * Authorization: Any authenticated user
 * 
 * @returns {Array} List of transferred inventory batches
 */
router.get('/transfers', protect, async (req, res) => {
  try {
    const transfers = await inventoryService.getTransfers();
    res.json({ success: true, data: transfers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * GET /api/inventory/picking-list/:orderId
 * Generate a picking list for a specific order, allocating inventory batches
 * using FIFO (First In, First Out) by expiry date.
 * 
 * SRS: FR-008 - Order fulfillment picking, FR-009 - Batch allocation
 * Process:
 *   1. Fetch the order by ID
 *   2. For each order item, find available inventory of matching productType
 *   3. Sort by expiry date (earliest first = FIFO)
 *   4. Allocate quantities until order requirement is met
 *   5. Flag any shortfalls
 * Authorization: Farm Manager, Processing Staff, Sales Assistant
 * 
 * @param {string} orderId - Order ID to generate picking list for
 * @returns {Object} Picking list with items, allocations, fulfillment status
 * @throws {Error} If order not found
 */
router.get('/picking-list/:orderId', protect, authorize('Farm Manager', 'Processing Staff', 'Sales Assistant'), async (req, res) => {
  try {
    const pickingList = await inventoryService.getPickingList(req.params.orderId);
    res.json({ success: true, data: pickingList });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ success: false, message: error.message || 'Server error' });
  }
});

/**
 * GET /api/inventory/report
 * Generate a comprehensive inventory report with analytics.
 * 
 * SRS: FR-009 - Inventory reporting, stock valuation, expiry monitoring
 * Report includes:
 *   - totalItems: count of all inventory records
 *   - totalValue: sum of (quantity * pricePerUnit) for all items
 *   - totalQuantity: sum of all quantities
 *   - byStatus: quantity breakdown by status
 *   - byProductType: quantity breakdown by product type
 *   - byLocation: quantity breakdown by storage location
 *   - nearExpiry: items expiring within 7 days (still available)
 *   - expired: items past expiry date (still available)
 *   - turnoverRate: (sold / total) * 100 percentage
 *   - summary: count of items in each status category
 * Authorization: Farm Manager, Sales Assistant
 * 
 * @returns {Object} Full inventory report
 */
router.get('/report', protect, authorize('Farm Manager', 'Sales Assistant'), async (req, res) => {
  try {
    const report = await inventoryService.getReport();
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;