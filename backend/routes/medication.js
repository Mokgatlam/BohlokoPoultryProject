/**
 * Medication Routes - FR-006
 * ============================
 * 
 * Dedicated API endpoints for medication management and tracking.
 * This is a separate route module from the production-embedded medication routes.
 * 
 * Architecture: Express Router with protect + authorize middleware
 * 
 * FR-006 Requirements:
 *   - FR-006.1: Record medication name, dosage, date, administered by
 *   - FR-006.3: Generate medication reports for regulatory compliance
 *   - FR-006.5: Track medication inventory and usage (active, expiring)
 * 
 * Endpoints:
 *   GET    /                     - List all medications (with filters)
 *   GET    /active               - List active medications only
 *   GET    /expiring             - List medications expiring within N days
 *   GET    /cycle/:cycleId       - List medications for a specific cycle
 *   GET    /:id                  - Get single medication by ID
 *   POST   /                     - Create new medication record
 *   PUT    /:id                  - Update medication record
 *   PUT    /:id/complete         - Mark medication as completed
 *   PUT    /:id/cancel           - Cancel medication with reason
 * 
 * Security:
 *   - Read operations: Any authenticated user
 *   - Create/Update: Farm Manager or Poultry Attendant
 *   - Cancel: Farm Manager only (requires reason for audit)
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const validate = require('../middleware/validate');
const medicationService = require('../services/MedicationService');
const { protect, authorize } = require('../middleware/auth');

/**
 * GET /api/medication
 * --------------------
 * Retrieve all medications with optional filtering.
 * 
 * FR-006.3: Supports filtering for compliance reports
 * FR-006.5: Returns medication inventory data
 * 
 * Query Parameters (all optional):
 *   - status: Filter by status (Active, Completed, Cancelled)
 *   - cycle: Filter by production cycle ID
 *   - medicationType: Filter by medication type
 * 
 * Authorization: Any authenticated user
 * 
 * Response: 200 { success, data: [medications] }
 */
router.get('/', protect, async (req, res) => {
  try {
    const medications = await medicationService.getAll(req.query);
    res.json({ success: true, data: medications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/medication/active
 * ---------------------------
 * Retrieve all medications with status "Active".
 * 
 * FR-006.5: Shows current medication inventory in use
 * 
 * Authorization: Any authenticated user
 * 
 * Response: 200 { success, data: [activeMedications] }
 */
router.get('/active', protect, async (req, res) => {
  try {
    const medications = await medicationService.getActive();
    res.json({ success: true, data: medications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/medication/expiring
 * ------------------------------
 * Retrieve active medications expiring within N days.
 * 
 * FR-006.5: Tracks medication expiry for inventory management
 * Default: 30 days
 * 
 * Query Parameters:
 *   - days: Number of days to look ahead (default: 30)
 * 
 * Authorization: Any authenticated user
 * 
 * Response: 200 { success, data: [expiringMedications] }
 */
router.get('/expiring', protect, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const medications = await medicationService.getExpiring(days);
    res.json({ success: true, data: medications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/medication/cycle/:cycleId
 * ------------------------------------
 * Retrieve all medications for a specific production cycle.
 * 
 * FR-006.1: Returns medication history for the cycle
 * FR-006.3: Supports regulatory compliance reporting per cycle
 * 
 * Authorization: Any authenticated user
 * 
 * Response: 200 { success, data: [medications] }
 */
router.get('/cycle/:cycleId', protect, async (req, res) => {
  try {
    const medications = await medicationService.getByCycle(req.params.cycleId);
    res.json({ success: true, data: medications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/medication/:id
 * -------------------------
 * Retrieve a single medication record by ID.
 * 
 * Authorization: Any authenticated user
 * 
 * Response: 200 { success, data: medication }
 * Error: 404 { success, message: "Medication not found" }
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const medication = await medicationService.getById(req.params.id);
    if (!medication) return res.status(404).json({ success: false, message: 'Medication not found' });
    res.json({ success: true, data: medication });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/medication
 * ----------------------
 * Create a new medication record.
 * 
 * FR-006.1: Records medication name, dosage, date, administered by
 * 
 * Authorization: Farm Manager or Poultry Attendant
 * 
 * Request Body:
 *   { cycle, medicationName, dosage, date?, notes?, expiryDate?, medicationType? }
 * 
 * Response: 201 { success, data: medication } with status: 'Active'
 */
router.post('/', protect, authorize('Farm Manager', 'Poultry Attendant'), [
  body('cycle').notEmpty().withMessage('Cycle is required'),
  body('medicationName').notEmpty().withMessage('Medication name is required'),
  body('dosage').notEmpty().withMessage('Dosage is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const medication = await medicationService.create(req.body, req.user._id);
    res.status(201).json({ success: true, data: medication });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/medication/:id
 * -------------------------
 * Update a medication record.
 * 
 * FR-006.1: Allows updating dosage, date, or other fields
 * 
 * Authorization: Farm Manager or Poultry Attendant
 * 
 * Request Body (all optional):
 *   { medicationName?, dosage?, date?, status?, notes? }
 * 
 * Response: 200 { success, data: medication }
 */
router.put('/:id', protect, authorize('Farm Manager', 'Poultry Attendant'), [
  body('medicationName').optional().trim().notEmpty().withMessage('Medication name cannot be empty'),
  body('dosage').optional().trim().notEmpty().withMessage('Dosage cannot be empty'),
  body('date').optional().isISO8601().withMessage('Date must be a valid ISO 8601 date'),
  body('status').optional().isIn(['Scheduled', 'In Progress', 'Completed', 'Cancelled']).withMessage('Invalid status')
], validate, async (req, res) => {
  try {
    const medication = await medicationService.update(req.params.id, req.body);
    if (!medication) return res.status(404).json({ success: false, message: 'Medication not found' });
    res.json({ success: true, data: medication });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/medication/:id/complete
 * ----------------------------------
 * Mark a medication record as completed.
 * 
 * FR-006.5: Updates medication status from Active to Completed
 * 
 * Authorization: Farm Manager or Poultry Attendant
 * 
 * Response: 200 { success, data: medication } with status: 'Completed'
 */
router.put('/:id/complete', protect, authorize('Farm Manager', 'Poultry Attendant'), async (req, res) => {
  try {
    const medication = await medicationService.complete(req.params.id);
    if (!medication) return res.status(404).json({ success: false, message: 'Medication not found' });
    res.json({ success: true, data: medication });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/medication/:id/cancel
 * --------------------------------
 * Cancel a medication record with a required reason.
 * 
 * FR-006.3: Cancellation reason is recorded for audit/compliance purposes
 * 
 * Authorization: Farm Manager only (higher privilege for cancellations)
 * 
 * Request Body:
 *   { reason: string (required) }
 * 
 * Response: 200 { success, data: medication } with status: 'Cancelled'
 */
router.put('/:id/cancel', protect, authorize('Farm Manager'), [
  body('reason').notEmpty().withMessage('Reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const medication = await medicationService.cancel(req.params.id, req.body.reason);
    if (!medication) return res.status(404).json({ success: false, message: 'Medication not found' });
    res.json({ success: true, data: medication });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
