const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const validate = require('../middleware/validate');
const harvestService = require('../services/HarvestService');
const { protect, authorize } = require('../middleware/auth');
const { PRODUCT_TYPES } = require('../config/constants');

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

router.get('/harvest-batches', protect, async (req, res) => {
  try {
    const batches = await harvestService.getHarvestBatches(req.query);
    res.json({ success: true, data: batches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/harvest-batches/:id', protect, async (req, res) => {
  try {
    const batch = await harvestService.getHarvestBatchById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Harvest batch not found' });
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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

router.put('/harvest-batches/:id/start', protect, authorize('Farm Manager', 'Poultry Attendant'), async (req, res) => {
  try {
    const batch = await harvestService.startHarvestBatch(req.params.id, req.user._id);
    if (!batch) return res.status(404).json({ success: false, message: 'Harvest batch not found' });
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/harvest-batches/:id/complete', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const batch = await harvestService.completeHarvestBatch(req.params.id, req.body, req.user._id);
    if (!batch) return res.status(404).json({ success: false, message: 'Harvest batch not found' });
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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

router.get('/processing-batches', protect, async (req, res) => {
  try {
    const batches = await harvestService.getProcessingBatchs(req.query);
    res.json({ success: true, data: batches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/processing-batches/:id', protect, async (req, res) => {
  try {
    const batch = await harvestService.getProcessingBatchById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Processing batch not found' });
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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

router.put('/processing-batches/:id/start', protect, authorize('Farm Manager', 'Processing Staff'), async (req, res) => {
  try {
    const batch = await harvestService.startProcessingBatch(req.params.id, req.user._id);
    if (!batch) return res.status(404).json({ success: false, message: 'Processing batch not found' });
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/processing-batches/:id/complete', protect, authorize('Farm Manager', 'Processing Staff'), async (req, res) => {
  try {
    const batch = await harvestService.completeProcessingBatch(req.params.id, req.body, req.user._id);
    if (!batch) return res.status(404).json({ success: false, message: 'Processing batch not found' });
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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

router.get('/processing-steps/:batchId', protect, async (req, res) => {
  try {
    const steps = await harvestService.getProcessingSteps(req.params.batchId);
    res.json({ success: true, data: steps });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/processing-steps/:id/complete', protect, authorize('Farm Manager', 'Processing Staff'), async (req, res) => {
  try {
    const step = await harvestService.completeProcessingStep(req.params.id, req.body, req.user._id);
    if (!step) return res.status(404).json({ success: false, message: 'Step not found' });
    res.json({ success: true, data: step });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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

router.get('/yield-records', protect, async (req, res) => {
  try {
    const records = await harvestService.getYieldRecords(req.query);
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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

router.get('/quality-checks/:batchId', protect, async (req, res) => {
  try {
    const checks = await harvestService.getQualityChecks(req.params.batchId);
    res.json({ success: true, data: checks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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

router.get('/staff-assignments/:batchId', protect, async (req, res) => {
  try {
    const assignments = await harvestService.getStaffAssignments(req.params.batchId);
    res.json({ success: true, data: assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/harvest-dashboard', protect, async (req, res) => {
  try {
    const dashboard = await harvestService.getHarvestDashboard();
    res.json({ success: true, data: dashboard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
