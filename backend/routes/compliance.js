const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const complianceService = require('../services/ComplianceService');
const { protect, authorize } = require('../middleware/auth');

router.post('/quality-checks', protect, authorize('Farm Manager', 'Processing Staff'), [
  body('batch').notEmpty(), body('batchNumber').notEmpty(),
  body('checkDate').isISO8601(), body('result').isIn(['Pass', 'Fail'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const check = await complianceService.createQualityCheck(req.body, req.user._id);
    res.status(201).json({ success: true, data: check });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/quality-checks', protect, authorize('Farm Manager', 'Processing Staff'), async (req, res) => {
  try {
    const checks = await complianceService.getQualityChecks(req.query);
    res.json({ success: true, data: checks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/quality-checks/:id/corrective-action', protect, authorize('Farm Manager'), [
  body('action').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const check = await complianceService.addCorrectiveAction(req.params.id, req.body.action, req.user._id);
    res.json({ success: true, data: check });
  } catch (error) {
    const statusCode = error.message.includes('Not found') ? 404 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
});

router.post('/records', protect, authorize('Farm Manager'), [
  body('recordType').isIn(['Food Safety', 'Quality Control', 'Environmental', 'Worker Safety', 'Regulatory']),
  body('title').notEmpty(), body('description').notEmpty(), body('effectiveDate').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const record = await complianceService.createComplianceRecord(req.body, req.user._id);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/records', protect, authorize('Farm Manager', 'Processing Staff'), async (req, res) => {
  try {
    const records = await complianceService.getComplianceRecords(req.query);
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/audits', protect, authorize('Farm Manager'), [
  body('auditDate').isISO8601(), body('auditType').isIn(['Internal', 'External', 'Regulatory']),
  body('overallResult').isIn(['Pass', 'Conditional Pass', 'Fail'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const audit = await complianceService.createAudit(req.body, req.user._id);
    res.status(201).json({ success: true, data: audit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/audits', protect, authorize('Farm Manager', 'Processing Staff'), async (req, res) => {
  try {
    const audits = await complianceService.getAudits(req.query);
    res.json({ success: true, data: audits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/report', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const report = await complianceService.getReport();
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
