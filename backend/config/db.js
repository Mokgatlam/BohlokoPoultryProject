/**
 * Database Configuration — MySQL Database
 * 
 * Initializes MySQL database connection using Knex.js.
 * Provides query builder and migration support for the Bohloko Family Farm system.
 * 
 * NFR-016 (Integration Compatibility):
 *   - MySQL provides robust relational database with ACID compliance
 *   - Supports concurrent connections and scalable architecture
 *   - Full-text search and indexing for performance
 * 
 * NFR-018 (Monitoring & Logging):
 *   - system_logs table stores structured audit logs
 *   - Query performance monitoring via Knex
 *   - Connection pool monitoring
 * 
 * Database Tables (39 tables):
 *   Core Business:
 *     - users: User accounts and authentication (FR-001)
 *     - products: Product catalog (FR-010)
 *     - orders: Customer orders (FR-011)
 *     - payments: Payment transactions (FR-013)
 *     - carts: Shopping cart sessions (FR-010)
 * 
 *   Production:
 *     - production_cycles: Broiler growing cycles (FR-004)
 *     - daily_logs: Daily production records (FR-005)
 *     - medications: Medication tracking (FR-006)
 *     - health_checks: Health inspection records (FR-006)
 *     - vaccinations: Vaccination records (FR-006)
 *     - weight_records: Weight monitoring (FR-005)
 *     - feed_records: Feed consumption tracking (FR-005)
 *     - environment_records: Environmental conditions (FR-005)
 * 
 *   Processing:
 *     - harvest_batches: Harvest records (FR-007)
 *     - processing_steps: Processing workflow steps (FR-007)
 *     - processing_batches: Processing batch records (FR-007)
 *     - yield_records: Yield calculations (FR-007)
 *     - processing_quality_checks: Quality during processing (FR-020)
 *     - processing_staff: Processing staff assignments (FR-007)
 * 
 *   Inventory:
 *     - inventory: Stock management (FR-008/009)
 * 
 *   CRM:
 *     - customer_profiles: Customer information (FR-016)
 *     - loyalty_programs: Loyalty program definitions (FR-016)
 *     - customer_enrollments: Loyalty enrollments (FR-016)
 *     - points_transactions: Loyalty points ledger (FR-016)
 *     - feedback_complaints: Customer feedback (FR-016)
 *     - promotional_campaigns: Marketing campaigns (FR-016)
 * 
 *   Compliance:
 *     - quality_checks: Quality inspection records (FR-020)
 *     - compliance_records: Regulatory compliance (FR-021)
 *     - audits: Audit trail records (FR-021)
 * 
 *   System:
 *     - system_config: Key-value system settings (FR-022)
 *     - notification_configs: Notification channel settings (FR-022)
 *     - system_logs: Structured audit logs (FR-023)
 *     - api_keys: API key management
 *     - employees: Employee records
 *     - notifications: Notification delivery records
 *     - password_resets: Password reset tokens (FR-003)
 *     - contact_messages: Contact form submissions
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const knex = require('knex');
const knexConfig = require('../knexfile');

// Get environment from NODE_ENV or default to development
const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

// Create Knex instance
const db = knex(config);

// Test connection
db.raw('SELECT 1')
  .then(() => {
    console.log('✅ MySQL database connected successfully');
  })
  .catch((err) => {
    console.error('❌ MySQL database connection failed:', err.message);
    console.log('📝 Make sure MySQL is running and credentials are correct in .env');
  });

/**
 * Get all table names
 * @returns {Promise<Array>} List of table names
 */
const getTableNames = async () => {
  const result = await db.raw("SHOW TABLES");
  const tableNameKey = Object.keys(result[0][0])[0];
  return result[0].map(row => row[tableNameKey]);
};

/**
 * Get table column information
 * @param {string} tableName - Name of the table
 * @returns {Promise<Array>} Column information
 */
const getTableColumns = async (tableName) => {
  const result = await db.raw(`DESCRIBE ${tableName}`);
  return result[0];
};

/**
 * Check if table exists
 * @param {string} tableName - Name of the table
 * @returns {Promise<boolean>} True if table exists
 */
const tableExists = async (tableName) => {
  try {
    await db.raw(`SELECT 1 FROM ${tableName} LIMIT 1`);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get database statistics
 * @returns {Promise<Object>} Database statistics
 */
const getStats = async () => {
  const tables = await getTableNames();
  const stats = {};
  
  for (const table of tables) {
    try {
      const result = await db.raw(`SELECT COUNT(*) as count FROM ${table}`);
      stats[table] = result[0][0].count;
    } catch (error) {
      stats[table] = 0;
    }
  }
  
  return {
    totalTables: tables.length,
    tables: stats
  };
};

module.exports = db;
module.exports.getTableNames = getTableNames;
module.exports.getTableColumns = getTableColumns;
module.exports.tableExists = tableExists;
module.exports.getStats = getStats;

// MySQL Collection adapters for backward compatibility with NeDB-based services
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
