/**
 * Harvest & Processing Routes
 * ===========================
 * 
 * SRS Reference: FR-007 (Harvesting & Processing), FR-008 (Inventory Management), FR-009 (Inventory Tracking)
 * 
 * This file defines all REST API endpoints related to poultry harvesting, processing,
 * yield tracking, quality checks, and staff assignments. It serves as the central
 * API for the farm's harvest-to-inventory workflow.
 * 
 * Endpoints Summary:
 *   Harvest Batches:
 *     POST   /api/harvest/harvest-batches          - Create a new harvest batch (Farm Manager, Poultry Attendant)
 *     GET    /api/harvest/harvest-batches          - List all harvest batches (any authenticated user)
 *     GET    /api/harvest/harvest-batches/:id      - Get harvest batch by ID (any authenticated user)
 *     PUT    /api/harvest/harvest-batches/:id      - Update harvest batch details (Farm Manager only)
 *     PUT    /api/harvest/harvest-batches/:id/start  - Start harvest batch (Farm Manager, Poultry Attendant)
 *     PUT    /api/harvest/harvest-batches/:id/complete - Complete harvest batch with actuals (Farm Manager only)
 * 
 *   Processing Batches:
 *     POST   /api/harvest/processing-batches       - Create processing batch (Farm Manager, Processing Staff)
 *     GET    /api/harvest/processing-batches       - List processing batches (any authenticated user)
 *     GET    /api/harvest/processing-batches/:id   - Get processing batch by ID
 *     PUT    /api/harvest/processing-batches/:id   - Update processing batch (Farm Manager, Processing Staff)
 *     PUT    /api/harvest/processing-batches/:id/start   - Start processing (Farm Manager, Processing Staff)
 *     PUT    /api/harvest/processing-batches/:id/complete - Complete processing, optionally create inventory (Farm Manager, Processing Staff)
 * 
 *   Processing Steps:
 *     POST   /api/harvest/processing-steps         - Log a processing step (Farm Manager, Processing Staff)
 *     GET    /api/harvest/processing-steps/:batchId - Get steps for a processing batch
 *     PUT    /api/harvest/processing-steps/:id/complete - Complete a processing step
 * 
 *   Quality & Yield:
 *     POST   /api/harvest/yield-records            - Record yield data (Farm Manager, Processing Staff)
 *     GET    /api/harvest/yield-records            - List yield records (any authenticated user)
 *     POST   /api/harvest/quality-checks           - Record a quality check (Farm Manager, Processing Staff)
 *     GET    /api/harvest/quality-checks/:batchId  - Get quality checks for a processing batch
 * 
 *   Staff Assignments:
 *     POST   /api/harvest/staff-assignments        - Assign staff to a processing batch (Farm Manager only)
 *     GET    /api/harvest/staff-assignments/:batchId - Get staff assignments for a processing batch
 * 
 *   Dashboard:
 *     GET    /api/harvest/harvest-dashboard         - Get harvest/processing summary stats
 * 
 * Authentication: All endpoints require JWT via protect middleware.
 * Authorization: Role-based via authorize() middleware.
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const validate = require('../middleware/validate');
const harvestService = require('../services/HarvestService');
const { protect, authorize } = require('../middleware/auth');
const { PRODUCT_TYPES } = require('../config/constants');

// ---------------------------------------------------------------------------
// HARVEST BATCHES
// ---------------------------------------------------------------------------

/**
 * POST /api/harvest/harvest-batches
 * Create a new harvest batch for a production cycle.
 * 
 * SRS: FR-007 - Harvesting & Processing
 * Validates: cycle (required), harvestDate (ISO 8601), birdCount (>= 1)
 * Authorization: Farm Manager, Poultry Attendant
 * 
 * @param {string} cycle - Production cycle ID
 * @param {string} harvestDate - ISO 8601 date of planned harvest
 * @param {number} birdCount - Number of birds to harvest
 * @returns {Object} Created harvest batch with generated _id
 */
router.post('/harvest-batches', protect, authorize('Farm Manager', 'Poultry Attendant'), [
  body('cycle').notEmpty(),
  body('harvestDate').isISO8601(),
  body('birdCount').isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const batch = await harvestService.createHarvestBatch(req.body, req.user._id);
    res.status(201).json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/harvest/harvest-batches
 * Retrieve all harvest batches, optionally filtered by status or cycle.
 * 
 * SRS: FR-007 - View harvest batches
 * Query params: status (Scheduled|In Progress|Completed|Cancelled), cycle (ID)
 * Authorization: Any authenticated user
 * 
 * @returns {Array} List of harvest batch objects
 */
router.get('/harvest-batches', protect, async (req, res) => {
  try {
    const batches = await harvestService.getHarvestBatches(req.query);
    res.json({ success: true, data: batches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/harvest/harvest-batches/:id
 * Get a single harvest batch by its ID.
 * 
 * SRS: FR-007 - View harvest batch details
 * Authorization: Any authenticated user
 * @param {string} id - Harvest batch ID
 * @returns {Object} Harvest batch data or 404
 */
router.get('/harvest-batches/:id', protect, async (req, res) => {
  try {
    const batch = await harvestService.getHarvestBatchById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Harvest batch not found' });
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/harvest/harvest-batches/:id
 * Update harvest batch details (date, count, status).
 * 
 * SRS: FR-007 - Edit harvest batch
 * Validates: harvestDate (optional ISO), birdCount (optional >= 0), status (optional enum)
 * Authorization: Farm Manager only
 * 
 * @param {string} id - Harvest batch ID
 * @param {Object} body - Fields to update (harvestDate, birdCount, status)
 * @returns {Object} Updated harvest batch or 404
 */
router.put('/harvest-batches/:id', protect, authorize('Farm Manager'), [
  body('harvestDate').optional().isISO8601().withMessage('Harvest date must be a valid date'),
  body('birdCount').optional().isInt({ min: 0 }).withMessage('Bird count must be a non-negative integer'),
  body('status').optional().isIn(['Scheduled', 'In Progress', 'Completed', 'Cancelled']).withMessage('Invalid status')
], validate, async (req, res) => {
  try {
    const batch = await harvestService.updateHarvestBatch(req.params.id, req.body);
    if (!batch) return res.status(404).json({ success: false, message: 'Harvest batch not found' });
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/harvest/harvest-batches/:id/start
 * Mark a harvest batch as In Progress with start timestamp.
 * 
 * SRS: FR-007 - Start harvesting operation
 * Sets status to 'In Progress', records startedAt and startedBy
 * Authorization: Farm Manager, Poultry Attendant
 * 
 * @param {string} id - Harvest batch ID
 * @returns {Object} Updated harvest batch with In Progress status
 */
router.put('/harvest-batches/:id/start', protect, authorize('Farm Manager', 'Poultry Attendant'), async (req, res) => {
  try {
    const batch = await harvestService.startHarvestBatch(req.params.id, req.user._id);
    if (!batch) return res.status(404).json({ success: false, message: 'Harvest batch not found' });
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/harvest/harvest-batches/:id/complete
 * Complete a harvest batch with actual results (actual weight, count, notes).
 * 
 * SRS: FR-007 - Complete harvest, record actuals vs planned
 * Sets status to 'Completed', records completedAt, completedBy, actualWeight, actualCount
 * Authorization: Farm Manager only (quality control gate)
 * 
 * @param {string} id - Harvest batch ID
 * @param {Object} body - { actualWeight, actualCount, notes }
 * @returns {Object} Completed harvest batch
 */
router.put('/harvest-batches/:id/complete', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const batch = await harvestService.completeHarvestBatch(req.params.id, req.body, req.user._id);
    if (!batch) return res.status(404).json({ success: false, message: 'Harvest batch not found' });
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ---------------------------------------------------------------------------
// PROCESSING BATCHES
// ---------------------------------------------------------------------------

/**
 * POST /api/harvest/processing-batches
 * Create a new processing batch linked to a harvest batch.
 * 
 * SRS: FR-007 - Processing workflow
 * Validates: harvestBatch (required), productType (required), processingDate (ISO 8601)
 * Authorization: Farm Manager, Processing Staff
 * 
 * @param {string} harvestBatch - Parent harvest batch ID
 * @param {string} productType - Product type (e.g., 'Whole Chicken', 'Breast')
 * @param {string} processingDate - ISO 8601 processing date
 * @returns {Object} Created processing batch
 */
router.post('/processing-batches', protect, authorize('Farm Manager', 'Processing Staff'), [
  body('harvestBatch').notEmpty(),
  body('productType').notEmpty(),
  body('processingDate').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const batch = await harvestService.createProcessingBatch(req.body, req.user._id);
    res.status(201).json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/harvest/processing-batches
 * List all processing batches with optional filtering.
 * 
 * SRS: FR-007 - View processing batches
 * Query params: status (Scheduled|In Progress|Processing|Completed|Cancelled), harvestBatch (ID)
 * Authorization: Any authenticated user
 * 
 * @returns {Array} List of processing batch objects
 */
router.get('/processing-batches', protect, async (req, res) => {
  try {
    const batches = await harvestService.getProcessingBatchs(req.query);
    res.json({ success: true, data: batches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/harvest/processing-batches/:id
 * Get a single processing batch by ID.
 * 
 * SRS: FR-007 - View processing batch details
 * Authorization: Any authenticated user
 * 
 * @param {string} id - Processing batch ID
 * @returns {Object} Processing batch data or 404
 */
router.get('/processing-batches/:id', protect, async (req, res) => {
  try {
    const batch = await harvestService.getProcessingBatchById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Processing batch not found' });
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/harvest/processing-batches/:id
 * Update processing batch details.
 * 
 * SRS: FR-007 - Edit processing batch
 * Validates: productType (optional), processingDate (optional ISO), status (optional enum)
 * Authorization: Farm Manager, Processing Staff
 * 
 * @param {string} id - Processing batch ID
 * @param {Object} body - Fields to update
 * @returns {Object} Updated processing batch or 404
 */
router.put('/processing-batches/:id', protect, authorize('Farm Manager', 'Processing Staff'), [
  body('productType').optional().trim().notEmpty().withMessage('Product type cannot be empty'),
  body('processingDate').optional().isISO8601().withMessage('Processing date must be a valid date'),
  body('status').optional().isIn(['Scheduled', 'In Progress', 'Completed', 'Cancelled']).withMessage('Invalid status')
], validate, async (req, res) => {
  try {
    const batch = await harvestService.updateProcessingBatch(req.params.id, req.body);
    if (!batch) return res.status(404).json({ success: false, message: 'Processing batch not found' });
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/harvest/processing-batches/:id/start
 * Start processing on a batch, setting status to 'Processing'.
 * 
 * SRS: FR-007 - Begin processing operation
 * Sets status to 'Processing', records startedAt and startedBy
 * Authorization: Farm Manager, Processing Staff
 * 
 * @param {string} id - Processing batch ID
 * @returns {Object} Updated processing batch
 */
router.put('/processing-batches/:id/start', protect, authorize('Farm Manager', 'Processing Staff'), async (req, res) => {
  try {
    const batch = await harvestService.startProcessingBatch(req.params.id, req.user._id);
    if (!batch) return res.status(404).json({ success: false, message: 'Processing batch not found' });
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/harvest/processing-batches/:id/complete
 * Complete a processing batch and optionally create an inventory item.
 * 
 * SRS: FR-007 - Complete processing, FR-008 - Auto-create inventory from processed output
 * When data.createInventory is true AND outputQuantity > 0, the service creates
 * an inventory record with a 5-day expiry, linking it back to this processing batch.
 * 
 * @param {string} id - Processing batch ID
 * @param {Object} body - { outputQuantity, outputWeight, wasteWeight, notes, createInventory, storageLocation, pricePerUnit }
 * @returns {Object} Completed processing batch (with inventoryItem link if created)
 */
router.put('/processing-batches/:id/complete', protect, authorize('Farm Manager', 'Processing Staff'), async (req, res) => {
  try {
    const batch = await harvestService.completeProcessingBatch(req.params.id, req.body, req.user._id);
    if (!batch) return res.status(404).json({ success: false, message: 'Processing batch not found' });
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ---------------------------------------------------------------------------
// PROCESSING STEPS
// ---------------------------------------------------------------------------

/**
 * POST /api/harvest/processing-steps
 * Log an individual processing step (e.g., Slaughter, Pluck, Cut, Package).
 * 
 * SRS: FR-007 - Processing step tracking, audit trail
 * Validates: processingBatch (required), stepType (enum of 9 types), startTime (ISO 8601)
 * Step types: Slaughter, Pluck, Eviscerate, Cut, Portion, Package, Label, Freeze, Store
 * Authorization: Farm Manager, Processing Staff
 * 
 * @param {string} processingBatch - Parent processing batch ID
 * @param {string} stepType - Type of processing step
 * @param {string} startTime - ISO 8601 timestamp when step began
 * @returns {Object} Created processing step
 */
router.post('/processing-steps', protect, authorize('Farm Manager', 'Processing Staff'), [
  body('processingBatch').notEmpty(),
  body('stepType').isIn(['Slaughter', 'Pluck', 'Eviscerate', 'Cut', 'Portion', 'Package', 'Label', 'Freeze', 'Store']),
  body('startTime').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const step = await harvestService.createProcessingStep(req.body, req.user._id);
    res.status(201).json({ success: true, data: step });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/harvest/processing-steps/:batchId
 * Get all processing steps for a specific processing batch.
 * 
 * SRS: FR-007 - View processing step history/audit trail
 * Authorization: Any authenticated user
 * 
 * @param {string} batchId - Processing batch ID
 * @returns {Array} List of processing step objects
 */
router.get('/processing-steps/:batchId', protect, async (req, res) => {
  try {
    const steps = await harvestService.getProcessingSteps(req.params.batchId);
    res.json({ success: true, data: steps });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/harvest/processing-steps/:id/complete
 * Mark a processing step as complete with output metrics.
 * 
 * SRS: FR-007 - Complete processing step
 * Records: endTime, completedBy, outputQuantity, wasteQuantity, notes
 * Authorization: Farm Manager, Processing Staff
 * 
 * @param {string} id - Processing step ID
 * @param {Object} body - { outputQuantity, wasteQuantity, notes }
 * @returns {Object} Completed processing step or 404
 */
router.put('/processing-steps/:id/complete', protect, authorize('Farm Manager', 'Processing Staff'), async (req, res) => {
  try {
    const step = await harvestService.completeProcessingStep(req.params.id, req.body, req.user._id);
    if (!step) return res.status(404).json({ success: false, message: 'Step not found' });
    res.json({ success: true, data: step });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ---------------------------------------------------------------------------
// YIELD RECORDS
// ---------------------------------------------------------------------------

/**
 * POST /api/harvest/yield-records
 * Record yield data for a processing batch (input vs output weight).
 * 
 * SRS: FR-007 - Yield tracking, efficiency monitoring
 * Validates: processingBatch (required), productType (required), inputWeight (>= 0), outputWeight (>= 0)
 * The service auto-calculates yieldPercentage = (outputWeight / inputWeight) * 100
 * Authorization: Farm Manager, Processing Staff
 * 
 * @param {string} processingBatch - Processing batch ID
 * @param {string} productType - Product type being measured
 * @param {number} inputWeight - Total input weight in kg
 * @param {number} outputWeight - Total output weight in kg
 * @returns {Object} Created yield record with calculated yieldPercentage
 */
router.post('/yield-records', protect, authorize('Farm Manager', 'Processing Staff'), [
  body('processingBatch').notEmpty(),
  body('productType').notEmpty(),
  body('inputWeight').isFloat({ min: 0 }),
  body('outputWeight').isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const record = await harvestService.createYieldRecord(req.body, req.user._id);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/harvest/yield-records
 * Get yield records, optionally filtered by processing batch.
 * 
 * SRS: FR-007 - View yield performance
 * Query params: processingBatch (ID)
 * Authorization: Any authenticated user
 * 
 * @returns {Array} List of yield records
 */
router.get('/yield-records', protect, async (req, res) => {
  try {
    const records = await harvestService.getYieldRecords(req.query);
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ---------------------------------------------------------------------------
// QUALITY CHECKS
// ---------------------------------------------------------------------------

/**
 * POST /api/harvest/quality-checks
 * Record a quality check result for a processing batch.
 * 
 * SRS: FR-007 - Quality assurance, compliance checks
 * Validates: processingBatch (required), checkType (required), result (Pass|Fail|Conditional)
 * Authorization: Farm Manager, Processing Staff
 * 
 * @param {string} processingBatch - Processing batch ID
 * @param {string} checkType - Type of quality check (e.g., 'Temperature', 'Visual', 'Microbiological')
 * @param {string} result - Pass, Fail, or Conditional
 * @returns {Object} Created quality check record
 */
router.post('/quality-checks', protect, authorize('Farm Manager', 'Processing Staff'), [
  body('processingBatch').notEmpty(),
  body('checkType').notEmpty(),
  body('result').isIn(['Pass', 'Fail', 'Conditional'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const check = await harvestService.createQualityCheck(req.body, req.user._id);
    res.status(201).json({ success: true, data: check });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/harvest/quality-checks/:batchId
 * Get all quality checks for a specific processing batch.
 * 
 * SRS: FR-007 - View quality check history
 * Authorization: Any authenticated user
 * 
 * @param {string} batchId - Processing batch ID
 * @returns {Array} List of quality check records
 */
router.get('/quality-checks/:batchId', protect, async (req, res) => {
  try {
    const checks = await harvestService.getQualityChecks(req.params.batchId);
    res.json({ success: true, data: checks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ---------------------------------------------------------------------------
// STAFF ASSIGNMENTS
// ---------------------------------------------------------------------------

/**
 * POST /api/harvest/staff-assignments
 * Assign a staff member to a processing batch with a specific role.
 * 
 * SRS: FR-007 - Staff allocation for processing
 * Validates: staff (required), processingBatch (required), role (required)
 * Authorization: Farm Manager only (management function)
 * 
 * @param {string} staff - User ID of staff member
 * @param {string} processingBatch - Processing batch ID
 * @param {string} role - Role assignment (e.g., 'Slaughter Operator', 'Quality Inspector')
 * @returns {Object} Created staff assignment
 */
router.post('/staff-assignments', protect, authorize('Farm Manager'), [
  body('staff').notEmpty(),
  body('processingBatch').notEmpty(),
  body('role').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const assignment = await harvestService.createStaffAssignment(req.body, req.user._id);
    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/harvest/staff-assignments/:batchId
 * Get all staff assignments for a specific processing batch.
 * 
 * SRS: FR-007 - View staff assignments
 * Authorization: Any authenticated user
 * 
 * @param {string} batchId - Processing batch ID
 * @returns {Array} List of staff assignment records
 */
router.get('/staff-assignments/:batchId', protect, async (req, res) => {
  try {
    const assignments = await harvestService.getStaffAssignments(req.params.batchId);
    res.json({ success: true, data: assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ---------------------------------------------------------------------------
// DASHBOARD
// ---------------------------------------------------------------------------

/**
 * GET /api/harvest/harvest-dashboard
 * Get aggregated harvest and processing statistics for the dashboard.
 * 
 * SRS: FR-007 - Harvest/processing analytics dashboard
 * Returns: totalHarvests, todayHarvests, totalBirdsHarvested, totalProcessing,
 *          inProgressProcessing, totalWeightProcessed, avgYield,
 *          recentHarvests (last 5), recentProcessing (last 5)
 * Authorization: Any authenticated user
 * 
 * @returns {Object} Dashboard statistics object
 */
router.get('/harvest-dashboard', protect, async (req, res) => {
  try {
    const dashboard = await harvestService.getHarvestDashboard();
    res.json({ success: true, data: dashboard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;