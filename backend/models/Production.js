/**
 * Production Models - FR-004, FR-005, FR-006
 * ============================================
 * 
 * Data models for all production-related entities in the Bohloko Family Farm system.
 * Defines schemas and static methods for production data operations.
 * 
 * Architecture: Active Record pattern (model handles its own persistence)
 * Database: NeDB (file-based, MongoDB-compatible)
 * 
 * Models:
 *   - ProductionCycle: FR-004 - Cycle planning and lifecycle management
 *   - DailyLog: FR-005 - Daily production data entry
 *   - Medication: FR-006 - Medication administration records
 *   - HealthCheck: Health monitoring records
 *   - Vaccination: FR-006 - Vaccination schedules and compliance
 *   - WeightRecord: Growth tracking data
 *   - FeedRecord: FR-005 - Feed consumption tracking
 *   - EnvironmentRecord: FR-005 - Temperature/humidity logging
 * 
 * Design Principles:
 *   - Encapsulation: Each model encapsulates its own data access logic
 *   - Consistency: All models follow the same CRUD pattern
 *   - Audit Trail: createdAt and updatedAt timestamps on all records
 *   - UUID Primary Keys: Uses UUIDs for distributed system compatibility
 */

const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// ============================================================================
// FR-004: Production Cycle Model
// ============================================================================

/**
 * ProductionCycle - Manages broiler production cycle lifecycle.
 * 
 * FR-004.1: Stores expected birds, start/end dates (duration)
 * FR-004.2: Production type (Broiler Cycle, Egg Production, Hatching)
 * FR-004.5: Status tracking (Planned -> Approved -> In Progress -> Completed/Cancelled)
 * 
 * Schema Fields:
 *   - _id: UUID primary key
 *   - cycleName: Human-readable cycle identifier
 *   - productionType: 'Broiler Cycle' | 'Egg Production' | 'Hatching'
 *   - expectedBirds: Target bird count
 *   - actualBirds: Actual bird count (set when cycle starts)
 *   - startDate: Cycle start date
 *   - expectedEndDate: Planned completion date
 *   - status: 'Planned' | 'Approved' | 'In Progress' | 'Completed' | 'Cancelled'
 *   - createdBy: User ID of creating Farm Manager
 *   - approvedBy: User ID of approving Farm Manager (FR-004.4)
 *   - approvedAt: Approval timestamp
 */
class ProductionCycle {
  /**
   * Create a new production cycle.
   * 
   * @param {Object} data - Cycle data
   * @returns {Object} Created cycle with _id and timestamps
   */
  static async create(data) {
    const cycle = { _id: uuidv4(), ...data, createdAt: new Date(), updatedAt: new Date() };
    await db.productionCycles.insert(cycle);
    return cycle;
  }

  /**
   * Find all cycles matching a query, sorted by creation date descending.
   * 
   * @param {Object} [query={}] - MongoDB-style query
   * @returns {Array} Array of production cycles
   */
  static async find(query = {}) {
    return await db.productionCycles.find(query).sort({ createdAt: -1 }).exec();
  }

  /**
   * Find a cycle by its unique ID.
   * 
   * @param {string} id - Cycle's UUID
   * @returns {Object|null} Cycle object or null if not found
   */
  static async findById(id) {
    return await db.productionCycles.findOne({ _id: id });
  }

  /**
   * Update a cycle by ID with automatic updatedAt timestamp.
   * 
   * @param {string} id - Cycle's UUID
   * @param {Object} updates - Fields to update
   * @returns {Object} Updated cycle
   */
  static async findByIdAndUpdate(id, updates) {
    updates.updatedAt = new Date();
    await db.productionCycles.update({ _id: id }, { $set: updates });
    return await db.productionCycles.findOne({ _id: id });
  }

  /**
   * Count cycles matching a query.
   * 
   * @param {Object} [query={}] - MongoDB-style query
   * @returns {number} Count of matching cycles
   */
  static async count(query = {}) {
    return await db.productionCycles.count(query);
  }
}

// ============================================================================
// FR-005: Daily Log Model
// ============================================================================

/**
 * DailyLog - Records daily production activities.
 * 
 * FR-005.1: Stores bird count and feed consumption
 * FR-005.2: Stores mortality count with calculated rate
 * FR-005.3: Environmental conditions logged separately (EnvironmentRecord)
 * 
 * Schema Fields:
 *   - _id: UUID primary key
 *   - cycle: Production cycle ID (foreign key)
 *   - date: Log date (ISO 8601)
 *   - birdCount: Current bird count
 *   - mortality: { count, rate } - rate calculated automatically
 *   - feedConsumption: Feed data
 *   - issues: Any issues observed
 *   - recordedBy: User ID of recording staff
 */
class DailyLog {
  static async create(data) {
    const log = { _id: uuidv4(), ...data, createdAt: new Date(), updatedAt: new Date() };
    await db.dailyLogs.insert(log);
    return log;
  }

  /**
   * Find all logs matching a query, sorted by date descending.
   * 
   * @param {Object} [query={}] - MongoDB-style query (typically { cycle: cycleId })
   * @returns {Array} Array of daily logs
   */
  static async find(query = {}) {
    return await db.dailyLogs.find(query).sort({ date: -1 }).exec();
  }

  static async findById(id) {
    return await db.dailyLogs.findOne({ _id: id });
  }

  static async findByIdAndUpdate(id, updates) {
    updates.updatedAt = new Date();
    await db.dailyLogs.update({ _id: id }, { $set: updates });
    return await db.dailyLogs.findOne({ _id: id });
  }

  static async count(query = {}) {
    return await db.dailyLogs.count(query);
  }
}

// ============================================================================
// FR-006: Medication Model
// ============================================================================

/**
 * Medication - Tracks medication administration for production cycles.
 * 
 * FR-006.1: Records medication name, dosage, date, administered by
 * FR-006.5: Tracks status for inventory management (Active, Completed, Cancelled)
 * 
 * Schema Fields:
 *   - _id: UUID primary key
 *   - cycle: Production cycle ID (foreign key)
 *   - medicationName: Name of the medication
 *   - dosage: Dosage information
 *   - date: Administration date
 *   - status: 'Active' | 'Completed' | 'Cancelled' | 'Scheduled'
 *   - administeredBy: User ID of administering staff
 *   - expiryDate: Medication expiry date (FR-006.5)
 *   - medicationType: Type category
 *   - notes: Additional notes
 *   - completedAt: Completion timestamp
 *   - cancellationReason: Reason for cancellation (FR-006.3 audit)
 *   - cancelledAt: Cancellation timestamp
 */
class Medication {
  static async create(data) {
    const med = { _id: uuidv4(), ...data, createdAt: new Date(), updatedAt: new Date() };
    await db.medications.insert(med);
    return med;
  }

  /**
   * Find all medications matching a query, sorted by date descending.
   * 
   * @param {Object} [query={}] - MongoDB-style query
   * @returns {Array} Array of medication records
   */
  static async find(query = {}) {
    return await db.medications.find(query).sort({ date: -1 }).exec();
  }

  static async findById(id) {
    return await db.medications.findOne({ _id: id });
  }

  static async count(query = {}) {
    return await db.medications.count(query);
  }
}

// ============================================================================
// Health Check Model
// ============================================================================

/**
 * HealthCheck - Records bird health inspections.
 * 
 * FR-005.3: Environmental conditions may be noted during health checks
 * 
 * Schema Fields:
 *   - _id: UUID primary key
 *   - cycle: Production cycle ID (foreign key)
 *   - date: Inspection date
 *   - overallHealth: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical'
 *   - birdsChecked: Number of birds inspected
 *   - inspectedBy: User ID of inspecting staff
 *   - notes: Additional observations
 */
class HealthCheck {
  static async create(data) {
    const check = { _id: uuidv4(), ...data, createdAt: new Date(), updatedAt: new Date() };
    await db.healthChecks.insert(check);
    return check;
  }

  static async find(query = {}) {
    return await db.healthChecks.find(query).sort({ date: -1 }).exec();
  }

  static async findById(id) {
    return await db.healthChecks.findOne({ _id: id });
  }

  static async count(query = {}) {
    return await db.healthChecks.count(query);
  }
}

// ============================================================================
// FR-006: Vaccination Model
// ============================================================================

/**
 * Vaccination - Tracks vaccination schedules and compliance.
 * 
 * FR-006.2: Tracks vaccination schedules and compliance status
 * 
 * Schema Fields:
 *   - _id: UUID primary key
 *   - cycle: Production cycle ID (foreign key)
 *   - vaccineName: Name of the vaccine
 *   - scheduledDate: When the vaccination should be administered
 *   - dosage: Vaccine dosage
 *   - status: 'Scheduled' | 'Completed' | 'Cancelled'
 *   - completedDate: Actual completion date
 *   - completedBy: User ID of completing staff
 *   - createdBy: User ID of scheduling staff
 */
class Vaccination {
  static async create(data) {
    const vacc = { _id: uuidv4(), ...data, createdAt: new Date(), updatedAt: new Date() };
    await db.vaccinations.insert(vacc);
    return vacc;
  }

  /**
   * Find all vaccinations matching a query, sorted by scheduled date descending.
   * 
   * @param {Object} [query={}] - MongoDB-style query
   * @returns {Array} Array of vaccination records
   */
  static async find(query = {}) {
    return await db.vaccinations.find(query).sort({ scheduledDate: -1 }).exec();
  }

  static async findById(id) {
    return await db.vaccinations.findOne({ _id: id });
  }

  /**
   * Update a vaccination by ID (used for marking as completed).
   * 
   * @param {string} id - Vaccination's UUID
   * @param {Object} updates - Fields to update
   * @returns {Object} Updated vaccination
   */
  static async findByIdAndUpdate(id, updates) {
    updates.updatedAt = new Date();
    await db.vaccinations.update({ _id: id }, { $set: updates });
    return await db.vaccinations.findOne({ _id: id });
  }

  static async count(query = {}) {
    return await db.vaccinations.count(query);
  }
}

// ============================================================================
// Weight Record Model
// ============================================================================

/**
 * WeightRecord - Tracks bird weight measurements for growth analysis.
 * 
 * Used for feed conversion ratio calculation and growth monitoring.
 * 
 * Schema Fields:
 *   - _id: UUID primary key
 *   - cycle: Production cycle ID (foreign key)
 *   - date: Measurement date
 *   - averageWeight: Average weight in kg
 *   - sampleSize: Number of birds sampled
 *   - recordedBy: User ID of recording staff
 */
class WeightRecord {
  static async create(data) {
    const record = { _id: uuidv4(), ...data, createdAt: new Date(), updatedAt: new Date() };
    await db.weightRecords.insert(record);
    return record;
  }

  static async find(query = {}) {
    return await db.weightRecords.find(query).sort({ date: -1 }).exec();
  }

  static async count(query = {}) {
    return await db.weightRecords.count(query);
  }
}

// ============================================================================
// FR-005: Feed Record Model
// ============================================================================

/**
 * FeedRecord - Tracks feed consumption for production cycles.
 * 
 * FR-005.1: Records daily feed consumption
 * Used for feed conversion ratio calculation (FR-006.5)
 * 
 * Schema Fields:
 *   - _id: UUID primary key
 *   - cycle: Production cycle ID (foreign key)
 *   - date: Feed date
 *   - feedType: Type of feed (e.g., starter, grower, finisher)
 *   - quantityKg: Quantity in kilograms
 *   - recordedBy: User ID of recording staff
 */
class FeedRecord {
  static async create(data) {
    const record = { _id: uuidv4(), ...data, createdAt: new Date(), updatedAt: new Date() };
    await db.feedRecords.insert(record);
    return record;
  }

  static async find(query = {}) {
    return await db.feedRecords.find(query).sort({ date: -1 }).exec();
  }

  static async count(query = {}) {
    return await db.feedRecords.count(query);
  }
}

// ============================================================================
// FR-005: Environment Record Model
// ============================================================================

/**
 * EnvironmentRecord - Tracks environmental conditions in poultry housing.
 * 
 * FR-005.3: Logs temperature and humidity for bird welfare monitoring
 * Critical for identifying conditions that may affect bird health
 * 
 * Schema Fields:
 *   - _id: UUID primary key
 *   - cycle: Production cycle ID (foreign key)
 *   - date: Reading date
 *   - temperature: Temperature reading (Celsius)
 *   - humidity: Humidity percentage (optional)
 *   - notes: Additional observations
 *   - recordedBy: User ID of recording staff
 */
class EnvironmentRecord {
  static async create(data) {
    const record = { _id: uuidv4(), ...data, createdAt: new Date(), updatedAt: new Date() };
    await db.environmentRecords.insert(record);
    return record;
  }

  static async find(query = {}) {
    return await db.environmentRecords.find(query).sort({ date: -1 }).exec();
  }

  static async count(query = {}) {
    return await db.environmentRecords.count(query);
  }
}

module.exports = { 
  ProductionCycle, DailyLog, Medication, HealthCheck, 
  Vaccination, WeightRecord, FeedRecord, EnvironmentRecord 
};
