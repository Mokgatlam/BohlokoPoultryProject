/**
 * Harvest Service
 * ===============
 * 
 * SRS Reference: FR-007 (Harvesting & Processing), FR-008 (Inventory Management)
 * 
 * Business logic layer for harvest and processing operations. Manages the complete
 * lifecycle from harvest batch creation through processing to inventory creation.
 * 
 * Responsibilities:
 *   - Harvest batch CRUD and status transitions (Scheduled -> In Progress -> Completed)
 *   - Processing batch CRUD and status transitions (Scheduled -> Processing -> Completed)
 *   - Processing step tracking (9 step types: Slaughter through Store)
 *   - Yield record creation with auto-calculated yield percentage
 *   - Quality check recording for compliance
 *   - Staff assignment management
 *   - Auto-creation of inventory items upon processing completion
 *   - Dashboard aggregation with harvest/processing statistics
 * 
 * Data Flow:
 *   Production Cycle -> Harvest Batch -> Processing Batch -> Processing Steps
 *                                                                 |
 *                                                           Yield Records
 *                                                           Quality Checks
 *                                                                 |
 *                                                           Inventory Item
 * 
 * Dependencies: BaseRepository (generic NeDB wrapper), db (database connections)
 */

const BaseRepository = require('../repositories/BaseRepository');
const db = require('../config/db');

/**
 * HarvestService - Singleton service for harvest and processing operations.
 * 
 * Initializes repository instances for all harvest/processing collections.
 * Uses BaseRepository for standard CRUD operations on NeDB collections.
 */
class HarvestService {
  /**
   * Initialize repository instances for harvest/processing data stores.
   * Collections used:
   *   - harvestBatches: Harvest batch records (bird count, dates, status)
   *   - processingBatches: Processing batch records (product type, output metrics)
   *   - processingSteps: Individual processing step logs (Slaughter, Pluck, etc.)
   *   - yieldRecords: Yield measurement records (input vs output weight)
   *   - processingQualityChecks: Quality check results (Pass/Fail/Conditional)
   *   - processingStaff: Staff assignments to processing batches
   *   - inventory: Inventory items (created automatically on processing completion)
   */
  constructor() {
    this.harvestBatchRepo = new BaseRepository(db.harvestBatches);
    this.processingBatchRepo = new BaseRepository(db.processingBatches);
    this.processingStepRepo = new BaseRepository(db.processingSteps);
    this.yieldRecordRepo = new BaseRepository(db.yieldRecords);
    this.qualityCheckRepo = new BaseRepository(db.processingQualityChecks);
    this.staffRepo = new BaseRepository(db.processingStaff);
    this.inventoryRepo = new BaseRepository(db.inventory);
  }

  // =========================================================================
  // HARVEST BATCH OPERATIONS
  // =========================================================================

  /**
   * Create a new harvest batch.
   * 
   * SRS: FR-007 - Schedule a harvest
   * 
   * @param {Object} data - Harvest batch data { cycle, harvestDate, birdCount, ... }
   * @param {string} userId - ID of user creating the batch (audit trail)
   * @returns {Object} Created harvest batch with _id and createdBy field
   */
  async createHarvestBatch(data, userId) {
    return await this.harvestBatchRepo.create({ ...data, createdBy: userId });
  }

  /**
   * Get harvest batches with optional filtering.
   * 
   * SRS: FR-007 - List/filter harvest batches
   * 
   * @param {Object} filters - Optional filters { status, cycle }
   * @returns {Array} Matching harvest batches
   */
  async getHarvestBatches(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.cycle) query.cycle = filters.cycle;
    return await this.harvestBatchRepo.find(query);
  }

  /**
   * Get a single harvest batch by ID.
   * 
   * SRS: FR-007 - View harvest batch details
   * 
   * @param {string} id - Harvest batch ID
   * @returns {Object|null} Harvest batch or null if not found
   */
  async getHarvestBatchById(id) {
    return await this.harvestBatchRepo.findById(id);
  }

  /**
   * Update harvest batch fields.
   * 
   * SRS: FR-007 - Edit harvest batch details
   * 
   * @param {string} id - Harvest batch ID
   * @param {Object} data - Fields to update
   * @returns {Object|null} Updated harvest batch
   */
  async updateHarvestBatch(id, data) {
    return await this.harvestBatchRepo.findByIdAndUpdate(id, data);
  }

  /**
   * Start a harvest batch - transition to In Progress status.
   * 
   * SRS: FR-007 - Begin harvesting operation
   * Records: status = 'In Progress', startedAt = current time, startedBy = user ID
   * 
   * @param {string} id - Harvest batch ID
   * @param {string} userId - ID of user starting the harvest
   * @returns {Object} Updated harvest batch
   */
  async startHarvestBatch(id, userId) {
    return await this.harvestBatchRepo.findByIdAndUpdate(id, {
      status: 'In Progress', startedAt: new Date(), startedBy: userId
    });
  }

  /**
   * Complete a harvest batch with actual results.
   * 
   * SRS: FR-007 - Complete harvest, record actual vs planned
   * Records: status = 'Completed', completedAt, completedBy, actualWeight, actualCount, notes
   * 
   * @param {string} id - Harvest batch ID
   * @param {Object} data - { actualWeight, actualCount, notes }
   * @param {string} userId - ID of user completing the harvest
   * @returns {Object} Completed harvest batch
   */
  async completeHarvestBatch(id, data, userId) {
    return await this.harvestBatchRepo.findByIdAndUpdate(id, {
      status: 'Completed', completedAt: new Date(), completedBy: userId,
      actualWeight: data.actualWeight, actualCount: data.actualCount, notes: data.notes
    });
  }

  // =========================================================================
  // PROCESSING BATCH OPERATIONS
  // =========================================================================

  /**
   * Create a new processing batch linked to a harvest batch.
   * 
   * SRS: FR-007 - Initiate processing workflow
   * 
   * @param {Object} data - { harvestBatch, productType, processingDate, ... }
   * @param {string} userId - ID of user creating the batch
   * @returns {Object} Created processing batch
   */
  async createProcessingBatch(data, userId) {
    return await this.processingBatchRepo.create({ ...data, createdBy: userId });
  }

  /**
   * Get processing batches with optional filtering.
   * 
   * SRS: FR-007 - List/filter processing batches
   * 
   * @param {Object} filters - Optional filters { status, harvestBatch }
   * @returns {Array} Matching processing batches
   */
  async getProcessingBatchs(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.harvestBatch) query.harvestBatch = filters.harvestBatch;
    return await this.processingBatchRepo.find(query);
  }

  /**
   * Get a single processing batch by ID.
   * 
   * SRS: FR-007 - View processing batch details
   * 
   * @param {string} id - Processing batch ID
   * @returns {Object|null} Processing batch or null
   */
  async getProcessingBatchById(id) {
    return await this.processingBatchRepo.findById(id);
  }

  /**
   * Update processing batch fields.
   * 
   * SRS: FR-007 - Edit processing batch
   * 
   * @param {string} id - Processing batch ID
   * @param {Object} data - Fields to update
   * @returns {Object|null} Updated processing batch
   */
  async updateProcessingBatch(id, data) {
    return await this.processingBatchRepo.findByIdAndUpdate(id, data);
  }

  /**
   * Start processing on a batch - transition to Processing status.
   * 
   * SRS: FR-007 - Begin processing operation
   * Records: status = 'Processing', startedAt, startedBy
   * 
   * @param {string} id - Processing batch ID
   * @param {string} userId - ID of user starting processing
   * @returns {Object} Updated processing batch
   */
  async startProcessingBatch(id, userId) {
    return await this.processingBatchRepo.findByIdAndUpdate(id, {
      status: 'Processing', startedAt: new Date(), startedBy: userId
    });
  }

  /**
   * Complete a processing batch and optionally create an inventory item.
   * 
   * SRS: FR-007 - Complete processing, FR-008 - Auto-create inventory from processed output
   * 
   * Process:
   *   1. Update batch status to 'Completed' with output metrics
   *   2. If createInventory flag is set AND outputQuantity > 0:
   *      a. Fetch parent harvest batch to get cycle ID
   *      b. Create inventory item with:
   *         - batchNumber from processing batch
   *         - 5-day expiry from processing date
   *         - Default to 'Cold Storage A' if no location specified
   *         - status = 'available'
   *      c. Link inventory item back to processing batch
   * 
   * @param {string} id - Processing batch ID
   * @param {Object} data - { outputQuantity, outputWeight, wasteWeight, notes, createInventory, storageLocation, pricePerUnit }
   * @param {string} userId - ID of user completing processing
   * @returns {Object} Completed processing batch (with inventoryItem if created)
   */
  async completeProcessingBatch(id, data, userId) {
    const batch = await this.processingBatchRepo.findByIdAndUpdate(id, {
      status: 'Completed', completedAt: new Date(), completedBy: userId,
      outputQuantity: data.outputQuantity, outputWeight: data.outputWeight,
      wasteWeight: data.wasteWeight, notes: data.notes
    });

    // Auto-create inventory item if requested and there's output to store
    if (data.createInventory && data.outputQuantity > 0) {
      const harvest = await this.harvestBatchRepo.findById(batch.harvestBatch);
      const inventoryItem = await this.inventoryRepo.create({
        cycle: harvest?.cycle,
        productType: batch.productType,
        quantity: data.outputQuantity,
        weight: data.outputWeight || 0,
        batchNumber: batch.batchNumber,
        harvestDate: batch.processingDate,
        expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5-day shelf life
        storageLocation: data.storageLocation || 'Cold Storage A',
        pricePerUnit: data.pricePerUnit || 0,
        status: 'available',
        createdBy: userId
      });
      // Link inventory item back to processing batch for traceability
      await this.processingBatchRepo.findByIdAndUpdate(id, { inventoryItem: inventoryItem._id });
      batch.inventoryItem = inventoryItem._id;
    }

    return batch;
  }

  // =========================================================================
  // PROCESSING STEPS
  // =========================================================================

  /**
   * Log a processing step for a batch.
   * 
   * SRS: FR-007 - Processing step tracking, audit trail
   * Step types: Slaughter, Pluck, Eviscerate, Cut, Portion, Package, Label, Freeze, Store
   * 
   * @param {Object} data - { processingBatch, stepType, startTime, ... }
   * @param {string} userId - ID of user logging the step
   * @returns {Object} Created processing step
   */
  async createProcessingStep(data, userId) {
    return await this.processingStepRepo.create({ ...data, createdBy: userId });
  }

  /**
   * Get all processing steps for a specific batch.
   * 
   * SRS: FR-007 - View processing step history
   * 
   * @param {string} batchId - Processing batch ID
   * @returns {Array} List of processing steps for the batch
   */
  async getProcessingSteps(batchId) {
    return await this.processingStepRepo.find({ processingBatch: batchId });
  }

  /**
   * Mark a processing step as complete with output metrics.
   * 
   * SRS: FR-007 - Complete processing step
   * Records: status = 'Completed', endTime, completedBy, outputQuantity, wasteQuantity, notes
   * 
   * @param {string} id - Processing step ID
   * @param {Object} data - { outputQuantity, wasteQuantity, notes }
   * @param {string} userId - ID of user completing the step
   * @returns {Object} Updated processing step
   */
  async completeProcessingStep(id, data, userId) {
    return await this.processingStepRepo.findByIdAndUpdate(id, {
      status: 'Completed', endTime: new Date(), completedBy: userId,
      outputQuantity: data.outputQuantity, wasteQuantity: data.wasteQuantity, notes: data.notes
    });
  }

  // =========================================================================
  // YIELD RECORDS
  // =========================================================================

  /**
   * Create a yield record with auto-calculated yield percentage.
   * 
   * SRS: FR-007 - Yield tracking, efficiency monitoring
   * Calculation: yieldPercentage = (outputWeight / inputWeight) * 100
   * 
   * @param {Object} data - { processingBatch, productType, inputWeight, outputWeight }
   * @param {string} userId - ID of user recording the yield
   * @returns {Object} Created yield record with yieldPercentage field
   */
  async createYieldRecord(data, userId) {
    const yieldPercentage = (data.outputWeight / data.inputWeight) * 100;
    return await this.yieldRecordRepo.create({ ...data, yieldPercentage, recordedBy: userId });
  }

  /**
   * Get yield records, optionally filtered by processing batch.
   * 
   * SRS: FR-007 - View yield performance data
   * 
   * @param {Object} filters - Optional { processingBatch: batchId }
   * @returns {Array} List of yield records
   */
  async getYieldRecords(filters = {}) {
    const query = filters.processingBatch ? { processingBatch: filters.processingBatch } : {};
    return await this.yieldRecordRepo.find(query);
  }

  // =========================================================================
  // QUALITY CHECKS
  // =========================================================================

  /**
   * Record a quality check result.
   * 
   * SRS: FR-007 - Quality assurance, compliance monitoring
   * Results: Pass, Fail, Conditional
   * 
   * @param {Object} data - { processingBatch, checkType, result, notes, ... }
   * @param {string} userId - ID of user performing the check (inspector)
   * @returns {Object} Created quality check record
   */
  async createQualityCheck(data, userId) {
    return await this.qualityCheckRepo.create({ ...data, inspectedBy: userId });
  }

  /**
   * Get all quality checks for a processing batch.
   * 
   * SRS: FR-007 - View quality check history
   * 
   * @param {string} batchId - Processing batch ID
   * @returns {Array} List of quality check records
   */
  async getQualityChecks(batchId) {
    return await this.qualityCheckRepo.find({ processingBatch: batchId });
  }

  // =========================================================================
  // STAFF ASSIGNMENTS
  // =========================================================================

  /**
   * Assign a staff member to a processing batch.
   * 
   * SRS: FR-007 - Staff allocation for processing operations
   * 
   * @param {Object} data - { staff: userId, processingBatch: batchId, role: string }
   * @param {string} userId - ID of user making the assignment (manager)
   * @returns {Object} Created staff assignment record
   */
  async createStaffAssignment(data, userId) {
    return await this.staffRepo.create({ ...data, assignedBy: userId });
  }

  /**
   * Get all staff assignments for a processing batch.
   * 
   * SRS: FR-007 - View staff assignments
   * 
   * @param {string} batchId - Processing batch ID
   * @returns {Array} List of staff assignment records
   */
  async getStaffAssignments(batchId) {
    return await this.staffRepo.find({ processingBatch: batchId });
  }

  // =========================================================================
  // DASHBOARD & ANALYTICS
  // =========================================================================

  /**
   * Generate aggregated harvest and processing statistics for the dashboard.
   * 
   * SRS: FR-007 - Harvest/processing analytics, operational overview
   * 
   * Returns:
   *   - totalHarvests: Total number of harvest batches
   *   - todayHarvests: Harvests scheduled for today
   *   - totalBirdsHarvested: Sum of birdCount across all harvests
   *   - totalProcessing: Total number of processing batches
   *   - inProgressProcessing: Batches currently in Processing status
   *   - totalWeightProcessed: Sum of outputWeight across all processing batches
   *   - avgYield: Average yield percentage across all yield records (1 decimal)
   *   - recentHarvests: Last 5 harvest batches
   *   - recentProcessing: Last 5 processing batches
   * 
   * @returns {Object} Dashboard statistics object
   */
  async getHarvestDashboard() {
    // Fetch all records for aggregation
    const harvestBatches = await this.harvestBatchRepo.find({});
    const processingBatches = await this.processingBatchRepo.find({});
    const yieldRecords = await this.yieldRecordRepo.find({});

    // Calculate today's date for filtering
    const today = new Date().toISOString().split('T')[0];
    const todayHarvests = harvestBatches.filter(b => b.harvestDate === today);
    const inProgress = processingBatches.filter(b => b.status === 'Processing');

    // Aggregate metrics
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