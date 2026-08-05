/**
 * Migration: Create All Tables
 * 
 * Creates all database tables for the Bohloko Family Farm system.
 * This migration covers all 37 collections from the NeDB schema.
 */

exports.up = function(knex) {
  return knex.schema
    // ========== CORE BUSINESS TABLES ==========
    
    // Users Table (FR-001, FR-002, FR-003)
    .createTable('users', table => {
      table.string('id', 36).primary();
      table.string('firstName', 100).notNullable();
      table.string('lastName', 100).notNullable();
      table.string('email', 255).notNullable().unique();
      table.string('password', 255).notNullable();
      table.enum('userType', ['Consumer', 'Restaurant', 'Retailer', 'Distributor', 'Farm Gate', 'Institution', 'Staff']).notNullable();
      table.string('role', 50).defaultTo('Customer');
      table.string('phone', 20);
      table.string('businessName', 255);
      table.string('businessRegNumber', 100);
      table.string('taxId', 100);
      table.json('address');
      table.enum('status', ['pending', 'approved', 'suspended', 'rejected', 'deleted']).defaultTo('pending');
      table.integer('failedLoginAttempts').defaultTo(0);
      table.timestamp('lockUntil');
      table.timestamp('lastLogin');
      table.string('lastLoginIP', 45);
      table.timestamps(true, true);
      
      table.index('email');
      table.index('status');
      table.index('userType');
    })

    // Products Table (FR-010)
    .createTable('products', table => {
      table.string('id', 36).primary();
      table.string('name', 255).notNullable();
      table.text('description');
      table.string('category', 100);
      table.decimal('price', 10, 2).notNullable();
      table.string('unit', 50).defaultTo('pieces');
      table.string('image', 500);
      table.boolean('available').defaultTo(true);
      table.timestamps(true, true);
      
      table.index('category');
      table.index('available');
    })

    // Orders Table (FR-011, FR-012, FR-014)
    .createTable('orders', table => {
      table.string('id', 36).primary();
      table.string('orderNumber', 50).notNullable().unique();
      table.string('customer', 36).notNullable();
      table.json('items').notNullable();
      table.decimal('subtotal', 10, 2).notNullable();
      table.decimal('tax', 10, 2).defaultTo(0);
      table.decimal('shippingCost', 10, 2).defaultTo(0);
      table.decimal('total', 10, 2).notNullable();
      table.enum('deliveryOption', ['pickup', 'farm_gate', 'local_delivery']).defaultTo('pickup');
      table.text('deliveryAddress');
      table.enum('paymentMethod', ['cash', 'bank_transfer', 'mobile_money', 'credit_card', 'debit_card', 'eft']).defaultTo('cash');
      table.enum('paymentStatus', ['Pending', 'Paid', 'Refunded', 'Failed']).defaultTo('Pending');
      table.enum('status', ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled']).defaultTo('Pending');
      table.text('notes');
      table.text('cancellationReason');
      table.decimal('refundAmount', 10, 2);
      table.timestamps(true, true);
      
      table.index('customer');
      table.index('status');
      table.index('paymentStatus');
      table.index('orderNumber');
      table.foreign('customer').references('id').inTable('users').onDelete('CASCADE');
    })

    // Payments Table (FR-013)
    .createTable('payments', table => {
      table.string('id', 36).primary();
      table.string('orderId', 36).notNullable();
      table.string('transactionId', 100);
      table.decimal('amount', 10, 2).notNullable();
      table.string('currency', 3).defaultTo('ZAR');
      table.enum('method', ['cash', 'bank_transfer', 'mobile_money', 'credit_card', 'debit_card', 'eft']).notNullable();
      table.enum('status', ['pending', 'completed', 'failed', 'refunded']).defaultTo('pending');
      table.json('gatewayResponse');
      table.timestamps(true, true);
      
      table.index('orderId');
      table.index('transactionId');
      table.foreign('orderId').references('id').inTable('orders').onDelete('CASCADE');
    })

    // Carts Table (FR-010, FR-011)
    .createTable('carts', table => {
      table.string('id', 36).primary();
      table.string('userId', 36).notNullable().unique();
      table.json('items');
      table.timestamp('updatedAt');
      
      table.index('userId');
      table.foreign('userId').references('id').inTable('users').onDelete('CASCADE');
    })

    // ========== PRODUCTION TABLES (FR-004, FR-005, FR-006) ==========
    
    // Production Cycles Table (FR-004)
    .createTable('productionCycles', table => {
      table.string('id', 36).primary();
      table.string('cycleName', 100).notNullable();
      table.enum('productionType', ['Broiler Cycle', 'Egg Production', 'Hatching']).defaultTo('Broiler Cycle');
      table.integer('expectedBirds').notNullable();
      table.integer('actualBirds');
      table.date('startDate').notNullable();
      table.date('expectedEndDate').notNullable();
      table.date('actualEndDate');
      table.enum('status', ['Planned', 'Approved', 'In Progress', 'Completed', 'Cancelled']).defaultTo('Planned');
      table.string('createdBy', 36);
      table.string('approvedBy', 36);
      table.timestamp('approvedAt');
      table.timestamps(true, true);
      
      table.index('status');
      table.index('productionType');
      table.foreign('createdBy').references('id').inTable('users').onDelete('SET NULL');
      table.foreign('approvedBy').references('id').inTable('users').onDelete('SET NULL');
    })

    // Daily Logs Table (FR-005)
    .createTable('dailyLogs', table => {
      table.string('id', 36).primary();
      table.string('cycle', 36).notNullable();
      table.date('date').notNullable();
      table.integer('birdCount').notNullable();
      table.json('mortality');
      table.json('feedConsumption');
      table.text('issues');
      table.string('recordedBy', 36);
      table.timestamps(true, true);
      
      table.index('cycle');
      table.index('date');
      table.foreign('cycle').references('id').inTable('productionCycles').onDelete('CASCADE');
      table.foreign('recordedBy').references('id').inTable('users').onDelete('SET NULL');
    })

    // Medications Table (FR-006)
    .createTable('medications', table => {
      table.string('id', 36).primary();
      table.string('cycle', 36).notNullable();
      table.string('medicationName', 255).notNullable();
      table.string('dosage', 255);
      table.date('date').notNullable();
      table.enum('status', ['Active', 'Completed', 'Cancelled', 'Scheduled']).defaultTo('Scheduled');
      table.string('administeredBy', 36);
      table.date('expiryDate');
      table.string('medicationType', 100);
      table.text('notes');
      table.timestamp('completedAt');
      table.text('cancellationReason');
      table.timestamp('cancelledAt');
      table.timestamps(true, true);
      
      table.index('cycle');
      table.index('status');
      table.foreign('cycle').references('id').inTable('productionCycles').onDelete('CASCADE');
      table.foreign('administeredBy').references('id').inTable('users').onDelete('SET NULL');
    })

    // Health Checks Table
    .createTable('healthChecks', table => {
      table.string('id', 36).primary();
      table.string('cycle', 36).notNullable();
      table.date('date').notNullable();
      table.enum('overallHealth', ['Excellent', 'Good', 'Fair', 'Poor', 'Critical']).defaultTo('Good');
      table.integer('birdsChecked').defaultTo(0);
      table.string('inspectedBy', 36);
      table.text('notes');
      table.timestamps(true, true);
      
      table.index('cycle');
      table.index('date');
      table.foreign('cycle').references('id').inTable('productionCycles').onDelete('CASCADE');
      table.foreign('inspectedBy').references('id').inTable('users').onDelete('SET NULL');
    })

    // Vaccinations Table (FR-006)
    .createTable('vaccinations', table => {
      table.string('id', 36).primary();
      table.string('cycle', 36).notNullable();
      table.string('vaccineName', 255).notNullable();
      table.date('scheduledDate').notNullable();
      table.string('dosage', 255);
      table.enum('status', ['Scheduled', 'Completed', 'Cancelled']).defaultTo('Scheduled');
      table.date('completedDate');
      table.string('completedBy', 36);
      table.string('createdBy', 36);
      table.timestamps(true, true);
      
      table.index('cycle');
      table.index('status');
      table.index('scheduledDate');
      table.foreign('cycle').references('id').inTable('productionCycles').onDelete('CASCADE');
      table.foreign('completedBy').references('id').inTable('users').onDelete('SET NULL');
      table.foreign('createdBy').references('id').inTable('users').onDelete('SET NULL');
    })

    // Weight Records Table
    .createTable('weightRecords', table => {
      table.string('id', 36).primary();
      table.string('cycle', 36).notNullable();
      table.date('date').notNullable();
      table.decimal('averageWeight', 5, 2).notNullable();
      table.integer('sampleSize').defaultTo(1);
      table.string('recordedBy', 36);
      table.timestamps(true, true);
      
      table.index('cycle');
      table.index('date');
      table.foreign('cycle').references('id').inTable('productionCycles').onDelete('CASCADE');
      table.foreign('recordedBy').references('id').inTable('users').onDelete('SET NULL');
    })

    // Feed Records Table (FR-005)
    .createTable('feedRecords', table => {
      table.string('id', 36).primary();
      table.string('cycle', 36).notNullable();
      table.date('date').notNullable();
      table.string('feedType', 100).notNullable();
      table.decimal('quantityKg', 8, 2).notNullable();
      table.string('recordedBy', 36);
      table.timestamps(true, true);
      
      table.index('cycle');
      table.index('date');
      table.foreign('cycle').references('id').inTable('productionCycles').onDelete('CASCADE');
      table.foreign('recordedBy').references('id').inTable('users').onDelete('SET NULL');
    })

    // Environment Records Table (FR-005)
    .createTable('environmentRecords', table => {
      table.string('id', 36).primary();
      table.string('cycle', 36).notNullable();
      table.date('date').notNullable();
      table.decimal('temperature', 5, 1).notNullable();
      table.decimal('humidity', 5, 1);
      table.text('notes');
      table.string('recordedBy', 36);
      table.timestamps(true, true);
      
      table.index('cycle');
      table.index('date');
      table.foreign('cycle').references('id').inTable('productionCycles').onDelete('CASCADE');
      table.foreign('recordedBy').references('id').inTable('users').onDelete('SET NULL');
    })

    // ========== PROCESSING TABLES (FR-007) ==========
    
    // Harvest Batches Table
    .createTable('harvestBatches', table => {
      table.string('id', 36).primary();
      table.string('cycle', 36).notNullable();
      table.string('batchNumber', 100).notNullable();
      table.date('harvestDate').notNullable();
      table.integer('birdCount').notNullable();
      table.decimal('totalWeight', 10, 2);
      table.string('status', 50).defaultTo('Pending');
      table.string('processedBy', 36);
      table.timestamps(true, true);
      
      table.index('cycle');
      table.index('batchNumber');
      table.foreign('cycle').references('id').inTable('productionCycles').onDelete('CASCADE');
      table.foreign('processedBy').references('id').inTable('users').onDelete('SET NULL');
    })

    // Processing Steps Table
    .createTable('processingSteps', table => {
      table.string('id', 36).primary();
      table.string('harvestBatch', 36).notNullable();
      table.string('stepName', 100).notNullable();
      table.integer('stepOrder').notNullable();
      table.string('status', 50).defaultTo('Pending');
      table.string('assignedTo', 36);
      table.timestamp('startedAt');
      table.timestamp('completedAt');
      table.timestamps(true, true);
      
      table.index('harvestBatch');
      table.foreign('harvestBatch').references('id').inTable('harvestBatches').onDelete('CASCADE');
      table.foreign('assignedTo').references('id').inTable('users').onDelete('SET NULL');
    })

    // Processing Batches Table
    .createTable('processingBatches', table => {
      table.string('id', 36).primary();
      table.string('harvestBatch', 36).notNullable();
      table.string('batchNumber', 100).notNullable();
      table.string('productType', 100).notNullable();
      table.integer('quantity').notNullable();
      table.decimal('weight', 8, 2);
      table.string('storageLocation', 100);
      table.string('status', 50).defaultTo('Processing');
      table.timestamps(true, true);
      
      table.index('harvestBatch');
      table.index('batchNumber');
      table.foreign('harvestBatch').references('id').inTable('harvestBatches').onDelete('CASCADE');
    })

    // Yield Records Table
    .createTable('yieldRecords', table => {
      table.string('id', 36).primary();
      table.string('harvestBatch', 36).notNullable();
      table.string('productType', 100).notNullable();
      table.integer('quantity').notNullable();
      table.decimal('weight', 8, 2);
      table.decimal('yieldPercentage', 5, 2);
      table.timestamps(true, true);
      
      table.index('harvestBatch');
      table.foreign('harvestBatch').references('id').inTable('harvestBatches').onDelete('CASCADE');
    })

    // Processing Quality Checks Table
    .createTable('processingQualityChecks', table => {
      table.string('id', 36).primary();
      table.string('processingBatch', 36).notNullable();
      table.string('checkType', 100).notNullable();
      table.string('result', 50).notNullable();
      table.string('checkedBy', 36);
      table.text('notes');
      table.timestamps(true, true);
      
      table.index('processingBatch');
      table.foreign('processingBatch').references('id').inTable('processingBatches').onDelete('CASCADE');
      table.foreign('checkedBy').references('id').inTable('users').onDelete('SET NULL');
    })

    // Processing Staff Table
    .createTable('processingStaff', table => {
      table.string('id', 36).primary();
      table.string('harvestBatch', 36).notNullable();
      table.string('userId', 36).notNullable();
      table.string('role', 100);
      table.timestamp('assignedAt');
      table.timestamps(true, true);
      
      table.index('harvestBatch');
      table.index('userId');
      table.foreign('harvestBatch').references('id').inTable('harvestBatches').onDelete('CASCADE');
      table.foreign('userId').references('id').inTable('users').onDelete('CASCADE');
    })

    // ========== INVENTORY TABLES (FR-008, FR-009) ==========
    
    .createTable('inventory', table => {
      table.string('id', 36).primary();
      table.string('cycle', 36);
      table.string('productType', 100).notNullable();
      table.integer('quantity').notNullable();
      table.decimal('weight', 8, 2);
      table.string('batchNumber', 100).notNullable();
      table.date('harvestDate').notNullable();
      table.date('expiryDate').notNullable();
      table.string('storageLocation', 100).notNullable();
      table.decimal('pricePerUnit', 10, 2).notNullable();
      table.enum('status', ['available', 'reserved', 'sold', 'expired', 'damaged', 'transferred']).defaultTo('available');
      table.string('transferredFrom', 36);
      table.text('transferReason');
      table.string('createdBy', 36);
      table.timestamps(true, true);
      
      table.index('cycle');
      table.index('status');
      table.index('expiryDate');
      table.index('batchNumber');
      table.foreign('cycle').references('id').inTable('productionCycles').onDelete('SET NULL');
      table.foreign('createdBy').references('id').inTable('users').onDelete('SET NULL');
    })

    // ========== CRM TABLES (FR-016) ==========
    
    // Customer Profiles Table
    .createTable('customerProfiles', table => {
      table.string('id', 36).primary();
      table.string('userId', 36).notNullable().unique();
      table.string('firstName', 100).notNullable();
      table.string('lastName', 100).notNullable();
      table.string('email', 255).notNullable();
      table.string('phone', 20);
      table.string('userType', 50).defaultTo('Consumer');
      table.json('address');
      table.json('preferences');
      table.json('stats');
      table.json('loyalty');
      table.json('lifetimeValue');
      table.string('segment', 50).defaultTo('New');
      table.json('notes');
      table.timestamps(true, true);
      
      table.index('userId');
      table.index('segment');
      table.foreign('userId').references('id').inTable('users').onDelete('CASCADE');
    })

    // Loyalty Programs Table
    .createTable('loyaltyPrograms', table => {
      table.string('id', 36).primary();
      table.string('name', 255).notNullable();
      table.text('description');
      table.json('tiers');
      table.decimal('pointsPerRand', 5, 2).defaultTo(0.1);
      table.json('rewards');
      table.boolean('active').defaultTo(true);
      table.timestamps(true, true);
      
      table.index('active');
    })

    // Customer Enrollments Table
    .createTable('customerEnrollments', table => {
      table.string('id', 36).primary();
      table.string('customerId', 36).notNullable();
      table.string('userId', 36).notNullable();
      table.string('programId', 36).notNullable();
      table.string('tier', 50).defaultTo('Bronze');
      table.integer('points').defaultTo(0);
      table.timestamp('enrolledAt');
      table.boolean('active').defaultTo(true);
      table.timestamps(true, true);
      
      table.index('customerId');
      table.index('userId');
      table.index('programId');
      table.index('active');
      table.foreign('customerId').references('id').inTable('customerProfiles').onDelete('CASCADE');
      table.foreign('userId').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('programId').references('id').inTable('loyaltyPrograms').onDelete('CASCADE');
    })

    // Points Transactions Table
    .createTable('pointsTransactions', table => {
      table.string('id', 36).primary();
      table.string('userId', 36).notNullable();
      table.integer('amount').notNullable();
      table.enum('type', ['earned', 'redeemed', 'adjusted']).notNullable();
      table.string('reference', 100);
      table.timestamps(true, true);
      
      table.index('userId');
      table.index('type');
      table.foreign('userId').references('id').inTable('users').onDelete('CASCADE');
    })

    // Feedback/Complaints Table
    .createTable('feedbackComplaints', table => {
      table.string('id', 36).primary();
      table.string('customerId', 36).notNullable();
      table.string('userId', 36).notNullable();
      table.string('customerName', 255).defaultTo('Anonymous');
      table.enum('type', ['feedback', 'complaint', 'suggestion', 'inquiry']).notNullable();
      table.string('category', 100).defaultTo('General');
      table.string('subject', 255).notNullable();
      table.text('message').notNullable();
      table.integer('rating');
      table.string('orderId', 36);
      table.enum('status', ['Open', 'Responded', 'Resolved']).defaultTo('Open');
      table.enum('priority', ['Low', 'Medium', 'High', 'Urgent']).defaultTo('Medium');
      table.text('response');
      table.string('respondedBy', 36);
      table.timestamp('respondedAt');
      table.timestamp('resolvedAt');
      table.timestamps(true, true);
      
      table.index('customerId');
      table.index('status');
      table.index('priority');
      table.foreign('customerId').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('userId').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('orderId').references('id').inTable('orders').onDelete('SET NULL');
      table.foreign('respondedBy').references('id').inTable('users').onDelete('SET NULL');
    })

    // Promotional Campaigns Table
    .createTable('promotionalCampaigns', table => {
      table.string('id', 36).primary();
      table.string('name', 255).notNullable();
      table.text('description');
      table.enum('type', ['discount', 'promotion', 'newsletter', 'announcement']).notNullable();
      table.enum('channel', ['email', 'sms', 'both']).notNullable();
      table.string('subject', 255);
      table.text('content');
      table.string('targetAudience', 100).defaultTo('all');
      table.json('targetCriteria');
      table.decimal('discount', 5, 2).defaultTo(0);
      table.enum('discountType', ['percentage', 'fixed']).defaultTo('percentage');
      table.date('startDate');
      table.date('endDate');
      table.enum('status', ['Draft', 'Active', 'Paused', 'Completed']).defaultTo('Draft');
      table.json('stats');
      table.string('createdBy', 36);
      table.timestamps(true, true);
      
      table.index('status');
      table.index('type');
      table.foreign('createdBy').references('id').inTable('users').onDelete('SET NULL');
    })

    // ========== COMPLIANCE TABLES (FR-020, FR-021) ==========
    
    // Quality Checks Table
    .createTable('qualityChecks', table => {
      table.string('id', 36).primary();
      table.string('batchNumber', 100);
      table.string('checkType', 100).notNullable();
      table.string('result', 50).notNullable();
      table.decimal('score', 5, 2);
      table.string('inspectedBy', 36);
      table.text('notes');
      table.enum('status', ['Pending', 'Passed', 'Failed']).defaultTo('Pending');
      table.timestamps(true, true);
      
      table.index('batchNumber');
      table.index('status');
      table.foreign('inspectedBy').references('id').inTable('users').onDelete('SET NULL');
    })

    // Compliance Records Table
    .createTable('complianceRecords', table => {
      table.string('id', 36).primary();
      table.string('type', 100).notNullable();
      table.string('status', 50).defaultTo('Active');
      table.date('expiryDate');
      table.text('notes');
      table.string('documentUrl', 500);
      table.timestamps(true, true);
      
      table.index('type');
      table.index('status');
    })

    // Audits Table
    .createTable('audits', table => {
      table.string('id', 36).primary();
      table.string('userId', 36);
      table.string('action', 100).notNullable();
      table.string('entity', 100).notNullable();
      table.string('entityId', 36);
      table.json('oldValue');
      table.json('newValue');
      table.string('ipAddress', 45);
      table.timestamps(true, true);
      
      table.index('userId');
      table.index('entity');
      table.foreign('userId').references('id').inTable('users').onDelete('SET NULL');
    })

    // ========== SYSTEM TABLES (FR-022, FR-023) ==========
    
    // System Config Table
    .createTable('systemConfig', table => {
      table.string('id', 36).primary();
      table.string('key', 100).notNullable().unique();
      table.json('value');
      table.string('updatedBy', 36);
      table.timestamps(true, true);
      
      table.index('key');
      table.foreign('updatedBy').references('id').inTable('users').onDelete('SET NULL');
    })

    // Notification Configs Table
    .createTable('notificationConfigs', table => {
      table.string('id', 36).primary();
      table.string('type', 100).notNullable();
      table.boolean('emailEnabled').defaultTo(true);
      table.boolean('smsEnabled').defaultTo(false);
      table.boolean('pushEnabled').defaultTo(false);
      table.json('templates');
      table.timestamps(true, true);
      
      table.index('type');
    })

    // System Logs Table
    .createTable('systemLogs', table => {
      table.string('id', 36).primary();
      table.string('level', 20).notNullable();
      table.string('message', 500).notNullable();
      table.json('metadata');
      table.string('userId', 36);
      table.timestamps(true, true);
      
      table.index('level');
      table.foreign('userId').references('id').inTable('users').onDelete('SET NULL');
    })

    // API Keys Table
    .createTable('apiKeys', table => {
      table.string('id', 36).primary();
      table.string('name', 100).notNullable();
      table.string('key', 255).notNullable().unique();
      table.string('userId', 36);
      table.boolean('active').defaultTo(true);
      table.timestamp('expiresAt');
      table.timestamps(true, true);
      
      table.index('key');
      table.index('userId');
      table.foreign('userId').references('id').inTable('users').onDelete('CASCADE');
    })

    // Employees Table
    .createTable('employees', table => {
      table.string('id', 36).primary();
      table.string('userId', 36).notNullable();
      table.string('employeeNumber', 50).notNullable();
      table.string('department', 100);
      table.string('position', 100);
      table.date('hireDate');
      table.enum('status', ['active', 'inactive', 'terminated']).defaultTo('active');
      table.timestamps(true, true);
      
      table.index('userId');
      table.index('employeeNumber');
      table.index('status');
      table.foreign('userId').references('id').inTable('users').onDelete('CASCADE');
    })

    // Notifications Table
    .createTable('notifications', table => {
      table.string('id', 36).primary();
      table.string('userId', 36).notNullable();
      table.string('type', 100).notNullable();
      table.string('title', 255).notNullable();
      table.text('message');
      table.boolean('read').defaultTo(false);
      table.json('data');
      table.timestamps(true, true);
      
      table.index('userId');
      table.index('read');
      table.index('type');
      table.foreign('userId').references('id').inTable('users').onDelete('CASCADE');
    })

    // Password Resets Table
    .createTable('passwordResets', table => {
      table.string('id', 36).primary();
      table.string('userId', 36).notNullable();
      table.string('token', 255).notNullable();
      table.timestamp('expiresAt').notNullable();
      table.boolean('used').defaultTo(false);
      table.timestamps(true, true);
      
      table.index('userId');
      table.index('token');
      table.foreign('userId').references('id').inTable('users').onDelete('CASCADE');
    })

    // Contact Messages Table
    .createTable('contactMessages', table => {
      table.string('id', 36).primary();
      table.string('name', 255).notNullable();
      table.string('email', 255).notNullable();
      table.string('subject', 255);
      table.text('message').notNullable();
      table.enum('status', ['new', 'read', 'replied']).defaultTo('new');
      table.text('reply');
      table.string('repliedBy', 36);
      table.timestamp('repliedAt');
      table.timestamps(true, true);
      
      table.index('status');
      table.foreign('repliedBy').references('id').inTable('users').onDelete('SET NULL');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('contactMessages')
    .dropTableIfExists('passwordResets')
    .dropTableIfExists('notifications')
    .dropTableIfExists('employees')
    .dropTableIfExists('apiKeys')
    .dropTableIfExists('systemLogs')
    .dropTableIfExists('notificationConfigs')
    .dropTableIfExists('systemConfig')
    .dropTableIfExists('audits')
    .dropTableIfExists('complianceRecords')
    .dropTableIfExists('qualityChecks')
    .dropTableIfExists('promotionalCampaigns')
    .dropTableIfExists('feedbackComplaints')
    .dropTableIfExists('pointsTransactions')
    .dropTableIfExists('customerEnrollments')
    .dropTableIfExists('loyaltyPrograms')
    .dropTableIfExists('customerProfiles')
    .dropTableIfExists('inventory')
    .dropTableIfExists('processingStaff')
    .dropTableIfExists('processingQualityChecks')
    .dropTableIfExists('yieldRecords')
    .dropTableIfExists('processingBatches')
    .dropTableIfExists('processingSteps')
    .dropTableIfExists('harvestBatches')
    .dropTableIfExists('environmentRecords')
    .dropTableIfExists('feedRecords')
    .dropTableIfExists('weightRecords')
    .dropTableIfExists('vaccinations')
    .dropTableIfExists('healthChecks')
    .dropTableIfExists('medications')
    .dropTableIfExists('dailyLogs')
    .dropTableIfExists('productionCycles')
    .dropTableIfExists('carts')
    .dropTableIfExists('payments')
    .dropTableIfExists('orders')
    .dropTableIfExists('products')
    .dropTableIfExists('users');
};
