/**
 * Database Configuration — PostgreSQL/MySQL Database
 * 
 * Initializes database connection using Knex.js.
 * Supports PostgreSQL for Render production and MySQL for local development.
 * 
 * NFR-016 (Integration Compatibility):
 *   - PostgreSQL for Render production (free tier)
 *   - MySQL for local development
 *   - Supports concurrent connections and scalable architecture
 *   - Full-text search and indexing for performance
 * 
 * NFR-018 (Monitoring & Logging):
 *   - system_logs table stores structured audit logs
 *   - Query performance monitoring via Knex
 *   - Connection pool monitoring
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const knex = require('knex');
const knexConfig = require('../knexfile');

// Get environment from NODE_ENV or default to development
const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

// Create Knex instance
const db = knex(config);

// Test connection (non-blocking)
const testConnection = async () => {
  try {
    const result = await db.raw('SELECT 1');
    if (environment === 'production') {
      console.log('✅ PostgreSQL database connected successfully');
    } else {
      console.log('✅ MySQL database connected successfully');
    }
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.log('📝 Make sure database is running and credentials are correct');
    return false;
  }
};

// Test connection on startup (non-blocking)
testConnection().catch(err => {
  console.error('Database connection test error:', err.message);
});

/**
 * Get all table names
 * @returns {Promise<Array>} List of table names
 */
const getTableNames = async () => {
  try {
    if (environment === 'production') {
      const result = await db.raw("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
      return result.rows.map(row => row.tablename);
    } else {
      const result = await db.raw("SHOW TABLES");
      const tableNameKey = Object.keys(result[0][0])[0];
      return result[0].map(row => row[tableNameKey]);
    }
  } catch (error) {
    console.error('Error getting table names:', error.message);
    return [];
  }
};

/**
 * Get table column information
 * @param {string} tableName - Name of the table
 * @returns {Promise<Array>} Column information
 */
const getTableColumns = async (tableName) => {
  try {
    if (environment === 'production') {
      const result = await db.raw(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ? AND table_schema = 'public'`, [tableName]);
      return result.rows;
    } else {
      const result = await db.raw(`DESCRIBE ${tableName}`);
      return result[0];
    }
  } catch (error) {
    console.error('Error getting table columns:', error.message);
    return [];
  }
};

/**
 * Check if table exists
 * @param {string} tableName - Name of the table
 * @returns {Promise<boolean>} True if table exists
 */
const tableExists = async (tableName) => {
  try {
    if (environment === 'production') {
      const result = await db.raw(`SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = ? AND schemaname = 'public')`, [tableName]);
      return result.rows[0].exists;
    } else {
      await db.raw(`SELECT 1 FROM ${tableName} LIMIT 1`);
      return true;
    }
  } catch (error) {
    return false;
  }
};

/**
 * Get database statistics
 * @returns {Promise<Object>} Database statistics
 */
const getStats = async () => {
  try {
    const tables = await getTableNames();
    const stats = {};
    
    for (const table of tables) {
      try {
        const result = await db.raw(`SELECT COUNT(*) as count FROM ${table}`);
        stats[table] = environment === 'production' ? result.rows[0].count : result[0][0].count;
      } catch (error) {
        stats[table] = 0;
      }
    }
    
    return {
      totalTables: tables.length,
      tables: stats
    };
  } catch (error) {
    console.error('Error getting database stats:', error.message);
    return { totalTables: 0, tables: {} };
  }
};

module.exports = db;
module.exports.getTableNames = getTableNames;
module.exports.getTableColumns = getTableColumns;
module.exports.tableExists = tableExists;
module.exports.getStats = getStats;

// MySQL Collection adapters for backward compatibility
// Maps old NeDB collection names to MySQL tables
const MySQLCollection = require('../repositories/MySQLCollection');

const tableMap = {
  users: 'users',
  products: 'products',
  orders: 'orders',
  carts: 'carts',
  payments: 'payments',
  inventory: 'inventory',
  productionCycles: 'productioncycles',
  dailyLogs: 'dailylogs',
  medications: 'medications',
  healthChecks: 'healthchecks',
  vaccinations: 'vaccinations',
  weightRecords: 'weightrecords',
  feedRecords: 'feedrecords',
  environmentRecords: 'environmentrecords',
  harvestBatches: 'harvestbatches',
  processingBatches: 'processingbatches',
  processingSteps: 'processingsteps',
  yieldRecords: 'yieldrecords',
  processingQualityChecks: 'processingqualitychecks',
  processingStaff: 'processingstaff',
  systemConfig: 'systemconfig',
  systemLogs: 'systemlogs',
  notifications: 'notifications',
  notificationConfigs: 'notificationconfigs',
  employees: 'employees',
  apiKeys: 'apikeys',
  customerProfiles: 'customerprofiles',
  loyaltyPrograms: 'loyaltyprograms',
  customerEnrollments: 'customerenrollments',
  pointsTransactions: 'pointstransactions',
  feedbackComplaints: 'feedbackcomplaints',
  promotionalCampaigns: 'promotionalcampaigns',
  qualityChecks: 'qualitychecks',
  complianceRecords: 'compliancerecords',
  audits: 'audits',
  passwordResets: 'passwordresets',
  contactMessages: 'contactmessages'
};

// Create collection instances
for (const [nedbName, mysqlTable] of Object.entries(tableMap)) {
  db[nedbName] = new MySQLCollection(db, mysqlTable);
}