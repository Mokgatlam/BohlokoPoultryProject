const Datastore = require('nedb-promises');
const path = require('path');

const db = {
  users: Datastore.create({ filename: path.join(__dirname, '../data/users.db'), autoload: true }),
  productionCycles: Datastore.create({ filename: path.join(__dirname, '../data/productionCycles.db'), autoload: true }),
  dailyLogs: Datastore.create({ filename: path.join(__dirname, '../data/dailyLogs.db'), autoload: true }),
  medications: Datastore.create({ filename: path.join(__dirname, '../data/medications.db'), autoload: true }),
  healthChecks: Datastore.create({ filename: path.join(__dirname, '../data/healthChecks.db'), autoload: true }),
  vaccinations: Datastore.create({ filename: path.join(__dirname, '../data/vaccinations.db'), autoload: true }),
  weightRecords: Datastore.create({ filename: path.join(__dirname, '../data/weightRecords.db'), autoload: true }),
  feedRecords: Datastore.create({ filename: path.join(__dirname, '../data/feedRecords.db'), autoload: true }),
  environmentRecords: Datastore.create({ filename: path.join(__dirname, '../data/environmentRecords.db'), autoload: true }),
  harvestBatches: Datastore.create({ filename: path.join(__dirname, '../data/harvestBatches.db'), autoload: true }),
  processingSteps: Datastore.create({ filename: path.join(__dirname, '../data/processingSteps.db'), autoload: true }),
  processingBatches: Datastore.create({ filename: path.join(__dirname, '../data/processingBatches.db'), autoload: true }),
  yieldRecords: Datastore.create({ filename: path.join(__dirname, '../data/yieldRecords.db'), autoload: true }),
  processingQualityChecks: Datastore.create({ filename: path.join(__dirname, '../data/processingQualityChecks.db'), autoload: true }),
  processingStaff: Datastore.create({ filename: path.join(__dirname, '../data/processingStaff.db'), autoload: true }),
  inventory: Datastore.create({ filename: path.join(__dirname, '../data/inventory.db'), autoload: true }),
  orders: Datastore.create({ filename: path.join(__dirname, '../data/orders.db'), autoload: true }),
  payments: Datastore.create({ filename: path.join(__dirname, '../data/payments.db'), autoload: true }),
  qualityChecks: Datastore.create({ filename: path.join(__dirname, '../data/qualityChecks.db'), autoload: true }),
  complianceRecords: Datastore.create({ filename: path.join(__dirname, '../data/complianceRecords.db'), autoload: true }),
  audits: Datastore.create({ filename: path.join(__dirname, '../data/audits.db'), autoload: true }),
  systemConfig: Datastore.create({ filename: path.join(__dirname, '../data/systemConfig.db'), autoload: true }),
  customerProfiles: Datastore.create({ filename: path.join(__dirname, '../data/customerProfiles.db'), autoload: true }),
  loyaltyPrograms: Datastore.create({ filename: path.join(__dirname, '../data/loyaltyPrograms.db'), autoload: true }),
  customerEnrollments: Datastore.create({ filename: path.join(__dirname, '../data/customerEnrollments.db'), autoload: true }),
  pointsTransactions: Datastore.create({ filename: path.join(__dirname, '../data/pointsTransactions.db'), autoload: true }),
  feedbackComplaints: Datastore.create({ filename: path.join(__dirname, '../data/feedbackComplaints.db'), autoload: true }),
  promotionalCampaigns: Datastore.create({ filename: path.join(__dirname, '../data/promotionalCampaigns.db'), autoload: true }),
  products: Datastore.create({ filename: path.join(__dirname, '../data/products.db'), autoload: true }),
  employees: Datastore.create({ filename: path.join(__dirname, '../data/employees.db'), autoload: true }),
  notifications: Datastore.create({ filename: path.join(__dirname, '../data/notifications.db'), autoload: true }),
  notificationConfigs: Datastore.create({ filename: path.join(__dirname, '../data/notificationConfigs.db'), autoload: true }),
  systemLogs: Datastore.create({ filename: path.join(__dirname, '../data/systemLogs.db'), autoload: true }),
  apiKeys: Datastore.create({ filename: path.join(__dirname, '../data/apiKeys.db'), autoload: true }),
  carts: Datastore.create({ filename: path.join(__dirname, '../data/carts.db'), autoload: true }),
  passwordResets: Datastore.create({ filename: path.join(__dirname, '../data/passwordResets.db'), autoload: true }),
  contactMessages: Datastore.create({ filename: path.join(__dirname, '../data/contactMessages.db'), autoload: true })
};

Object.values(db).forEach(collection => {
  collection.ensureIndex({ fieldName: '_id', unique: true });
});

module.exports = db;
