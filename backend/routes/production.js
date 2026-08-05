/**
 * Production Routes - FR-004, FR-005, FR-006
 * ============================================
 * 
 * API endpoints for production cycle management, daily logging, and medication tracking.
 * 
 * Architecture: Express Router with protect + authorize middleware chain
 * Pattern: Request -> Auth Check -> Role Check -> Validation -> Service -> Response
 * 
 * FR-004 Requirements (Production Cycle Planning):
 *   - FR-004.1: Create production plans with expected birds, duration, and budget
 *   - FR-004.2: Define production types (Broiler Cycle, Egg Production, Hatching)
 *   - FR-004.4: Require Farm Manager approval for production plans
 *   - FR-004.5: Track plan status (Planned, In Progress, Completed, Cancelled)
 * 
 * FR-005 Requirements (Daily Production Logging):
 *   - FR-005.1: Record daily bird counts and feed consumption
 *   - FR-005.2: Track mortality counts with automatic mortality rate calculation
 *   - FR-005.3: Log environmental conditions (temperature, humidity)
 *   - FR-005.5: Generate alerts for high mortality rates (>5%)
 * 
 * FR-006 Requirements (Medication & Vaccination Tracking):
 *   - FR-006.1: Record medication name, dosage, date, administered by
 *   - FR-006.2: Track vaccination schedules and compliance
 *   - FR-006.5: Track medication inventory and usage
 * 
 * Security:
 *   - Cycle creation/modification: Farm Manager only
 *   - Daily logs, medications, health checks: Farm Manager or Poultry Attendant
 *   - Read operations: Any authenticated user
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const validate = require('../middleware/validate');
const productionService = require('../services/ProductionService');
const { protect, authorize } = require('../middleware/auth');

// ============================================================================
// FR-004: Production Cycle Endpoints
// ============================================================================

/**
 * POST /api/production/cycles
 * ----------------------------
 * Create a new production cycle.
 * 
 * FR-004.1: Creates cycle with expected birds, start/end dates (duration)
 * FR-004.2: Production type validated against: Broiler Cycle, Egg Production, Hatching
 * FR-004.5: Initial status is "Planned" (requires approval before starting)
 * 
 * Authorization: Farm Manager only
 * 
 * Request Body:
 *   { cycleName, productionType, expectedBirds, startDate, expectedEndDate }
 * 
 * Response: 201 { success, data: cycle }
 */
router.post('/cycles', protect, authorize('Farm Manager'), [
  body('cycleName').notEmpty().withMessage('Cycle name is required'),
  body('productionType').isIn(['Broiler Cycle', 'Egg Production', 'Hatching']),
  body('expectedBirds').isInt({ min: 1 }),
  body('startDate').isISO8601(),
  body('expectedEndDate').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const cycle = await productionService.createCycle(req.body, req.user._id);
    res.status(201).json({ success: true, data: cycle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/production/cycles
 * ---------------------------
 * Retrieve all production cycles.
 * 
 * FR-004.5: Returns cycles with their current status
 * 
 * Authorization: Any authenticated user
 * 
 * Response: 200 { success, data: [cycles] }
 */
router.get('/cycles', protect, async (req, res) => {
  try {
    const cycles = await productionService.getCycles();
    res.json({ success: true, data: cycles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/production/cycles/:id
 * -------------------------------
 * Retrieve a single production cycle by ID.
 * 
 * Authorization: Any authenticated user
 * 
 * Response: 200 { success, data: cycle }
 * Error: 404 { success, message: "Cycle not found" }
 */
router.get('/cycles/:id', protect, async (req, res) => {
  try {
    const cycle = await productionService.getCycleById(req.params.id);
    if (!cycle) return res.status(404).json({ success: false, message: 'Cycle not found' });
    res.json({ success: true, data: cycle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/production/cycles/:id
 * -------------------------------
 * Update a production cycle.
 * 
 * FR-004.5: Can update status (Planned -> In Progress -> Completed/Cancelled)
 * 
 * Authorization: Farm Manager only
 * 
 * Request Body (all optional):
 *   { cycleName?, productionType?, expectedBirds?, startDate?, expectedEndDate?, status? }
 * 
 * Response: 200 { success, data: cycle }
 */
router.put('/cycles/:id', protect, authorize('Farm Manager'), [
  body('cycleName').optional().trim().notEmpty().withMessage('Cycle name cannot be empty'),
  body('productionType').optional().isIn(['Broiler Cycle', 'Egg Production', 'Hatching']).withMessage('Invalid production type'),
  body('expectedBirds').optional().isInt({ min: 0 }).withMessage('Expected birds must be a non-negative integer'),
  body('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  body('expectedEndDate').optional().isISO8601().withMessage('Expected end date must be a valid date'),
  body('status').optional().isIn(['Planned', 'In Progress', 'Completed', 'Cancelled']).withMessage('Invalid status')
], validate, async (req, res) => {
  try {
    const cycle = await productionService.updateCycle(req.params.id, req.body);
    if (!cycle) return res.status(404).json({ success: false, message: 'Cycle not found' });
    res.json({ success: true, data: cycle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/production/cycles/:id/approve
 * ---------------------------------------
 * Approve a production cycle (change status from Planned to Approved).
 * 
 * FR-004.4: Farm Manager approval required before production can begin
 * 
 * Authorization: Farm Manager only
 * 
 * Response: 200 { success, data: cycle } with status: 'Approved'
 */
router.put('/cycles/:id/approve', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const cycle = await productionService.approveCycle(req.params.id, req.user._id);
    if (!cycle) return res.status(404).json({ success: false, message: 'Cycle not found' });
    res.json({ success: true, data: cycle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// FR-005: Daily Production Logging Endpoints
// ============================================================================

/**
 * POST /api/production/daily-logs
 * ---------------------------------
 * Create a daily production log entry.
 * 
 * FR-005.1: Records bird count and feed consumption for the day
 * FR-005.2: Calculates mortality rate automatically from mortality count
 * FR-005.5: Triggers console alert if mortality rate > 5%
 * 
 * Authorization: Farm Manager or Poultry Attendant
 * 
 * Request Body:
 *   { cycle, date, birdCount, mortality?: { count }, feedConsumption?, issues? }
 * 
 * Response: 201 { success, data: log } with calculated mortality.rate
 */
router.post('/daily-logs', protect, authorize('Farm Manager', 'Poultry Attendant'), [
  body('cycle').notEmpty(),
  body('date').isISO8601(),
  body('birdCount').isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const log = await productionService.createDailyLog(req.body, req.user._id);
    res.status(201).json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/production/daily-logs/:cycleId
 * -----------------------------------------
 * Retrieve all daily logs for a production cycle.
 * 
 * FR-005.1: Returns historical daily data for trend analysis
 * 
 * Authorization: Any authenticated user
 * 
 * Response: 200 { success, data: [logs] } sorted by date descending
 */
router.get('/daily-logs/:cycleId', protect, async (req, res) => {
  try {
    const logs = await productionService.getDailyLogs(req.params.cycleId);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// FR-006: Medication & Vaccination Endpoints (via Production Service)
// ============================================================================

/**
 * POST /api/production/medications
 * ----------------------------------
 * Record medication administration for a production cycle.
 * 
 * FR-006.1: Records medication name, dosage, date, and administered by
 * 
 * Authorization: Farm Manager or Poultry Attendant
 * 
 * Request Body:
 *   { cycle, medicationName, dosage, date, notes? }
 * 
 * Response: 201 { success, data: medication }
 */
router.post('/medications', protect, authorize('Farm Manager', 'Poultry Attendant'), [
  body('cycle').notEmpty(),
  body('medicationName').notEmpty(),
  body('dosage').notEmpty(),
  body('date').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const medication = await productionService.createMedication(req.body, req.user._id);
    res.status(201).json({ success: true, data: medication });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/production/medications/:cycleId
 * ------------------------------------------
 * Retrieve all medications for a production cycle.
 * 
 * FR-006.5: Returns medication history for inventory tracking
 * 
 * Authorization: Any authenticated user
 * 
 * Response: 200 { success, data: [medications] }
 */
router.get('/medications/:cycleId', protect, async (req, res) => {
  try {
    const medications = await productionService.getMedications(req.params.cycleId);
    res.json({ success: true, data: medications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// Health Check Endpoints
// ============================================================================

/**
 * POST /api/production/health-checks
 * ------------------------------------
 * Record a health check for a production cycle.
 * 
 * FR-005.3: Environmental conditions logged as part of health monitoring
 * 
 * Authorization: Farm Manager or Poultry Attendant
 * 
 * Request Body:
 *   { cycle, date, overallHealth: 'Excellent'|'Good'|'Fair'|'Poor'|'Critical', birdsChecked }
 * 
 * Response: 201 { success, data: check }
 */
router.post('/health-checks', protect, authorize('Farm Manager', 'Poultry Attendant'), [
  body('cycle').notEmpty(),
  body('date').isISO8601(),
  body('overallHealth').isIn(['Excellent', 'Good', 'Fair', 'Poor', 'Critical']),
  body('birdsChecked').isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const check = await productionService.createHealthCheck(req.body, req.user._id);
    res.status(201).json({ success: true, data: check });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/production/health-checks/:cycleId
 * --------------------------------------------
 * Retrieve all health checks for a production cycle.
 * 
 * Authorization: Any authenticated user
 * 
 * Response: 200 { success, data: [checks] }
 */
router.get('/health-checks/:cycleId', protect, async (req, res) => {
  try {
    const checks = await productionService.getHealthChecks(req.params.cycleId);
    res.json({ success: true, data: checks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// FR-006: Vaccination Endpoints
// ============================================================================

/**
 * POST /api/production/vaccinations
 * -----------------------------------
 * Schedule a vaccination for a production cycle.
 * 
 * FR-006.2: Tracks vaccination schedules with scheduled dates
 * 
 * Authorization: Farm Manager or Poultry Attendant
 * 
 * Request Body:
 *   { cycle, vaccineName, scheduledDate, dosage }
 * 
 * Response: 201 { success, data: vaccination } with status: 'Scheduled'
 */
router.post('/vaccinations', protect, authorize('Farm Manager', 'Poultry Attendant'), [
  body('cycle').notEmpty(),
  body('vaccineName').notEmpty(),
  body('scheduledDate').isISO8601(),
  body('dosage').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const vacc = await productionService.createVaccination(req.body, req.user._id);
    res.status(201).json({ success: true, data: vacc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/production/vaccinations/:cycleId
 * -------------------------------------------
 * Retrieve all vaccinations for a production cycle.
 * 
 * FR-006.2: Returns vaccination history for compliance tracking
 * 
 * Authorization: Any authenticated user
 * 
 * Response: 200 { success, data: [vaccinations] }
 */
router.get('/vaccinations/:cycleId', protect, async (req, res) => {
  try {
    const vaccs = await productionService.getVaccinations(req.params.cycleId);
    res.json({ success: true, data: vaccs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/production/vaccinations/:id/complete
 * -----------------------------------------------
 * Mark a scheduled vaccination as completed.
 * 
 * FR-006.2: Tracks vaccination compliance (Scheduled -> Completed)
 * 
 * Authorization: Farm Manager or Poultry Attendant
 * 
 * Response: 200 { success, data: vaccination } with status: 'Completed'
 */
router.put('/vaccinations/:id/complete', protect, authorize('Farm Manager', 'Poultry Attendant'), async (req, res) => {
  try {
    const vacc = await productionService.completeVaccination(req.params.id, req.user._id);
    if (!vacc) return res.status(404).json({ success: false, message: 'Vaccination not found' });
    res.json({ success: true, data: vacc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// Weight & Feed Tracking Endpoints
// ============================================================================

/**
 * POST /api/production/weight-records
 * --------------------------------------
 * Record bird weight measurements for a production cycle.
 * 
 * Used for growth tracking and feed conversion ratio calculation.
 * 
 * Authorization: Farm Manager or Poultry Attendant
 * 
 * Request Body:
 *   { cycle, date, averageWeight, sampleSize? }
 * 
 * Response: 201 { success, data: record }
 */
router.post('/weight-records', protect, authorize('Farm Manager', 'Poultry Attendant'), [
  body('cycle').notEmpty(),
  body('date').isISO8601(),
  body('averageWeight').isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const record = await productionService.createWeightRecord(req.body, req.user._id);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/production/weight-records/:cycleId
 * ---------------------------------------------
 * Retrieve all weight records for a production cycle.
 * 
 * Authorization: Any authenticated user
 * 
 * Response: 200 { success, data: [records] }
 */
router.get('/weight-records/:cycleId', protect, async (req, res) => {
  try {
    const records = await productionService.getWeightRecords(req.params.cycleId);
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/production/feed-records
 * -----------------------------------
 * Record feed consumption for a production cycle.
 * 
 * FR-005.1: Tracks daily feed consumption
 * Used for feed conversion ratio calculation (FR-006.5)
 * 
 * Authorization: Farm Manager or Poultry Attendant
 * 
 * Request Body:
 *   { cycle, date, feedType, quantityKg }
 * 
 * Response: 201 { success, data: record }
 */
router.post('/feed-records', protect, authorize('Farm Manager', 'Poultry Attendant'), [
  body('cycle').notEmpty(),
  body('date').isISO8601(),
  body('feedType').notEmpty(),
  body('quantityKg').isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const record = await productionService.createFeedRecord(req.body, req.user._id);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/production/feed-records/:cycleId
 * -------------------------------------------
 * Retrieve all feed records for a production cycle.
 * 
 * Authorization: Any authenticated user
 * 
 * Response: 200 { success, data: [records] }
 */
router.get('/feed-records/:cycleId', protect, async (req, res) => {
  try {
    const records = await productionService.getFeedRecords(req.params.cycleId);
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// FR-005: Environment Recording Endpoints
// ============================================================================

/**
 * POST /api/production/environment-records
 * -------------------------------------------
 * Record environmental conditions for a production cycle.
 * 
 * FR-005.3: Logs temperature and humidity for bird welfare monitoring
 * 
 * Authorization: Farm Manager or Poultry Attendant
 * 
 * Request Body:
 *   { cycle, date, temperature, humidity?, notes? }
 * 
 * Response: 201 { success, data: record }
 */
router.post('/environment-records', protect, authorize('Farm Manager', 'Poultry Attendant'), [
  body('cycle').notEmpty(),
  body('date').isISO8601(),
  body('temperature').isFloat()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const record = await productionService.createEnvironmentRecord(req.body, req.user._id);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/production/environment-records/:cycleId
 * --------------------------------------------------
 * Retrieve all environment records for a production cycle.
 * 
 * FR-005.3: Returns historical environmental data
 * 
 * Authorization: Any authenticated user
 * 
 * Response: 200 { success, data: [records] }
 */
router.get('/environment-records/:cycleId', protect, async (req, res) => {
  try {
    const records = await productionService.getEnvironmentRecords(req.params.cycleId);
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// Dashboard Endpoint
// ============================================================================

/**
 * GET /api/production/care-dashboard
 * -------------------------------------
 * Get aggregated production care dashboard data.
 * 
 * FR-005.2: Includes mortality rate calculations
 * FR-006.2: Includes upcoming vaccination schedules
 * FR-006.5: Includes recent medication history
 * 
 * Returns:
 *   - Active cycles count and total birds
 *   - Today's mortality count and rate
 *   - Recent medications (last 5)
 *   - Upcoming vaccinations (next 5)
 *   - Recent health checks (last 5)
 * 
 * Authorization: Any authenticated user
 * 
 * Response: 200 { success, data: dashboard }
 */
router.get('/care-dashboard', protect, async (req, res) => {
  try {
    const dashboard = await productionService.getCareDashboard();
    res.json({ success: true, data: dashboard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
