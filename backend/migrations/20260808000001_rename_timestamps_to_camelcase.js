exports.up = async function(knex) {
  const tablesToRename = [
    'apiKeys', 'audits', 'complianceRecords', 'contactMessages',
    'customerEnrollments', 'customerProfiles', 'dailyLogs', 'employees',
    'environmentRecords', 'feedbackComplaints', 'feedRecords',
    'harvestBatches', 'healthChecks', 'inventory', 'loyaltyPrograms',
    'medications', 'notificationConfigs', 'notifications', 'orders',
    'passwordResets', 'payments', 'pointsTransactions',
    'processingBatches', 'processingQualityChecks', 'processingStaff',
    'processingSteps', 'productionCycles', 'products',
    'promotionalCampaigns', 'qualityChecks', 'systemConfig',
    'systemLogs', 'vaccinations', 'weightRecords', 'yieldRecords'
  ];

  for (const table of tablesToRename) {
    const hasCreatedAt = await knex.schema.hasColumn(table, 'created_at');
    const hasUpdatedAt = await knex.schema.hasColumn(table, 'updated_at');

    if (hasCreatedAt) {
      await knex.schema.alterTable(table, (builder) => {
        builder.renameColumn('created_at', 'createdAt');
      });
    }
    if (hasUpdatedAt) {
      await knex.schema.alterTable(table, (builder) => {
        builder.renameColumn('updated_at', 'updatedAt');
      });
    }
  }

  const usersHasCreatedAt = await knex.schema.hasColumn('users', 'created_at');
  const usersHasUpdatedAt = await knex.schema.hasColumn('users', 'updated_at');
  if (usersHasCreatedAt) {
    await knex.schema.alterTable('users', (builder) => {
      builder.dropColumn('created_at');
    });
  }
  if (usersHasUpdatedAt) {
    await knex.schema.alterTable('users', (builder) => {
      builder.dropColumn('updated_at');
    });
  }
  const usersHasCamelCreated = await knex.schema.hasColumn('users', 'createdAt');
  const usersHasCamelUpdated = await knex.schema.hasColumn('users', 'updatedAt');
  if (!usersHasCamelCreated) {
    await knex.schema.alterTable('users', (builder) => {
      builder.timestamp('createdAt').defaultTo(knex.fn.now());
    });
  }
  if (!usersHasCamelUpdated) {
    await knex.schema.alterTable('users', (builder) => {
      builder.timestamp('updatedAt').defaultTo(knex.fn.now());
    });
  }
};

exports.down = async function(knex) {
  const tables = [
    'apiKeys', 'audits', 'complianceRecords', 'contactMessages',
    'customerEnrollments', 'customerProfiles', 'dailyLogs', 'employees',
    'environmentRecords', 'feedbackComplaints', 'feedRecords',
    'harvestBatches', 'healthChecks', 'inventory', 'loyaltyPrograms',
    'medications', 'notificationConfigs', 'notifications', 'orders',
    'passwordResets', 'payments', 'pointsTransactions',
    'processingBatches', 'processingQualityChecks', 'processingStaff',
    'processingSteps', 'productionCycles', 'products',
    'promotionalCampaigns', 'qualityChecks', 'systemConfig',
    'systemLogs', 'vaccinations', 'weightRecords', 'yieldRecords'
  ];

  for (const table of tables) {
    const hasCreatedAt = await knex.schema.hasColumn(table, 'createdAt');
    const hasUpdatedAt = await knex.schema.hasColumn(table, 'updatedAt');
    if (hasCreatedAt) {
      await knex.schema.alterTable(table, (builder) => {
        builder.renameColumn('createdAt', 'created_at');
      });
    }
    if (hasUpdatedAt) {
      await knex.schema.alterTable(table, (builder) => {
        builder.renameColumn('updatedAt', 'updated_at');
      });
    }
  }
};
