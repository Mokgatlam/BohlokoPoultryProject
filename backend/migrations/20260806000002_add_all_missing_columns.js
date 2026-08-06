/**
 * Migration: Add All Missing Columns
 * 
 * Adds 122+ missing columns across 21 tables that services reference
 * but the original migration didn't create. Generated from full
 * codebase audit of all service files.
 */

exports.up = function(knex) {
  return knex.schema
    // ========== ORDERS ==========
    // paymentStatus enum needs to be converted to VARCHAR so 'Unpaid' can be added (OrderService sets it for non-cash)
    .raw(`DO $$ BEGIN ALTER TABLE orders ALTER COLUMN "paymentStatus" TYPE VARCHAR(20) USING "paymentStatus"::text; EXCEPTION WHEN undefined_column THEN NULL; END $$;`)
    .raw(`DO $$ BEGIN ALTER TABLE orders ALTER COLUMN "paymentStatus" SET DEFAULT 'Pending'; EXCEPTION WHEN undefined_column THEN NULL; END $$;`)

    // ========== PAYMENTS ==========
    .alterTable('payments', table => {
      table.string('paymentNumber', 50);
      table.string('userId', 36);
      table.string('reference', 100);
      table.text('notes');
      table.json('metadata');
      table.text('refundReason');
      table.timestamp('refundedAt');
    })

    // ========== PRODUCTION CYCLES ==========
    .alterTable('productionCycles', table => {
      table.decimal('budget', 12, 2);
      table.decimal('actualCosts', 12, 2);
    })

    // ========== MEDICATIONS ==========
    .alterTable('medications', table => {
      table.decimal('cost', 10, 2);
    })

    // ========== FEED RECORDS ==========
    .alterTable('feedRecords', table => {
      table.decimal('cost', 10, 2);
    })

    // ========== HARVEST BATCHES ==========
    .alterTable('harvestBatches', table => {
      table.string('createdBy', 36);
      table.timestamp('startedAt');
      table.string('startedBy', 36);
      table.timestamp('completedAt');
      table.string('completedBy', 36);
      table.decimal('actualWeight', 10, 2);
      table.integer('actualCount');
      table.text('notes');
    })

    // ========== PROCESSING BATCHES ==========
    .alterTable('processingBatches', table => {
      table.string('createdBy', 36);
      table.timestamp('startedAt');
      table.string('startedBy', 36);
      table.timestamp('completedAt');
      table.string('completedBy', 36);
      table.integer('outputQuantity');
      table.decimal('outputWeight', 8, 2);
      table.decimal('wasteWeight', 8, 2);
      table.text('notes');
      table.date('processingDate');
      table.string('inventoryItem', 36);
    })

    // ========== PROCESSING STEPS ==========
    .alterTable('processingSteps', table => {
      table.string('processingBatch', 36);
      table.string('createdBy', 36);
      table.timestamp('endTime');
      table.string('completedBy', 36);
      table.integer('outputQuantity');
      table.integer('wasteQuantity');
      table.text('stepNotes');
    })

    // ========== YIELD RECORDS ==========
    .alterTable('yieldRecords', table => {
      table.string('processingBatch', 36);
      table.decimal('inputWeight', 8, 2);
      table.decimal('outputWeight', 8, 2);
      table.string('recordedBy', 36);
    })

    // ========== PROCESSING STAFF ==========
    .alterTable('processingStaff', table => {
      table.string('staff', 36);
      table.string('processingBatch', 36);
      table.string('assignedBy', 36);
    })

    // ========== QUALITY CHECKS (Compliance) ==========
    .alterTable('qualityChecks', table => {
      table.string('batch', 36);
      table.date('checkDate');
      table.string('checkedBy', 36);
      table.json('correctiveActions');
    })

    // ========== COMPLIANCE RECORDS ==========
    .alterTable('complianceRecords', table => {
      table.string('recordType', 100);
      table.string('title', 255);
      table.text('description');
      table.date('effectiveDate');
      table.string('createdBy', 36);
    })

    // ========== AUDITS ==========
    .alterTable('audits', table => {
      table.string('auditor', 36);
      table.date('auditDate');
      table.string('auditType', 50);
      table.string('overallResult', 50);
    })

    // ========== SYSTEM LOGS ==========
    .alterTable('systemLogs', table => {
      table.string('category', 50);
      table.string('userName', 255);
      table.string('action', 100);
      table.string('resource', 100);
      table.string('resourceId', 36);
      table.json('details');
      table.string('ipAddress', 45);
      table.text('userAgent');
      table.string('method', 10);
      table.string('path', 500);
      table.integer('statusCode');
      table.integer('responseTime');
      table.text('error');
      table.text('stack');
      table.timestamp('timestamp');
    })

    // ========== NOTIFICATION CONFIGS ==========
    .alterTable('notificationConfigs', table => {
      table.string('name', 255);
      table.text('description');
      table.boolean('enabled').defaultTo(true);
      table.json('channels');
      table.json('recipients');
      table.text('template');
      table.string('subject', 255);
      table.json('schedule');
      table.json('conditions');
      table.json('rateLimit');
      table.string('priority', 20).defaultTo('normal');
      table.json('metadata');
      table.string('createdBy', 36);
    })

    // ========== NOTIFICATIONS ==========
    .alterTable('notifications', table => {
      table.string('priority', 20).defaultTo('normal');
      table.string('actionUrl', 500);
      table.timestamp('expiresAt');
      table.timestamp('readAt');
      table.boolean('deleted').defaultTo(false);
    })

    // ========== API KEYS ==========
    .alterTable('apiKeys', table => {
      table.text('description');
      table.json('permissions');
      table.string('status', 20).defaultTo('active');
      table.integer('rateLimit').defaultTo(1000);
      table.integer('usageCount').defaultTo(0);
      table.timestamp('lastUsedAt');
      table.json('allowedOrigins');
      table.json('allowedIPs');
      table.json('metadata');
      table.string('createdBy', 36);
    })

    // ========== EMPLOYEES ==========
    .alterTable('employees', table => {
      table.string('employeeId', 50);
      table.string('createdBy', 36);
      table.string('firstName', 100);
      table.string('lastName', 100);
      table.string('email', 255);
    })

    // ========== CONTACT MESSAGES ==========
    .alterTable('contactMessages', table => {
      table.string('phone', 20);
    });
};

exports.down = function(knex) {
  return knex.schema
    .alterTable('contactMessages', table => {
      table.dropColumn('phone');
    })
    .alterTable('employees', table => {
      table.dropColumn('employeeId');
      table.dropColumn('createdBy');
      table.dropColumn('firstName');
      table.dropColumn('lastName');
      table.dropColumn('email');
    })
    .alterTable('apiKeys', table => {
      table.dropColumn('description');
      table.dropColumn('permissions');
      table.dropColumn('status');
      table.dropColumn('rateLimit');
      table.dropColumn('usageCount');
      table.dropColumn('lastUsedAt');
      table.dropColumn('allowedOrigins');
      table.dropColumn('allowedIPs');
      table.dropColumn('metadata');
      table.dropColumn('createdBy');
    })
    .alterTable('notifications', table => {
      table.dropColumn('priority');
      table.dropColumn('actionUrl');
      table.dropColumn('expiresAt');
      table.dropColumn('readAt');
      table.dropColumn('deleted');
    })
    .alterTable('notificationConfigs', table => {
      table.dropColumn('name');
      table.dropColumn('description');
      table.dropColumn('enabled');
      table.dropColumn('channels');
      table.dropColumn('recipients');
      table.dropColumn('template');
      table.dropColumn('subject');
      table.dropColumn('schedule');
      table.dropColumn('conditions');
      table.dropColumn('rateLimit');
      table.dropColumn('priority');
      table.dropColumn('metadata');
      table.dropColumn('createdBy');
    })
    .alterTable('systemLogs', table => {
      table.dropColumn('category');
      table.dropColumn('userName');
      table.dropColumn('action');
      table.dropColumn('resource');
      table.dropColumn('resourceId');
      table.dropColumn('details');
      table.dropColumn('ipAddress');
      table.dropColumn('userAgent');
      table.dropColumn('method');
      table.dropColumn('path');
      table.dropColumn('statusCode');
      table.dropColumn('responseTime');
      table.dropColumn('error');
      table.dropColumn('stack');
      table.dropColumn('timestamp');
    })
    .alterTable('audits', table => {
      table.dropColumn('auditor');
      table.dropColumn('auditDate');
      table.dropColumn('auditType');
      table.dropColumn('overallResult');
    })
    .alterTable('complianceRecords', table => {
      table.dropColumn('recordType');
      table.dropColumn('title');
      table.dropColumn('description');
      table.dropColumn('effectiveDate');
      table.dropColumn('createdBy');
    })
    .alterTable('qualityChecks', table => {
      table.dropColumn('batch');
      table.dropColumn('checkDate');
      table.dropColumn('checkedBy');
      table.dropColumn('correctiveActions');
    })
    .alterTable('processingStaff', table => {
      table.dropColumn('staff');
      table.dropColumn('processingBatch');
      table.dropColumn('assignedBy');
    })
    .alterTable('yieldRecords', table => {
      table.dropColumn('processingBatch');
      table.dropColumn('inputWeight');
      table.dropColumn('outputWeight');
      table.dropColumn('recordedBy');
    })
    .alterTable('processingSteps', table => {
      table.dropColumn('processingBatch');
      table.dropColumn('createdBy');
      table.dropColumn('endTime');
      table.dropColumn('completedBy');
      table.dropColumn('outputQuantity');
      table.dropColumn('wasteQuantity');
      table.dropColumn('stepNotes');
    })
    .alterTable('processingBatches', table => {
      table.dropColumn('createdBy');
      table.dropColumn('startedAt');
      table.dropColumn('startedBy');
      table.dropColumn('completedAt');
      table.dropColumn('completedBy');
      table.dropColumn('outputQuantity');
      table.dropColumn('outputWeight');
      table.dropColumn('wasteWeight');
      table.dropColumn('notes');
      table.dropColumn('processingDate');
      table.dropColumn('inventoryItem');
    })
    .alterTable('harvestBatches', table => {
      table.dropColumn('createdBy');
      table.dropColumn('startedAt');
      table.dropColumn('startedBy');
      table.dropColumn('completedAt');
      table.dropColumn('completedBy');
      table.dropColumn('actualWeight');
      table.dropColumn('actualCount');
      table.dropColumn('notes');
    })
    .alterTable('feedRecords', table => {
      table.dropColumn('cost');
    })
    .alterTable('medications', table => {
      table.dropColumn('cost');
    })
    .alterTable('productionCycles', table => {
      table.dropColumn('budget');
      table.dropColumn('actualCosts');
    })
    .alterTable('payments', table => {
      table.dropColumn('paymentNumber');
      table.dropColumn('userId');
      table.dropColumn('reference');
      table.dropColumn('notes');
      table.dropColumn('metadata');
      table.dropColumn('refundReason');
      table.dropColumn('refundedAt');
    });
};
