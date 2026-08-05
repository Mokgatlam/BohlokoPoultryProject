/**
 * Production Service - FR-004, FR-005, FR-006
 * ==============================================
 * 
 * Business logic layer for production cycle management, daily logging,
 * medication tracking, and care dashboard aggregation.
 * 
 * Architecture: Service Layer pattern with multiple BaseRepository instances
 * Pattern: Service -> Repository(s) -> NeDB Database
 * 
 * Repositories:
 *   - productionCycles: FR-004 - Cycle planning and status tracking
 *   - dailyLogs: FR-005 - Daily production data entry
 *   - medications: FR-006 - Medication administration records
 *   - healthChecks: Health monitoring records
 *   - vaccinations: FR-006 - Vaccination schedules and compliance
 *   - weightRecords: Growth tracking data
 *   - feedRecords: FR-005 - Feed consumption tracking
 *   - environmentRecords: FR-005 - Temperature/humidity logging
 * 
 * Design Principles:
 *   - Single Responsibility: Each method handles one business operation
 *   - Fail-Fast: Throws descriptive errors for upstream handling
 *   - Audit Trail: All operations record userId and timestamps
 *   - Separation of Concerns: Business logic isolated from HTTP/Express
 */

const BaseRepository = require('../repositories/BaseRepository');
const db = require('../config/db');

class ProductionService {
  /**
   * Initialize repositories for all production-related data stores.
   * Uses BaseRepository pattern for consistent CRUD operations.
   */
  constructor() {
    this.cycleRepo = new BaseRepository(db.productionCycles);
    this.dailyLogRepo = new BaseRepository(db.dailyLogs);
    this.medicationRepo = new BaseRepository(db.medications);
    this.healthCheckRepo = new BaseRepository(db.healthChecks);
    this.vaccinationRepo = new BaseRepository(db.vaccinations);
    this.weightRecordRepo = new BaseRepository(db.weightRecords);
    this.feedRecordRepo = new BaseRepository(db.feedRecords);
    this.environmentRecordRepo = new BaseRepository(db.environmentRecords);
  }

  // ============================================================================
  // FR-004: Production Cycle Methods
  // ============================================================================

  /**
   * Create a new production cycle.
   * 
   * FR-004.1: Creates cycle with expected birds, start/end dates
   * FR-004.2: Production type (Broiler Cycle, Egg Production, Hatching)
   * FR-004.5: Initial status defaults to "Planned"
   * 
   * @param {Object} data - Cycle data (cycleName, productionType, expectedBirds, dates)
   * @param {string} userId - ID of the creating user (Farm Manager)
   * @returns {Object} Created cycle with _id and timestamps
   */
  async createCycle(data, userId) {
    return await this.cycleRepo.create({ ...data, createdBy: userId });
  }

  /**
   * Retrieve all production cycles.
   * 
   * FR-004.5: Returns cycles with their current status
   * 
   * @returns {Array} Array of production cycles sorted by creation date
   */
  async getCycles() {
    return await this.cycleRepo.find({});
  }

  /**
   * Retrieve a single production cycle by ID.
   * 
   * @param {string} id - Cycle's unique identifier
   * @returns {Object|null} Cycle object or null if not found
   */
  async getCycleById(id) {
    return await this.cycleRepo.findById(id);
  }

  /**
   * Update a production cycle.
   * 
   * FR-004.5: Can update status (Planned -> In Progress -> Completed/Cancelled)
   * 
   * @param {string} id - Cycle's unique identifier
   * @param {Object} data - Fields to update
   * @returns {Object} Updated cycle
   */
  async updateCycle(id, data) {
    return await this.cycleRepo.findByIdAndUpdate(id, data);
  }

  /**
   * Approve a production cycle (change status to "Approved").
   * 
   * FR-004.4: Farm Manager approval required before production begins
   * Records who approved and when for audit trail
   * 
   * @param {string} id - Cycle's unique identifier
   * @param {string} userId - ID of the approving Farm Manager
   * @returns {Object} Updated cycle with status: 'Approved'
   */
  async approveCycle(id, userId) {
    return await this.cycleRepo.findByIdAndUpdate(id, {
      status: 'Approved', approvedBy: userId, approvedAt: new Date()
    });
  }

  // ============================================================================
  // FR-005: Daily Production Logging Methods
  // ============================================================================

  /**
   * Create a daily production log entry.
   * 
   * FR-005.1: Records bird count and feed consumption
   * FR-005.2: Calculates mortality rate: (mortality.count / birdCount) * 100
   * FR-005.5: Triggers alert if mortality rate > 5%
   * 
   * @param {Object} data - Log data (cycle, date, birdCount, mortality, feedConsumption)
   * @param {string} userId - ID of the recording user
   * @returns {Object} Created log with calculated mortality.rate
   */
  async createDailyLog(data, userId) {
    const { birdCount, mortality } = data;
    // FR-005.2: Calculate mortality rate automatically
    const rate = mortality?.count ? (mortality.count / birdCount) * 100 : 0;
    // FR-005.5: Alert for high mortality rates (>5%)
    if (rate > 5) console.log(`ALERT: High mortality rate: ${rate.toFixed(2)}%`);
    return await this.dailyLogRepo.create({ ...data, mortality: { ...mortality, rate }, recordedBy: userId });
  }

  /**
   * Retrieve all daily logs for a production cycle.
   * 
   * FR-005.1: Returns historical data for trend analysis
   * 
   * @param {string} cycleId - Production cycle ID
   * @returns {Array} Array of daily logs sorted by date descending
   */
  async getDailyLogs(cycleId) {
    return await this.dailyLogRepo.find({ cycle: cycleId });
  }

  // ============================================================================
  // FR-006: Medication Methods (via Production Service)
  // ============================================================================

  /**
   * Record medication administration for a production cycle.
   * 
   * FR-006.1: Records medication name, dosage, date, administered by
   * 
   * @param {Object} data - Medication data (cycle, medicationName, dosage, date)
   * @param {string} userId - ID of the administering user
   * @returns {Object} Created medication record
   */
  async createMedication(data, userId) {
    return await this.medicationRepo.create({ ...data, administeredBy: userId });
  }

  /**
   * Retrieve all medications for a production cycle.
   * 
   * FR-006.5: Returns medication history for inventory tracking
   * 
   * @param {string} cycleId - Production cycle ID
   * @returns {Array} Array of medication records
   */
  async getMedications(cycleId) {
    return await this.medicationRepo.find({ cycle: cycleId });
  }

  // ============================================================================
  // Health Check Methods
  // ============================================================================

  /**
   * Record a health check for a production cycle.
   * 
   * FR-005.3: Environmental conditions monitored during health checks
   * 
   * @param {Object} data - Health check data (cycle, date, overallHealth, birdsChecked)
   * @param {string} userId - ID of the inspecting user
   * @returns {Object} Created health check record
   */
  async createHealthCheck(data, userId) {
    return await this.healthCheckRepo.create({ ...data, inspectedBy: userId });
  }

  /**
   * Retrieve all health checks for a production cycle.
   * 
   * @param {string} cycleId - Production cycle ID
   * @returns {Array} Array of health check records
   */
  async getHealthChecks(cycleId) {
    return await this.healthCheckRepo.find({ cycle: cycleId });
  }

  // ============================================================================
  // FR-006: Vaccination Methods
  // ============================================================================

  /**
   * Schedule a vaccination for a production cycle.
   * 
   * FR-006.2: Tracks vaccination schedules with scheduled dates
   * 
   * @param {Object} data - Vaccination data (cycle, vaccineName, scheduledDate, dosage)
   * @param {string} userId - ID of the scheduling user
   * @returns {Object} Created vaccination with status: 'Scheduled'
   */
  async createVaccination(data, userId) {
    return await this.vaccinationRepo.create({ ...data, createdBy: userId });
  }

  /**
   * Retrieve all vaccinations for a production cycle.
   * 
   * FR-006.2: Returns vaccination history for compliance tracking
   * 
   * @param {string} cycleId - Production cycle ID
   * @returns {Array} Array of vaccination records
   */
  async getVaccinations(cycleId) {
    return await this.vaccinationRepo.find({ cycle: cycleId });
  }

  /**
   * Mark a scheduled vaccination as completed.
   * 
   * FR-006.2: Tracks vaccination compliance (Scheduled -> Completed)
   * Records completion timestamp and user for audit trail
   * 
   * @param {string} id - Vaccination's unique identifier
   * @param {string} userId - ID of the completing user
   * @returns {Object} Updated vaccination with status: 'Completed'
   */
  async completeVaccination(id, userId) {
    return await this.vaccinationRepo.findByIdAndUpdate(id, {
      status: 'Completed', completedDate: new Date(), completedBy: userId
    });
  }

  // ============================================================================
  // Weight & Feed Tracking Methods
  // ============================================================================

  /**
   * Record bird weight measurements.
   * 
   * Used for growth tracking and feed conversion ratio calculation.
   * 
   * @param {Object} data - Weight data (cycle, date, averageWeight, sampleSize)
   * @param {string} userId - ID of the recording user
   * @returns {Object} Created weight record
   */
  async createWeightRecord(data, userId) {
    return await this.weightRecordRepo.create({ ...data, recordedBy: userId });
  }

  /**
   * Retrieve all weight records for a production cycle.
   * 
   * @param {string} cycleId - Production cycle ID
   * @returns {Array} Array of weight records
   */
  async getWeightRecords(cycleId) {
    return await this.weightRecordRepo.find({ cycle: cycleId });
  }

  /**
   * Record feed consumption for a production cycle.
   * 
   * FR-005.1: Tracks daily feed consumption
   * Used for feed conversion ratio calculation
   * 
   * @param {Object} data - Feed data (cycle, date, feedType, quantityKg)
   * @param {string} userId - ID of the recording user
   * @returns {Object} Created feed record
   */
  async createFeedRecord(data, userId) {
    return await this.feedRecordRepo.create({ ...data, recordedBy: userId });
  }

  /**
   * Retrieve all feed records for a production cycle.
   * 
   * @param {string} cycleId - Production cycle ID
   * @returns {Array} Array of feed records
   */
  async getFeedRecords(cycleId) {
    return await this.feedRecordRepo.find({ cycle: cycleId });
  }

  // ============================================================================
  // FR-005: Environment Recording Methods
  // ============================================================================

  /**
   * Record environmental conditions for a production cycle.
   * 
   * FR-005.3: Logs temperature and humidity for bird welfare monitoring
   * 
   * @param {Object} data - Environment data (cycle, date, temperature, humidity)
   * @param {string} userId - ID of the recording user
   * @returns {Object} Created environment record
   */
  async createEnvironmentRecord(data, userId) {
    return await this.environmentRecordRepo.create({ ...data, recordedBy: userId });
  }

  /**
   * Retrieve all environment records for a production cycle.
   * 
   * FR-005.3: Returns historical environmental data
   * 
   * @param {string} cycleId - Production cycle ID
   * @returns {Array} Array of environment records
   */
  async getEnvironmentRecords(cycleId) {
    return await this.environmentRecordRepo.find({ cycle: cycleId });
  }

  // ============================================================================
  // Dashboard Aggregation Method
  // ============================================================================

  /**
   * Aggregate data for the production care dashboard.
   * 
   * FR-005.2: Includes mortality rate calculations
   * FR-006.2: Includes upcoming vaccination schedules
   * FR-006.5: Includes recent medication history
   * 
   * Returns:
   *   - activeCycles: Count of cycles with status Active/Approved
   *   - totalBirds: Sum of expected birds across active cycles
   *   - todayMortality: Total mortality count for today
   *   - mortalityRate: Today's mortality rate as percentage
   *   - recentMedications: Last 5 medication records
   *   - upcomingVaccinations: Next 5 uncompleted vaccinations
   *   - recentHealthChecks: Last 5 health check records
   * 
   * @returns {Object} Aggregated dashboard data
   */
  async getCareDashboard() {
    // Get all cycles and filter for active ones
    const cycles = await this.cycleRepo.find({});
    const activeCycles = cycles.filter(c => c.status === 'Active' || c.status === 'Approved');
    const totalBirds = activeCycles.reduce((sum, c) => sum + (c.actualBirds || c.expectedBirds || 0), 0);

    // Get today's mortality data
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = await this.dailyLogRepo.find({ date: today });
    const todayMortality = todayLogs.reduce((sum, l) => sum + (l.mortality?.count || 0), 0);

    // Get medication and vaccination data
    const recentMeds = await this.medicationRepo.find({});
    const allVaccs = await this.vaccinationRepo.find({});
    // FR-006.2: Filter for upcoming (not completed, future date)
    const upcomingVaccs = allVaccs.filter(v => v.status !== 'Completed' && new Date(v.scheduledDate) >= new Date());
    const recentHealth = await this.healthCheckRepo.find({});

    return {
      activeCycles: activeCycles.length,
      totalBirds,
      todayMortality,
      // FR-005.2: Calculate mortality rate as percentage
      mortalityRate: totalBirds > 0 ? ((todayMortality / totalBirds) * 100).toFixed(2) : 0,
      recentMedications: recentMeds.slice(0, 5), // FR-006.5: Last 5 medications
      upcomingVaccinations: upcomingVaccs.slice(0, 5), // FR-006.2: Next 5 vaccinations
      recentHealthChecks: recentHealth.slice(0, 5)
    };
  }
}

// Export singleton instance (ensures consistent state across application)
module.exports = new ProductionService();
