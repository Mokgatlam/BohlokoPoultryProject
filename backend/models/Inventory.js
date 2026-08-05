/**
 * Inventory Model
 * ================
 * 
 * SRS Reference: FR-008 (Inventory Management), FR-009 (Inventory Tracking)
 * 
 * Data model for poultry product inventory batches. Each record represents a
 * discrete batch of product in a specific storage location with full traceability
 * back to the production cycle and processing batch.
 * 
 * Schema Fields:
 *   _id:              UUID - Unique identifier (auto-generated)
 *   cycle:            String - Reference to production cycle ID
 *   productType:      String - Product type (e.g., 'Whole Chicken', 'Breast', 'Eggs')
 *   quantity:         Number - Quantity in units
 *   weight:           Number - Weight in kg (optional, for weight-based tracking)
 *   batchNumber:      String - Unique batch tracking number (format: BATCH-{ts}-{rand} or TRF-{ts}-{rand})
 *   harvestDate:      Date - Date when the product was harvested
 *   expiryDate:       Date - Date when the product expires (typically 5 days from processing)
 *   storageLocation:  String - Current storage location (e.g., 'Cold Storage A', 'Freezer B')
 *   pricePerUnit:     Number - Price per unit for valuation
 *   status:           String - Current status (available|reserved|sold|expired|damaged|transferred)
 *   transferredFrom:  String|null - ID of source batch if this was created via transfer
 *   transferReason:   String|null - Reason for transfer (audit trail)
 *   createdBy:        String - User ID of creator (audit trail)
 *   createdAt:        Date - Record creation timestamp
 *   updatedAt:        Date - Last modification timestamp
 * 
 * Storage: NeDB collection 'inventory' (file-based, no external DB required)
 * Sorting: Default sort by harvestDate descending (newest first)
 */

const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Inventory - Static data access layer for inventory collection.
 * 
 * Provides standard CRUD operations on the inventory NeDB collection.
 * Uses UUID v4 for primary key generation.
 * 
 * Note: Most inventory operations go through InventoryService which adds
 * business logic on top of these raw data operations.
 */
class Inventory {
  /**
   * Create a new inventory record.
   * 
   * SRS: FR-008 - Inventory item creation
   * 
   * @param {Object} data - Inventory data (all fields except _id, createdAt, updatedAt)
   * @returns {Object} Created inventory record with _id, createdAt, updatedAt
   */
  static async create(data) {
    const item = { _id: uuidv4(), ...data, createdAt: new Date(), updatedAt: new Date() };
    await db.inventory.insert(item);
    return item;
  }

  /**
   * Find inventory records matching a query.
   * 
   * SRS: FR-008 - Query inventory, FR-009 - Inventory listing
   * Default sort: harvestDate descending (newest harvests first)
   * 
   * @param {Object} query - NeDB query filter (defaults to empty = all records)
   * @returns {Array} Matching inventory records sorted by harvestDate DESC
   */
  static async find(query = {}) {
    return await db.inventory.find(query, { sort: { harvestDate: -1 } });
  }

  /**
   * Find a single inventory record by ID.
   * 
   * SRS: FR-008 - View inventory item details
   * 
   * @param {string} id - Inventory record UUID
   * @returns {Object|null} Inventory record or null if not found
   */
  static async findById(id) {
    return await db.inventory.findOne({ _id: id });
  }

  /**
   * Find an inventory record by ID and update its fields.
   * 
   * SRS: FR-008 - Update inventory item
   * Automatically updates the updatedAt timestamp.
   * Returns the updated record (re-fetches after update).
   * 
   * @param {string} id - Inventory record UUID
   * @param {Object} updates - Fields to update
   * @returns {Object} Updated inventory record
   */
  static async findByIdAndUpdate(id, updates) {
    updates.updatedAt = new Date();
    await db.inventory.update({ _id: id }, { $set: updates });
    return await db.inventory.findOne({ _id: id });
  }

  /**
   * Count inventory records matching a query.
   * 
   * SRS: FR-009 - Inventory statistics
   * 
   * @param {Object} query - NeDB query filter (defaults to all records)
   * @returns {number} Count of matching records
   */
  static async count(query = {}) {
    return await db.inventory.count(query);
  }
}

module.exports = Inventory;