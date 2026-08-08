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
      await knex.raw('ALTER TABLE `' + table + '` CHANGE `created_at` `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP');
    }
    if (hasUpdatedAt) {
      await knex.raw('ALTER TABLE `' + table + '` CHANGE `updated_at` `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    }
  }

  // Users table: drop old snake_case columns (already has camelCase from first migration attempt)
  const usersHasCreatedAt = await knex.schema.hasColumn('users', 'created_at');
  const usersHasUpdatedAt = await knex.schema.hasColumn('users', 'updated_at');
  if (usersHasCreatedAt) {
    await knex.raw('ALTER TABLE `users` DROP COLUMN `created_at`');
  }
  if (usersHasUpdatedAt) {
    await knex.raw('ALTER TABLE `users` DROP COLUMN `updated_at`');
  }
  // Ensure users has camelCase columns
  const usersHasCamelCreated = await knex.schema.hasColumn('users', 'createdAt');
  const usersHasCamelUpdated = await knex.schema.hasColumn('users', 'updatedAt');
  if (!usersHasCamelCreated) {
    await knex.raw('ALTER TABLE `users` ADD COLUMN `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP');
  }
  if (!usersHasCamelUpdated) {
    await knex.raw('ALTER TABLE `users` ADD COLUMN `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
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
    'systemLogs', 'users', 'vaccinations', 'weightRecords', 'yieldRecords'
  ];

  for (const table of tables) {
    const hasCreatedAt = await knex.schema.hasColumn(table, 'createdAt');
    const hasUpdatedAt = await knex.schema.hasColumn(table, 'updatedAt');
    if (hasCreatedAt) {
      await knex.raw('ALTER TABLE `' + table + '` CHANGE `createdAt` `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP');
    }
    if (hasUpdatedAt) {
      await knex.raw('ALTER TABLE `' + table + '` CHANGE `updatedAt` `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    }
  }
};
