const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const validate = require('../middleware/validate');
const productionService = require('../services/ProductionService');
const { protect, authorize } = require('../middleware/auth');

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

router.get('/cycles', protect, async (req, res) => {
  try {
    const cycles = await productionService.getCycles();
    res.json({ success: true, data: cycles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/cycles/:id', protect, async (req, res) => {
  try {
    const cycle = await productionService.getCycleById(req.params.id);
    if (!cycle) return res.status(404).json({ success: false, message: 'Cycle not found' });
    res.json({ success: true, data: cycle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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

router.put('/cycles/:id/approve', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const cycle = await productionService.approveCycle(req.params.id, req.user._id);
    if (!cycle) return res.status(404).json({ success: false, message: 'Cycle not found' });
    res.json({ success: true, data: cycle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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

router.get('/daily-logs/:cycleId', protect, async (req, res) => {
  try {
    const logs = await productionService.getDailyLogs(req.params.cycleId);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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

router.get('/medications/:cycleId', protect, async (req, res) => {
  try {
    const medications = await productionService.getMedications(req.params.cycleId);
    res.json({ success: true, data: medications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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

router.get('/health-checks/:cycleId', protect, async (req, res) => {
  try {
    const checks = await productionService.getHealthChecks(req.params.cycleId);
    res.json({ success: true, data: checks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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

router.get('/vaccinations/:cycleId', protect, async (req, res) => {
  try {
    const vaccs = await productionService.getVaccinations(req.params.cycleId);
    res.json({ success: true, data: vaccs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/vaccinations/:id/complete', protect, authorize('Farm Manager', 'Poultry Attendant'), async (req, res) => {
  try {
    const vacc = await productionService.completeVaccination(req.params.id, req.user._id);
    if (!vacc) return res.status(404).json({ success: false, message: 'Vaccination not found' });
    res.json({ success: true, data: vacc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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

router.get('/weight-records/:cycleId', protect, async (req, res) => {
  try {
    const records = await productionService.getWeightRecords(req.params.cycleId);
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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

router.get('/feed-records/:cycleId', protect, async (req, res) => {
  try {
    const records = await productionService.getFeedRecords(req.params.cycleId);
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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

router.get('/environment-records/:cycleId', protect, async (req, res) => {
  try {
    const records = await productionService.getEnvironmentRecords(req.params.cycleId);
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/care-dashboard', protect, async (req, res) => {
  try {
    const dashboard = await productionService.getCareDashboard();
    res.json({ success: true, data: dashboard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
