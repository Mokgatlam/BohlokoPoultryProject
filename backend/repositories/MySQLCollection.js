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
    const mysqlDoc = this.toSnakeCaseObj({ ...insertDoc });
    if (mysqlDoc._id && !mysqlDoc.id) {
      mysqlDoc.id = mysqlDoc._id;
      delete mysqlDoc._id;
    }
    // Stringify JSON objects/arrays for MySQL JSON columns
    for (const [key, value] of Object.entries(mysqlDoc)) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        mysqlDoc[key] = JSON.stringify(value);
      } else if (Array.isArray(value)) {
        mysqlDoc[key] = JSON.stringify(value);
      }
    }
    
    try {
      await this.db(this.tableName).insert(mysqlDoc);
      return insertDoc;
    } catch (error) {
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
    const mysqlUpdates = this.toSnakeCaseObj(updates);
    let knexQuery = this.db(this.tableName);
    knexQuery = this.applyWhere(knexQuery, query);
    
    const count = await knexQuery.update(mysqlUpdates);
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
            case '$regex': knexQuery = knexQuery.whereRaw(`?? ILIKE ?`, [this.toSnakeCase(key), `%${opValue}%`]); break;
            case '$exists': knexQuery = opValue ? knexQuery.whereNotNull(this.toSnakeCase(key)) : knexQuery.whereNull(this.toSnakeCase(key)); break;
            default: knexQuery = knexQuery.where(this.toSnakeCase(key), opValue);
          }
        }
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
    let updates;
    if (update.$set) {
      updates = { ...update.$set };
    } else {
      updates = { ...update };
    }
    // Stringify nested objects for MySQL JSON columns
    for (const [key, value] of Object.entries(updates)) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        updates[key] = JSON.stringify(value);
      } else if (Array.isArray(value)) {
        updates[key] = JSON.stringify(value);
      }
    }
    return updates;
  }

  /**
   * Convert camelCase key to snake_case for MySQL.
   */
  toSnakeCase(str) {
    // Map known field names that don't follow standard conventions
    const fieldMap = {
      '_id': 'id',
      'totalAmount': 'total',
    };
    
    if (fieldMap[str]) return fieldMap[str];
    if (str.startsWith('$')) return str;
    
    // PostgreSQL uses snake_case columns, MySQL uses camelCase
    const isPostgres = this.db && this.db.client && this.db.client.config && 
                       this.db.client.config.client === 'pg';
    
    if (isPostgres) {
      // Convert camelCase to snake_case for PostgreSQL
      return str.replace(/([A-Z])/g, '_$1').toLowerCase();
    }
    // MySQL: return as-is (columns are camelCase)
    return str;
  }

  /**
   * Convert a row from snake_case to camelCase for NeDB compatibility.
   */
  toCamelCaseRow(row) {
    if (!row) return row;
    const result = { ...row };
    if (result.id && !result._id) {
      result._id = result.id;
    }
    // Parse JSON string columns back to objects
    for (const [key, value] of Object.entries(result)) {
      if (typeof value === 'string' && value.startsWith('{') || (typeof value === 'string' && value.startsWith('['))) {
        try {
          result[key] = JSON.parse(value);
        } catch (e) { /* not valid JSON, leave as string */ }
      }
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
