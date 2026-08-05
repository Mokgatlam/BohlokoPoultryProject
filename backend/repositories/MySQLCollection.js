/**
 * MySQL Collection Adapter
 * ========================
 * 
 * Provides a NeDB-compatible interface over Knex.js MySQL queries.
 * This allows all existing services that use BaseRepository to work
 * with MySQL without rewriting each service.
 * 
 * NeDB API methods supported:
 *   - insert(doc)
 *   - find(query)
 *   - findOne(query)
 *   - update(query, update, options)
 *   - remove(query, options)
 *   - count(query)
 * 
 * Usage:
 *   const db = require('../config/db');
 *   const collection = new MySQLCollection(db, 'users');
 *   const repo = new BaseRepository(collection);
 */

const { v4: uuidv4 } = require('uuid');

class MySQLCollection {
  constructor(knex, tableName) {
    this.db = knex;
    this.tableName = tableName;
  }

  /**
   * Insert a document. Auto-generates _id if not provided.
   */
  async insert(doc) {
    const insertDoc = { ...doc };
    if (!insertDoc._id) {
      insertDoc._id = uuidv4();
    }
    // Convert _id to id for MySQL and convert all keys to snake_case
    const mysqlDoc = this.toSnakeCaseObj({ ...insertDoc });
    if (mysqlDoc._id && !mysqlDoc.id) {
      mysqlDoc.id = mysqlDoc._id;
      delete mysqlDoc._id;
    }
    
    try {
      await this.db(this.tableName).insert(mysqlDoc);
      return insertDoc;
    } catch (error) {
      // If id column doesn't exist, try without it
      if (error.message.includes('Unknown column')) {
        delete mysqlDoc.id;
        await this.db(this.tableName).insert(mysqlDoc);
        return insertDoc;
      }
      throw error;
    }
  }

  /**
   * Find documents matching a query.
   */
  async find(query = {}, options = {}) {
    let knexQuery = this.db(this.tableName);
    knexQuery = this.applyWhere(knexQuery, query);
    
    if (options.sort) {
      for (const [key, dir] of Object.entries(options.sort)) {
        knexQuery = knexQuery.orderBy(this.toSnakeCase(key), dir === 1 ? 'asc' : 'desc');
      }
    }
    if (options.limit) {
      knexQuery = knexQuery.limit(options.limit);
    }
    
    const rows = await knexQuery;
    return rows.map(row => this.toCamelCaseRow(row));
  }

  /**
   * Find a single document matching a query.
   */
  async findOne(query = {}) {
    let knexQuery = this.db(this.tableName);
    knexQuery = this.applyWhere(knexQuery, query);
    knexQuery = knexQuery.limit(1);
    
    const rows = await knexQuery;
    if (rows.length === 0) return null;
    return this.toCamelCaseRow(rows[0]);
  }

  /**
   * Update documents matching a query.
   * Supports NeDB $set operator.
   */
  async update(query, update, options = {}) {
    const updates = this.extractUpdates(update);
    let knexQuery = this.db(this.tableName);
    knexQuery = this.applyWhere(knexQuery, query);
    
    const count = await knexQuery.update(this.toSnakeCaseObj(updates));
    return options.multi ? count : Math.min(count, 1);
  }

  /**
   * Remove documents matching a query.
   */
  async remove(query = {}, options = {}) {
    let knexQuery = this.db(this.tableName);
    knexQuery = this.applyWhere(knexQuery, query);
    
    const count = await knexQuery.del();
    return options.multi ? count : Math.min(count, 1);
  }

  /**
   * Count documents matching a query.
   */
  async count(query = {}) {
    let knexQuery = this.db(this.tableName);
    knexQuery = this.applyWhere(knexQuery, query);
    
    const result = await knexQuery.count('id as count').first();
    return result.count;
  }

  // =========================================================================
  // Helper Methods
  // =========================================================================

  /**
   * Apply WHERE clause from NeDB-style query to Knex query builder.
   */
  applyWhere(knexQuery, query) {
    if (!query || Object.keys(query).length === 0) return knexQuery;
    
    for (const [key, value] of Object.entries(query)) {
      if (key === '$or') {
        knexQuery = knexQuery.where(function() {
          for (const condition of value) {
            const [cKey, cValue] = Object.entries(condition)[0];
            this.orWhere(this.toSnakeCase(cKey), cValue);
          }
        });
      } else if (key === '$and') {
        for (const condition of value) {
          const [cKey, cValue] = Object.entries(condition)[0];
          knexQuery = knexQuery.where(this.toSnakeCase(cKey), cValue);
        }
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Handle operators like $gte, $lte, etc.
        for (const [op, opValue] of Object.entries(value)) {
          switch (op) {
            case '$gte': knexQuery = knexQuery.where(this.toSnakeCase(key), '>=', opValue); break;
            case '$lte': knexQuery = knexQuery.where(this.toSnakeCase(key), '<=', opValue); break;
            case '$gt': knexQuery = knexQuery.where(this.toSnakeCase(key), '>', opValue); break;
            case '$lt': knexQuery = knexQuery.where(this.toSnakeCase(key), '<', opValue); break;
            case '$ne': knexQuery = knexQuery.where(this.toSnakeCase(key), '!=', opValue); break;
            case '$in': knexQuery = knexQuery.whereIn(this.toSnakeCase(key), opValue); break;
            case '$nin': knexQuery = knexQuery.whereNotIn(this.toSnakeCase(key), opValue); break;
            case '$regex': knexQuery = knexQuery.where(this.toSnakeCase(key), 'like', opValue); break;
            default: knexQuery = knexQuery.where(this.toSnakeCase(key), opValue);
          }
        }
      } else if (key === 'status' && value === 'active') {
        // Special case: handle 'active' status for products table
        knexQuery = knexQuery.where('available', true);
      } else {
        knexQuery = knexQuery.where(this.toSnakeCase(key), value);
      }
    }
    return knexQuery;
  }

  /**
   * Extract update operations from NeDB-style update object.
   */
  extractUpdates(update) {
    if (update.$set) {
      return { ...update.$set };
    }
    return { ...update };
  }

  /**
   * Convert camelCase key to snake_case for MySQL.
   */
  toSnakeCase(str) {
    // Map known field names
    const fieldMap = {
      '_id': 'id',
      'userId': 'userId',
      'productId': 'productId',
      'cycleName': 'cycleName',
      'productionType': 'productionType',
      'expectedBirds': 'expectedBirds',
      'startDate': 'startDate',
      'expectedEndDate': 'expectedEndDate',
      'birdCount': 'birdCount',
      'feedConsumption': 'feedConsumption',
      'waterConsumption': 'waterConsumption',
      'medicationName': 'medicationName',
      'vaccineName': 'vaccineName',
      'scheduledDate': 'scheduledDate',
      'batchNumber': 'batchNumber',
      'productType': 'productType',
      'orderNumber': 'orderNumber',
      'customer': 'customer',
      'paymentMethod': 'paymentMethod',
      'paymentStatus': 'paymentStatus',
      'deliveryOption': 'deliveryOption',
      'deliveryAddress': 'deliveryAddress',
      'shippingCost': 'shippingCost',
      'totalAmount': 'total',
      'createdAt': 'created_at',
      'updatedAt': 'updated_at'
    };
    
    if (fieldMap[str]) return fieldMap[str];
    if (str.startsWith('$')) return str;
    return str;
  }

  /**
   * Convert a row from snake_case to camelCase for NeDB compatibility.
   */
  toCamelCaseRow(row) {
    if (!row) return row;
    const result = { ...row };
    // Ensure _id is set for backward compatibility
    if (result.id && !result._id) {
      result._id = result.id;
    }
    return result;
  }

  /**
   * Convert an object's keys to snake_case for MySQL.
   */
  toSnakeCaseObj(obj) {
    if (!obj) return obj;
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[this.toSnakeCase(key)] = value;
    }
    return result;
  }
}

module.exports = MySQLCollection;
