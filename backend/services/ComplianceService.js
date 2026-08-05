const BaseRepository = require('../repositories/BaseRepository');
const db = require('../config/db');

class ComplianceService {
  constructor() {
    this.qualityCheckRepo = new BaseRepository(db.qualityChecks);
    this.complianceRecordRepo = new BaseRepository(db.complianceRecords);
    this.auditRepo = new BaseRepository(db.audits);
  }

  async createQualityCheck(data, userId) {
    return await this.qualityCheckRepo.create({ ...data, checkedBy: userId });
  }

  async getQualityChecks(filters = {}) {
    const query = {};
    if (filters.result) query.result = filters.result;
    if (filters.batchId) query.batch = filters.batchId;
    return await this.qualityCheckRepo.find(query);
  }

  async addCorrectiveAction(id, action, userId) {
    const check = await this.qualityCheckRepo.findById(id);
    if (!check) throw new Error('Not found');
    check.correctiveActions = check.correctiveActions || [];
    check.correctiveActions.push({ action, date: new Date(), performedBy: userId });
    return await this.qualityCheckRepo.findByIdAndUpdate(id, { correctiveActions: check.correctiveActions });
  }

  async createComplianceRecord(data, userId) {
    return await this.complianceRecordRepo.create({ ...data, createdBy: userId });
  }

  async getComplianceRecords(filters = {}) {
    const query = {};
    if (filters.recordType) query.recordType = filters.recordType;
    if (filters.status) query.status = filters.status;
    return await this.complianceRecordRepo.find(query);
  }

  async createAudit(data, userId) {
    return await this.auditRepo.create({ ...data, auditor: userId });
  }

  async getAudits(filters = {}) {
    const query = {};
    if (filters.auditType) query.auditType = filters.auditType;
    if (filters.overallResult) query.overallResult = filters.overallResult;
    return await this.auditRepo.find(query);
  }

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

    records.forEach(r => {
      report.complianceRecords.byType[r.recordType] = (report.complianceRecords.byType[r.recordType] || 0) + 1;
    });

    return report;
  }
}

module.exports = new ComplianceService();
