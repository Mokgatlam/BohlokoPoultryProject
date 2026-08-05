const BaseRepository = require('../repositories/BaseRepository');
const db = require('../config/db');

class HarvestService {
  constructor() {
    this.harvestBatchRepo = new BaseRepository(db.harvestBatches);
    this.processingBatchRepo = new BaseRepository(db.processingBatches);
    this.processingStepRepo = new BaseRepository(db.processingSteps);
    this.yieldRecordRepo = new BaseRepository(db.yieldRecords);
    this.qualityCheckRepo = new BaseRepository(db.processingQualityChecks);
    this.staffRepo = new BaseRepository(db.processingStaff);
    this.inventoryRepo = new BaseRepository(db.inventory);
  }

  async createHarvestBatch(data, userId) {
    return await this.harvestBatchRepo.create({ ...data, createdBy: userId });
  }

  async getHarvestBatches(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.cycle) query.cycle = filters.cycle;
    return await this.harvestBatchRepo.find(query);
  }

  async getHarvestBatchById(id) {
    return await this.harvestBatchRepo.findById(id);
  }

  async updateHarvestBatch(id, data) {
    return await this.harvestBatchRepo.findByIdAndUpdate(id, data);
  }

  async startHarvestBatch(id, userId) {
    return await this.harvestBatchRepo.findByIdAndUpdate(id, {
      status: 'In Progress', startedAt: new Date(), startedBy: userId
    });
  }

  async completeHarvestBatch(id, data, userId) {
    return await this.harvestBatchRepo.findByIdAndUpdate(id, {
      status: 'Completed', completedAt: new Date(), completedBy: userId,
      actualWeight: data.actualWeight, actualCount: data.actualCount, notes: data.notes
    });
  }

  async createProcessingBatch(data, userId) {
    return await this.processingBatchRepo.create({ ...data, createdBy: userId });
  }

  async getProcessingBatchs(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.harvestBatch) query.harvestBatch = filters.harvestBatch;
    return await this.processingBatchRepo.find(query);
  }

  async getProcessingBatchById(id) {
    return await this.processingBatchRepo.findById(id);
  }

  async updateProcessingBatch(id, data) {
    return await this.processingBatchRepo.findByIdAndUpdate(id, data);
  }

  async startProcessingBatch(id, userId) {
    return await this.processingBatchRepo.findByIdAndUpdate(id, {
      status: 'Processing', startedAt: new Date(), startedBy: userId
    });
  }

  async completeProcessingBatch(id, data, userId) {
    const batch = await this.processingBatchRepo.findByIdAndUpdate(id, {
      status: 'Completed', completedAt: new Date(), completedBy: userId,
      outputQuantity: data.outputQuantity, outputWeight: data.outputWeight,
      wasteWeight: data.wasteWeight, notes: data.notes
    });

    if (data.createInventory && data.outputQuantity > 0) {
      const harvest = await this.harvestBatchRepo.findById(batch.harvestBatch);
      const inventoryItem = await this.inventoryRepo.create({
        cycle: harvest?.cycle,
        productType: batch.productType,
        quantity: data.outputQuantity,
        weight: data.outputWeight || 0,
        batchNumber: batch.batchNumber,
        harvestDate: batch.processingDate,
        expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        storageLocation: data.storageLocation || 'Cold Storage A',
        pricePerUnit: data.pricePerUnit || 0,
        status: 'available',
        createdBy: userId
      });
      await this.processingBatchRepo.findByIdAndUpdate(id, { inventoryItem: inventoryItem._id });
      batch.inventoryItem = inventoryItem._id;
    }

    return batch;
  }

  async createProcessingStep(data, userId) {
    return await this.processingStepRepo.create({ ...data, createdBy: userId });
  }

  async getProcessingSteps(batchId) {
    return await this.processingStepRepo.find({ processingBatch: batchId });
  }

  async completeProcessingStep(id, data, userId) {
    return await this.processingStepRepo.findByIdAndUpdate(id, {
      status: 'Completed', endTime: new Date(), completedBy: userId,
      outputQuantity: data.outputQuantity, wasteQuantity: data.wasteQuantity, notes: data.notes
    });
  }

  async createYieldRecord(data, userId) {
    const yieldPercentage = (data.outputWeight / data.inputWeight) * 100;
    return await this.yieldRecordRepo.create({ ...data, yieldPercentage, recordedBy: userId });
  }

  async getYieldRecords(filters = {}) {
    const query = filters.processingBatch ? { processingBatch: filters.processingBatch } : {};
    return await this.yieldRecordRepo.find(query);
  }

  async createQualityCheck(data, userId) {
    return await this.qualityCheckRepo.create({ ...data, inspectedBy: userId });
  }

  async getQualityChecks(batchId) {
    return await this.qualityCheckRepo.find({ processingBatch: batchId });
  }

  async createStaffAssignment(data, userId) {
    return await this.staffRepo.create({ ...data, assignedBy: userId });
  }

  async getStaffAssignments(batchId) {
    return await this.staffRepo.find({ processingBatch: batchId });
  }

  async getHarvestDashboard() {
    const harvestBatches = await this.harvestBatchRepo.find({});
    const processingBatches = await this.processingBatchRepo.find({});
    const yieldRecords = await this.yieldRecordRepo.find({});

    const today = new Date().toISOString().split('T')[0];
    const todayHarvests = harvestBatches.filter(b => b.harvestDate === today);
    const inProgress = processingBatches.filter(b => b.status === 'Processing');

    const totalBirdsHarvested = harvestBatches.reduce((sum, b) => sum + (b.birdCount || 0), 0);
    const totalWeightProcessed = processingBatches.reduce((sum, b) => sum + (b.outputWeight || 0), 0);
    const avgYield = yieldRecords.length > 0
      ? yieldRecords.reduce((sum, r) => sum + (r.yieldPercentage || 0), 0) / yieldRecords.length
      : 0;

    return {
      totalHarvests: harvestBatches.length,
      todayHarvests: todayHarvests.length,
      totalBirdsHarvested,
      totalProcessing: processingBatches.length,
      inProgressProcessing: inProgress.length,
      totalWeightProcessed,
      avgYield: avgYield.toFixed(1),
      recentHarvests: harvestBatches.slice(0, 5),
      recentProcessing: processingBatches.slice(0, 5)
    };
  }
}

module.exports = new HarvestService();
