/**
 * Compliance Service
 * ==================
 * 
 * SRS Reference: FR-020 (Quality Control Tracking), FR-021 (Regulatory Compliance Reporting)
 * 
 * Business logic layer for quality control, compliance documentation, and audit
 * management. Consolidates three related domains into a single service.
 * 
 * Responsibilities:
 *   - Quality check creation, listing, and corrective action tracking
 *   - Compliance record creation and management
 *   - Audit record creation and listing
 *   - Aggregated compliance report generation
 * 
 * Architecture:
 *   - Facade Pattern: Single service over 3 repositories
 *   - Three repositories: qualityChecks, complianceRecords, audits
 *   - Read-Only Reports: getReport() aggregates without modification
 * 
 * Data Stores:
 *   - qualityChecks.db: Quality check results (Pass/Fail) with corrective actions
 *   - complianceRecords.db: Regulatory compliance documentation
 *   - audits.db: Internal/external/regulatory audit records
 * 
 * Dependencies: BaseRepository (generic NeDB wrapper), db (database connections)
 * 
 * FR-020 Coverage:
 *   1. Record quality check results (pass/fail) for batches
 *   2. Document corrective actions for failed checks
 *   5. Maintain audit trails for regulatory inspections
 * 
 * FR-021 Coverage:
 *   1. Compile compliance records for specified periods
 *   2. Format reports according to regulatory requirements
 *   5. Maintain documentation for traceability requirements
 *   6. Export compliance data for external audits
 */

const BaseRepository = require('../repositories/BaseRepository');
const db = require('../config/db');

class ComplianceService {
  /**
   * Initialize repositories for the three compliance domains.
   * 
   * Repositories:
   *   - qualityCheckRepo: Quality check results (qualityChecks collection)
   *   - complianceRecordRepo: Compliance documentation (complianceRecords collection)
   *   - auditRepo: Audit records (audits collection)
   */
  constructor() {
    this.qualityCheckRepo = new BaseRepository(db.qualityChecks);
    this.complianceRecordRepo = new BaseRepository(db.complianceRecords);
    this.auditRepo = new BaseRepository(db.audits);
  }

  // =========================================================================
  // QUALITY CHECKS (FR-020)
  // =========================================================================

  /**
   * Create a new quality check result.
   * 
   * SRS: FR-020 - Record quality check results (pass/fail) for batches
   * 
   * @param {Object} data - Quality check data
   * @param {string} data.batch - Batch reference ID
   * @param {string} data.batchNumber - Human-readable batch number
   * @param {string} data.checkDate - ISO 8601 date of check
   * @param {string} data.result - 'Pass' or 'Fail'
   * @param {string} userId - ID of person performing the check
   * @returns {Object} Created quality check with checkedBy field
   */
  async createQualityCheck(data, userId) {
    return await this.qualityCheckRepo.create({ ...data, checkedBy: userId });
  }

  /**
   * Get quality checks with optional filtering.
   * 
   * SRS: FR-020 - View quality check history
   * 
   * @param {Object} filters - { result: 'Pass'|'Fail', batchId: string }
   * @returns {Array} Matching quality check records
   */
  async getQualityChecks(filters = {}) {
    const query = {};
    if (filters.result) query.result = filters.result;
    if (filters.batchId) query.batch = filters.batchId;
    return await this.qualityCheckRepo.find(query);
  }

  /**
   * Add a corrective action to a failed quality check.
   * 
   * SRS: FR-020 - Document corrective actions for failed checks
   * 
   * Process:
   *   1. Find the quality check by ID
   *   2. Initialize correctiveActions array if not present
   *   3. Push new action with timestamp and performer
   *   4. Update the quality check record
   * 
   * Corrective Action Structure:
   *   - action: Description of action taken
   *   - date: Timestamp of action
   *   - performedBy: User ID of person taking action
   * 
   * @param {string} id - Quality check ID
   * @param {string} action - Corrective action description
   * @param {string} userId - ID of person taking action
   * @returns {Object} Updated quality check
   * @throws {Error} If quality check not found
   */
  async addCorrectiveAction(id, action, userId) {
    const check = await this.qualityCheckRepo.findById(id);
    if (!check) throw new Error('Not found');
    check.correctiveActions = check.correctiveActions || [];
    check.correctiveActions.push({ action, date: new Date(), performedBy: userId });
    return await this.qualityCheckRepo.findByIdAndUpdate(id, { correctiveActions: check.correctiveActions });
  }

  // =========================================================================
  // COMPLIANCE RECORDS (FR-021)
  // =========================================================================

  /**
   * Create a new compliance record for regulatory documentation.
   * 
   * SRS: FR-021 - Compile compliance records, maintain traceability
   * 
   * Record Types:
   *   - Food Safety: HACCP, hygiene, contamination prevention
   *   - Quality Control: Product quality standards
   *   - Environmental: Waste, emissions, sustainability
   *   - Worker Safety: Occupational health and safety
   *   - Regulatory: Government/regulatory compliance
   * 
   * @param {Object} data - Compliance record data
   * @param {string} data.recordType - Type of compliance record
   * @param {string} data.title - Record title
   * @param {string} data.description - Detailed description
   * @param {string} data.effectiveDate - ISO 8601 effective date
   * @param {string} userId - ID of creator
   * @returns {Object} Created compliance record
   */
  async createComplianceRecord(data, userId) {
    return await this.complianceRecordRepo.create({ ...data, createdBy: userId });
  }

  /**
   * Get compliance records with optional filtering.
   * 
   * SRS: FR-021 - View compliance records, traceability documentation
   * 
   * @param {Object} filters - { recordType, status }
   * @returns {Array} Matching compliance records
   */
  async getComplianceRecords(filters = {}) {
    const query = {};
    if (filters.recordType) query.recordType = filters.recordType;
    if (filters.status) query.status = filters.status;
    return await this.complianceRecordRepo.find(query);
  }

  // =========================================================================
  // AUDITS (FR-020, FR-021)
  // =========================================================================

  /**
   * Create a new audit record for regulatory inspections.
   * 
   * SRS: FR-020 - Maintain audit trails for regulatory inspections
   * 
   * Audit Types:
   *   - Internal: Self-inspection by farm management
   *   - External: Third-party auditor inspection
   *   - Regulatory: Government/regulatory body inspection
   * 
   * @param {Object} data - Audit data
   * @param {string} data.auditDate - ISO 8601 audit date
   * @param {string} data.auditType - Internal, External, or Regulatory
   * @param {string} data.overallResult - Pass, Conditional Pass, or Fail
   * @param {string} userId - ID of auditor
   * @returns {Object} Created audit record
   */
  async createAudit(data, userId) {
    return await this.auditRepo.create({ ...data, auditor: userId });
  }

  /**
   * Get audit records with optional filtering.
   * 
   * SRS: FR-020 - View audit history, FR-021 - Audit trail
   * 
   * @param {Object} filters - { auditType, overallResult }
   * @returns {Array} Matching audit records
   */
  async getAudits(filters = {}) {
    const query = {};
    if (filters.auditType) query.auditType = filters.auditType;
    if (filters.overallResult) query.overallResult = filters.overallResult;
    return await this.auditRepo.find(query);
  }

  // =========================================================================
  // REPORTING (FR-021)
  // =========================================================================

  /**
   * Generate an aggregated compliance report across all three domains.
   * 
   * SRS: FR-021 - Generate compliance reports, export for external audits
   * 
   * Report Structure:
   *   qualityChecks:
   *     - total: Total quality checks
   *     - passed: Checks with result='Pass'
   *     - failed: Checks with result='Fail'
   *     - passRate: (passed / total) * 100 (2 decimal places)
   * 
   *   complianceRecords:
   *     - total: Total records
   *     - active: Records with status='Active'
   *     - expired: Records with status='Expired'
   *     - byType: Count breakdown by record type
   * 
   *   audits:
   *     - total: Total audits
   *     - passed: Audits with overallResult='Pass'
   *     - conditional: Audits with overallResult='Conditional Pass'
   *     - failed: Audits with overallResult='Fail'
   * 
   * Use Cases:
   *   - Regulatory inspection preparation
   *   - External audit documentation
   *   - Quality management review meetings
   *   - Compliance status reporting to management
   * 
   * @returns {Object} Aggregated compliance report
   */
  async getReport() {
    const qualityChecks = await this.qualityCheckRepo.find({});
    const records = await this.complianceRecordRepo.find({});
    const audits = await this.auditRepo.find({});

    const report = {
      qualityChecks: {
        total: qualityChecks.length,
        passed: qualityChecks.filter(q => q.result === 'Pass').length,
        failed: qualityChecks.filter(q => q.result === 'Fail').length,
        passRate: qualityChecks.length > 0
          ? ((qualityChecks.filter(q => q.result === 'Pass').length / qualityChecks.length) * 100).toFixed(2)
          : 0
      },
      complianceRecords: {
        total: records.length,
        active: records.filter(r => r.status === 'Active').length,
        expired: records.filter(r => r.status === 'Expired').length,
        byType: {}
      },
      audits: {
        total: audits.length,
        passed: audits.filter(a => a.overallResult === 'Pass').length,
        conditional: audits.filter(a => a.overallResult === 'Conditional Pass').length,
        failed: audits.filter(a => a.overallResult === 'Fail').length
      }
    };

    // Aggregate compliance records by type
    records.forEach(r => {
      report.complianceRecords.byType[r.recordType] = (report.complianceRecords.byType[r.recordType] || 0) + 1;
    });

    return report;
  }
}

module.exports = new ComplianceService();