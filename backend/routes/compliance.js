/**
 * Compliance Routes
 * =================
 * 
 * SRS Reference: FR-020 (Quality Control Tracking), FR-021 (Regulatory Compliance Reporting)
 * 
 * REST API endpoints for quality control tracking, compliance record management,
 * audit logging, and regulatory compliance reporting. Consolidates all
 * quality/compliance/audit operations into a single route module.
 * 
 * Endpoints Summary (8 endpoints):
 * 
 *   Quality Control (FR-020):
 *     POST /api/compliance/quality-checks              - Record quality check result
 *     GET  /api/compliance/quality-checks              - List quality checks
 *     PUT  /api/compliance/quality-checks/:id/corrective-action - Add corrective action
 * 
 *   Compliance Records (FR-021):
 *     POST /api/compliance/records                     - Create compliance record
 *     GET  /api/compliance/records                     - List compliance records
 * 
 *   Audits (FR-020, FR-021):
 *     POST /api/compliance/audits                      - Create audit record
 *     GET  /api/compliance/audits                      - List audit records
 * 
 *   Reporting (FR-021):
 *     GET  /api/compliance/report                      - Aggregate compliance report
 * 
 * Design Principles:
 *   - Consolidated module: Quality, compliance, and audits in one route file
 *   - Farm Manager required for writes (create/corrective actions)
 *   - Processing Staff can read quality checks and compliance records
 *   - Express-validator on all write operations
 *   - Consistent response format: { success, data }
 * 
 * FR-020 Requirements Covered:
 *   1. Record quality check results (pass/fail) for batches
 *   2. Document corrective actions for failed checks
 *   5. Maintain audit trails for regulatory inspections
 * 
 * FR-021 Requirements Covered:
 *   3. Compile compliance records for specified periods
 *   5. Maintain documentation for traceability requirements
 *   6. Export compliance data for external audits (via /report endpoint)
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const complianceService = require('../services/ComplianceService');
const { protect, authorize } = require('../middleware/auth');

// =========================================================================
// QUALITY CHECKS (FR-020)
// =========================================================================

/**
 * POST /api/compliance/quality-checks
 * Record a quality check result for a production/processing batch.
 * 
 * SRS: FR-020 - Record quality check results (pass/fail)
 * Access: Farm Manager, Processing Staff
 * 
 * Validates:
 *   - batch: Required (batch reference ID)
 *   - batchNumber: Required (human-readable batch number)
 *   - checkDate: Required (ISO 8601 date)
 *   - result: One of 'Pass' or 'Fail'
 * 
 * Auto-records: checkedBy (user ID of inspector)
 * 
 * @param {string} batch - Batch reference ID
 * @param {string} batchNumber - Human-readable batch number
 * @param {string} checkDate - ISO 8601 date of check
 * @param {string} result - 'Pass' or 'Fail'
 * @returns {Object} Created quality check record
 */
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

/**
 * GET /api/compliance/quality-checks
 * List quality checks with optional filtering.
 * 
 * SRS: FR-020 - View quality check history
 * Access: Farm Manager, Processing Staff
 * 
 * Query params:
 *   - result: Filter by result (Pass, Fail)
 *   - batchId: Filter by batch reference ID
 * 
 * @returns {Array} Quality check records sorted by createdAt DESC
 */
router.get('/quality-checks', protect, authorize('Farm Manager', 'Processing Staff'), async (req, res) => {
  try {
    const checks = await complianceService.getQualityChecks(req.query);
    res.json({ success: true, data: checks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/compliance/quality-checks/:id/corrective-action
 * Add a corrective action to a failed quality check.
 * 
 * SRS: FR-020 - Document corrective actions for failed checks
 * Access: Farm Manager only (quality control gate)
 * 
 * Appends to the correctiveActions array:
 *   - action: Description of corrective action taken
 *   - date: Timestamp of action
 *   - performedBy: User ID of person taking action
 * 
 * @param {string} id - Quality check ID
 * @param {string} action - Corrective action description
 * @returns {Object} Updated quality check with corrective action
 */
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

// =========================================================================
// COMPLIANCE RECORDS (FR-021)
// =========================================================================

/**
 * POST /api/compliance/records
 * Create a new compliance record for regulatory documentation.
 * 
 * SRS: FR-021 - Compile compliance records, FR-021 - Maintain traceability documentation
 * Access: Farm Manager only
 * 
 * Validates:
 *   - recordType: One of 'Food Safety', 'Quality Control', 'Environmental', 'Worker Safety', 'Regulatory'
 *   - title: Required (record title)
 *   - description: Required (detailed description)
 *   - effectiveDate: Required (ISO 8601 date)
 * 
 * Auto-records: createdBy (user ID)
 * 
 * Record Types:
 *   - Food Safety: HACCP, hygiene, contamination prevention
 *   - Quality Control: Product quality standards and testing
 *   - Environmental: Waste management, emissions, sustainability
 *   - Worker Safety: Occupational health and safety
 *   - Regulatory: Government/regulatory body compliance
 * 
 * @param {string} recordType - Type of compliance record
 * @param {string} title - Record title
 * @param {string} description - Detailed description
 * @param {string} effectiveDate - ISO 8601 effective date
 * @returns {Object} Created compliance record
 */
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

/**
 * GET /api/compliance/records
 * List compliance records with optional filtering.
 * 
 * SRS: FR-021 - View compliance records, traceability documentation
 * Access: Farm Manager, Processing Staff
 * 
 * Query params:
 *   - recordType: Filter by type (Food Safety, Quality Control, etc.)
 *   - status: Filter by status (Active, Expired)
 * 
 * @returns {Array} Compliance records sorted by createdAt DESC
 */
router.get('/records', protect, authorize('Farm Manager', 'Processing Staff'), async (req, res) => {
  try {
    const records = await complianceService.getComplianceRecords(req.query);
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =========================================================================
// AUDITS (FR-020, FR-021)
// =========================================================================

/**
 * POST /api/compliance/audits
 * Create a new audit record for regulatory inspections.
 * 
 * SRS: FR-020 - Maintain audit trails for regulatory inspections
 * Access: Farm Manager only
 * 
 * Validates:
 *   - auditDate: Required (ISO 8601 date)
 *   - auditType: One of 'Internal', 'External', 'Regulatory'
 *   - overallResult: One of 'Pass', 'Conditional Pass', 'Fail'
 * 
 * Auto-records: auditor (user ID)
 * 
 * Audit Types:
 *   - Internal: Self-inspection by farm management
 *   - External: Third-party auditor inspection
 *   - Regulatory: Government/regulatory body inspection
 * 
 * @param {string} auditDate - ISO 8601 audit date
 * @param {string} auditType - Internal, External, or Regulatory
 * @param {string} overallResult - Pass, Conditional Pass, or Fail
 * @returns {Object} Created audit record
 */
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

/**
 * GET /api/compliance/audits
 * List audit records with optional filtering.
 * 
 * SRS: FR-020 - View audit history, FR-021 - Audit trail for inspections
 * Access: Farm Manager, Processing Staff
 * 
 * Query params:
 *   - auditType: Filter by type (Internal, External, Regulatory)
 *   - overallResult: Filter by result (Pass, Conditional Pass, Fail)
 * 
 * @returns {Array} Audit records sorted by createdAt DESC
 */
router.get('/audits', protect, authorize('Farm Manager', 'Processing Staff'), async (req, res) => {
  try {
    const audits = await complianceService.getAudits(req.query);
    res.json({ success: true, data: audits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =========================================================================
// REPORTING (FR-021)
// =========================================================================

/**
 * GET /api/compliance/report
 * Generate an aggregated compliance report combining all three domains.
 * 
 * SRS: FR-021 - Generate compliance reports, export for external audits
 * Access: Farm Manager only
 * 
 * Returns:
 *   - qualityChecks: { total, passed, failed, passRate }
 *     - passRate: (passed / total) * 100
 *   - complianceRecords: { total, active, expired, byType }
 *     - byType: Count breakdown by record type
 *   - audits: { total, passed, conditional, failed }
 *     - Counts by audit result
 * 
 * Use Cases:
 *   - Regulatory inspection preparation
 *   - External audit documentation
 *   - Quality management review
 *   - Compliance status reporting
 * 
 * @returns {Object} Aggregated compliance report
 */
router.get('/report', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const report = await complianceService.getReport();
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;