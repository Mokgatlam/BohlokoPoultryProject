/**
 * Base Repository
 * ===============
 * 
 * SRS Reference: FR-023.4 (Data Integrity Constraints)
 * 
 * Generic data access layer providing CRUD operations for all NeDB
 * collections. Implements the Repository Pattern to abstract database
 * operations from business logic.
 * 
 * Architecture:
 *   - Repository Pattern: Encapsulates all database access
 *   - UUID Primary Keys: Auto-generated v4 UUIDs for new documents
 *   - Timestamp Tracking: createdAt and updatedAt on all records
 *   - Generic Methods: Same interface for all collections
 * 
 * Coding Principles:
 *   1. DRY (Don't Repeat Yourself)
 *      - All services use this base class instead of duplicating CRUD logic
 *      - Reduces code from ~50 lines per model to ~10 lines
 * 
 *   2. Single Responsibility
 *      - Only handles database operations
 *      - Business logic lives in services (ConfigService, etc.)
 * 
 *   3. Open/Closed Principle
 *      - Open for extension: Services can add custom methods
 *      - Closed for modification: Base CRUD doesn't change
 * 
 *   4. Liskov Substitution
 *      - All repositories are interchangeable
 *      - Services can swap collections without code changes
 * 
 * Usage:
 *   const repo = new BaseRepository(db.systemConfig);
 *   const doc = await repo.create({ key: 'taxRate', value: 15 });
 *   const found = await repo.findOne({ key: 'taxRate' });
 *   await repo.findByIdAndUpdate(doc._id, { value: 20 });
 * 
 * Data Store: NeDB file-based database (per collection)
 */

const { v4: uuidv4 } = require('uuid');

class BaseRepository {
  /**
   * Initialize the repository with a NeDB collection.
   * 
   * @param {Object} collection - NeDB collection instance
   */
  constructor(collection) {
    this.collection = collection;
  }

  /**
   * Create a new document with auto-generated UUID and timestamps.
   * 
   * Principle: Convention over Configuration
   * - _id: Auto-generated UUID v4
   * - createdAt: Current timestamp
   * - updatedAt: Current timestamp
   * 
   * @param {Object} data - Document data (without _id, createdAt, updatedAt)
   * @returns {Object} Created document with generated fields
   */
  async create(data) {
    const doc = {
      _id: uuidv4(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await this.collection.insert(doc);
    return doc;
  }

  /**
   * Find documents matching a query with optional sorting and limiting.
   * 
   * @param {Object} query - NeDB query object
   * @param {Object} [options] - { sort: { field: -1 }, limit: 10 }
   * @returns {Array} Matching documents
   */
  async find(query = {}, options = {}) {
    let cursor = this.collection.find(query);
    if (options.sort) cursor = cursor.sort(options.sort);
    if (options.limit) cursor = cursor.limit(options.limit);
    return await cursor.exec();
  }

  /**
   * Find a single document matching a query.
   * 
   * @param {Object} query - NeDB query object
   * @returns {Object|null} Matching document or null
   */
  async findOne(query) {
    return await this.collection.findOne(query);
  }

  /**
   * Find a document by its primary key (_id).
   * 
   * @param {string} id - Document _id
   * @returns {Object|null} Matching document or null
   */
  async findById(id) {
    return await this.collection.findOne({ _id: id });
  }

  /**
   * Find a document by ID and update it atomically.
   * 
   * Process:
   *   1. Set updatedAt to current timestamp
   *   2. Update the document with $set operator
   *   3. Return the updated document
   * 
   * @param {string} id - Document _id
   * @param {Object} updates - Fields to update
   * @returns {Object} Updated document
   */
  async findByIdAndUpdate(id, updates) {
    updates.updatedAt = new Date();
    await this.collection.update({ _id: id }, { $set: updates });
    return await this.collection.findOne({ _id: id });
  }

  /**
   * Update multiple documents matching a query.
   * 
   * @param {Object} query - NeDB query object
   * @param {Object} updates - Fields to update
   * @returns {number} Number of documents updated
   */
  async update(query, updates) {
    updates.updatedAt = new Date();
    return await this.collection.update(query, { $set: updates }, { multi: true });
  }

  /**
   * Delete all documents matching a query.
   * 
   * @param {Object} query - NeDB query object
   * @returns {number} Number of documents removed
   */
  async delete(query) {
    return await this.collection.remove(query, { multi: true });
  }

  /**
   * Delete a single document by ID.
   * 
   * @param {string} id - Document _id
   * @returns {number} Number of documents removed (0 or 1)
   */
  async deleteById(id) {
    return await this.collection.remove({ _id: id });
  }

  /**
   * Count documents matching a query.
   * 
   * @param {Object} [query={}] - NeDB query object
   * @returns {number} Document count
   */
  async count(query = {}) {
    return await this.collection.count(query);
  }
}

module.exports = BaseRepository;