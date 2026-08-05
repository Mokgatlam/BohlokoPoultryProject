/**
 * MySQL Database Setup Script
 * 
 * This script:
 * 1. Creates the MySQL database if it doesn't exist
 * 2. Runs all migrations to create tables
 * 3. Verifies the setup
 * 
 * Usage: node setup-mysql.js
 */

const knex = require('knex');
const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'bohloko_farm';

async function setupDatabase() {
  console.log('🚀 Starting MySQL database setup...\n');

  // Step 1: Create database if it doesn't exist
  console.log('📦 Step 1: Creating database...');
  try {
    const connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${DB_NAME}' created/verified`);
    await connection.end();
  } catch (error) {
    console.error('❌ Failed to create database:', error.message);
    console.log('\n📝 Troubleshooting:');
    console.log('1. Make sure MySQL is running');
    console.log('2. Check your credentials in .env file');
    console.log('3. Ensure the user has CREATE DATABASE privileges');
    process.exit(1);
  }

  // Step 2: Run migrations
  console.log('\n🔄 Step 2: Running migrations...');
  const db = knex({
    client: 'mysql2',
    connection: {
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME
    }
  });

  try {
    // Check if migrations table exists
    const hasMigrationsTable = await db.schema.hasTable('knex_migrations');
    if (!hasMigrationsTable) {
      console.log('📋 Creating migrations table...');
    }

    // Run migrations
    const [batchNo, log] = await db.migrate.latest({
      directory: './migrations'
    });

    if (log.length === 0) {
      console.log('✅ All migrations already up to date');
    } else {
      console.log(`✅ Batch ${batchNo} run: ${log.length} migrations`);
      log.forEach(migration => {
        console.log(`   - ${migration}`);
      });
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📝 Error details:', error);
    process.exit(1);
  }

  // Step 3: Verify setup
  console.log('\n🔍 Step 3: Verifying setup...');
  try {
    const tables = await db.raw("SHOW TABLES");
    const tableNameKey = Object.keys(tables[0][0])[0];
    const tableList = tables[0].map(row => row[tableNameKey]);
    
    console.log(`✅ Found ${tableList.length} tables:`);
    
    // Group tables by category
    const categories = {
      'Core Business': ['users', 'products', 'orders', 'payments', 'carts'],
      'Production': ['productionCycles', 'dailyLogs', 'medications', 'healthChecks', 'vaccinations', 'weightRecords', 'feedRecords', 'environmentRecords'],
      'Processing': ['harvestBatches', 'processingSteps', 'processingBatches', 'yieldRecords', 'processingQualityChecks', 'processingStaff'],
      'Inventory': ['inventory'],
      'CRM': ['customerProfiles', 'loyaltyPrograms', 'customerEnrollments', 'pointsTransactions', 'feedbackComplaints', 'promotionalCampaigns'],
      'Compliance': ['qualityChecks', 'complianceRecords', 'audits'],
      'System': ['systemConfig', 'notificationConfigs', 'systemLogs', 'apiKeys', 'employees', 'notifications', 'passwordResets', 'contactMessages']
    };

    for (const [category, expectedTables] of Object.entries(categories)) {
      const found = expectedTables.filter(t => tableList.includes(t));
      const status = found.length === expectedTables.length ? '✅' : '⚠️';
      console.log(`   ${status} ${category}: ${found.length}/${expectedTables.length} tables`);
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }

  // Step 4: Show summary
  console.log('\n📊 Setup Summary:');
  console.log('─'.repeat(50));
  console.log(`Database: ${DB_NAME}`);
  console.log(`Host: ${DB_HOST}:${DB_PORT}`);
  console.log(`User: ${DB_USER}`);
  console.log('─'.repeat(50));
  console.log('\n✅ Database setup complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Run: node seed-mysql.js (to populate with demo data)');
  console.log('2. Run: npm start (to start the server)');

  await db.destroy();
}

// Run setup
setupDatabase().catch(err => {
  console.error('❌ Setup failed:', err);
  process.exit(1);
});
