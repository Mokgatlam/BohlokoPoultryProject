/**
 * Medication Service - FR-006
 * =============================
 * 
 * Business logic layer for medication management and tracking.
 * Handles CRUD operations, filtering, expiry tracking, and status transitions.
 * 
 * Architecture: Service Layer pattern with BaseRepository
 * Pattern: Service -> Repository -> NeDB Database
 * 
 * FR-006 Requirements:
 *   - FR-006.1: Record medication name, dosage, date, administered by
 *   - FR-006.3: Generate medication data for regulatory compliance reports
 *   - FR-006.5: Track medication inventory and usage (active, expiring, expired)
 * 
 * Design Principles:
 *   - Single Responsibility: Handles all medication-related business logic
 *   - Encapsulation: Repository access is internal to the service
 *   - Fail-Fast: Throws descriptive errors for upstream handling
 *   - Audit Trail: Records administeredBy, completedAt, cancelledAt timestamps
 */

const BaseRepository = require('../repositories/BaseRepository');
const db = require('../config/db');

class MedicationService {
  /**
   * Initialize medication repository.
   * Uses BaseRepository for consistent CRUD operations.
   */
  constructor() {
    this.repo = new BaseRepository(db.medications);
  }

  /**
   * Create a new medication record.
   * 
   * FR-006.1: Records medication name, dosage, date, administered by
   * 
   * @param {Object} data - Medication data
   * @param {string} data.cycle - Production cycle ID
   * @param {string} data.medicationName - Name of the medication
   * @param {string} data.dosage - Dosage information
   * @param {string} [data.date] - Administration date (defaults to now)
   * @param {string} [data.notes] - Additional notes
   * @param {string} [data.expiryDate] - Medication expiry date
   * @param {string} [data.medicationType] - Type category
   * @param {string} userId - ID of the administering user
   * @returns {Object} Created medication with status: 'Active'
   */
  async create(data, userId) {
    return await this.repo.create({
      ...data,
      administeredBy: userId,
      status: data.status || 'Active' // Default to Active status
    });
  }

  /**
   * Retrieve all medications with optional filtering.
   * 
   * FR-006.3: Supports filtering for compliance reports
   * FR-006.5: Returns medication inventory data
   * 
   * @param {Object} [filters={}] - Query filters
   * @param {string} [filters.status] - Filter by status (Active, Completed, Cancelled)
   * @param {string} [filters.cycle] - Filter by production cycle ID
   * @param {string} [filters.medicationType] - Filter by medication type
   * @returns {Array} Array of medication records
   */
  async getAll(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.cycle) query.cycle = filters.cycle;
    if (filters.medicationType) query.medicationType = filters.medicationType;
    return await this.repo.find(query);
  }

  /**
   * Retrieve a single medication record by ID.
   * 
   * @param {string} id - Medication's unique identifier
   * @returns {Object|null} Medication record or null if not found
   */
  async getById(id) {
    return await this.repo.findById(id);
  }

  /**
   * Retrieve all medications for a specific production cycle.
   * 
   * FR-006.1: Returns medication history for the cycle
   * FR-006.3: Supports regulatory compliance reporting per cycle
   * 
   * @param {string} cycleId - Production cycle ID
   * @returns {Array} Array of medication records for the cycle
   */
  async getByCycle(cycleId) {
    return await this.repo.find({ cycle: cycleId });
  }

  /**
   * Retrieve all medications with status "Active".
   * 
   * FR-006.5: Shows current medication inventory in use
   * 
   * @returns {Array} Array of active medication records
   */
  async getActive() {
    return await this.repo.find({ status: 'Active' });
  }

  /**
   * Retrieve active medications expiring within N days.
   * 
   * FR-006.5: Tracks medication expiry for inventory management
   * Used for alerts and compliance reporting
   * 
   * @param {number} [days=30] - Number of days to look ahead
   * @returns {Array} Array of expiring medication records
   */
  async getExpiring(days = 30) {
    // Calculate the cutoff date (now + N days)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    // Get all active medications and filter by expiry date
    const all = await this.repo.find({ status: 'Active' });
    return all.filter(m => m.expiryDate && new Date(m.expiryDate) <= futureDate);
  }

  /**
   * Update a medication record.
   * 
   * FR-006.1: Allows updating dosage, date, or other fields
   * 
   * @param {string} id - Medication's unique identifier
   * @param {Object} data - Fields to update
   * @returns {Object} Updated medication record
   */
  async update(id, data) {
    return await this.repo.findByIdAndUpdate(id, data);
  }

  /**
   * Mark a medication as completed.
   * 
   * FR-006.5: Updates medication status from Active to Completed
   * Records completion timestamp for audit trail
   * 
   * @param {string} id - Medication's unique identifier
   * @returns {Object} Updated medication with status: 'Completed'
   */
  async complete(id) {
    return await this.repo.findByIdAndUpdate(id, {
      status: 'Completed',
      completedAt: new Date() // Audit timestamp
    });
  }

  /**
   * Cancel a medication record with a required reason.
   * 
   * FR-006.3: Cancellation reason is recorded for audit/compliance purposes
   * 
   * @param {string} id - Medication's unique identifier
   * @param {string} reason - Cancellation reason (required for audit)
   * @returns {Object} Updated medication with status: 'Cancelled'
   */
  async cancel(id, reason) {
    return await this.repo.findByIdAndUpdate(id, {
      status: 'Cancelled',
      cancellationReason: reason, // FR-006.3: Audit trail
      cancelledAt: new Date() // Audit timestamp
    });
  }

  /**
   * Count total medication records.
   * 
   * Used for dashboard statistics and reporting.
   * 
   * @returns {number} Total count of medication records
   */
  async count() {
    return await this.repo.count();
  }
}

// Export singleton instance (ensures consistent state across application)
module.exports = new MedicationService();
