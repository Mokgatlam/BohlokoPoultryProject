/**
 * Database Configuration — NeDB Datastores (NFR-016, NFR-018)
 *
 * Initializes all NeDB file-based database collections. Each collection
 * is stored as a separate .db file in the backend/data/ directory.
 * Auto-loads on server start (autoload: true) and ensures unique _id index.
 *
 * NFR-016 (Integration Compatibility):
 *   - NeDB provides MongoDB-like API without requiring a running DB server
 *   - File-based storage enables single-server deployment (NFR-017.1)
 *   - Each collection is an independent .db file for easy backup/restore
 *   - 37 collections organized by domain (production, orders, CRM, etc.)
 *
 * NFR-018 (Monitoring & Logging):
 *   - systemLogs collection stores structured audit logs
 *   - Each collection's .db file can be monitored for disk usage
 *   - Collection stats exposed via /api/data/stats endpoint (FR-023)
 *
 * Collection Inventory (37 datastores):
 *   Core Business:
 *     - users: User accounts and authentication (FR-001)
 *     - products: Product catalog (FR-010)
 *     - orders: Customer orders (FR-011)
 *     - payments: Payment transactions (FR-013)
 *     - carts: Shopping cart sessions (FR-010)
 *
 *   Production:
 *     - productionCycles: Broiler growing cycles (FR-004)
 *     - dailyLogs: Daily production records (FR-005)
 *     - medications: Medication tracking (FR-006)
 *     - healthChecks: Health inspection records (FR-006)
 *     - vaccinations: Vaccination records (FR-006)
 *     - weightRecords: Weight monitoring (FR-005)
 *     - feedRecords: Feed consumption tracking (FR-005)
 *     - environmentRecords: Environmental conditions (FR-005)
 *
 *   Processing:
 *     - harvestBatches: Harvest records (FR-007)
 *     - processingSteps: Processing workflow steps (FR-007)
 *     - processingBatches: Processing batch records (FR-007)
 *     - yieldRecords: Yield calculations (FR-007)
 *     - processingQualityChecks: Quality during processing (FR-020)
 *     - processingStaff: Processing staff assignments (FR-007)
 *
 *   Inventory:
 *     - inventory: Stock management (FR-008/009)
 *
 *   CRM:
 *     - customerProfiles: Customer information (FR-016)
 *     - loyaltyPrograms: Loyalty program definitions (FR-016)
 *     - customerEnrollments: Loyalty enrollments (FR-016)
 *     - pointsTransactions: Loyalty points ledger (FR-016)
 *     - feedbackComplaints: Customer feedback (FR-016)
 *     - promotionalCampaigns: Marketing campaigns (FR-016)
 *
 *   Compliance:
 *     - qualityChecks: Quality inspection records (FR-020)
 *     - complianceRecords: Regulatory compliance (FR-021)
 *     - audits: Audit trail records (FR-021)
 *
 *   System:
 *     - systemConfig: Key-value system settings (FR-022)
 *     - notificationConfigs: Notification channel settings (FR-022)
 *     - systemLogs: Structured audit logs (FR-023)
 *     - apiKeys: API key management
 *     - employees: Employee records
 *     - notifications: Notification delivery records
 *     - passwordResets: Password reset tokens (FR-003)
 *     - contactMessages: Contact form submissions
 */

const Datastore = require('nedb-promises');
const path = require('path');

const db = {
  // --- Core Business Collections ---
  users: Datastore.create({ filename: path.join(__dirname, '../data/users.db'), autoload: true }),
  products: Datastore.create({ filename: path.join(__dirname, '../data/products.db'), autoload: true }),
  orders: Datastore.create({ filename: path.join(__dirname, '../data/orders.db'), autoload: true }),
  payments: Datastore.create({ filename: path.join(__dirname, '../data/payments.db'), autoload: true }),
  carts: Datastore.create({ filename: path.join(__dirname, '../data/carts.db'), autoload: true }),

  // --- Production Collections (FR-004, FR-005, FR-006) ---
  productionCycles: Datastore.create({ filename: path.join(__dirname, '../data/productionCycles.db'), autoload: true }),
  dailyLogs: Datastore.create({ filename: path.join(__dirname, '../data/dailyLogs.db'), autoload: true }),
  medications: Datastore.create({ filename: path.join(__dirname, '../data/medications.db'), autoload: true }),
  healthChecks: Datastore.create({ filename: path.join(__dirname, '../data/healthChecks.db'), autoload: true }),
  vaccinations: Datastore.create({ filename: path.join(__dirname, '../data/vaccinations.db'), autoload: true }),
  weightRecords: Datastore.create({ filename: path.join(__dirname, '../data/weightRecords.db'), autoload: true }),
  feedRecords: Datastore.create({ filename: path.join(__dirname, '../data/feedRecords.db'), autoload: true }),
  environmentRecords: Datastore.create({ filename: path.join(__dirname, '../data/environmentRecords.db'), autoload: true }),

  // --- Processing Collections (FR-007) ---
  harvestBatches: Datastore.create({ filename: path.join(__dirname, '../data/harvestBatches.db'), autoload: true }),
  processingSteps: Datastore.create({ filename: path.join(__dirname, '../data/processingSteps.db'), autoload: true }),
  processingBatches: Datastore.create({ filename: path.join(__dirname, '../data/processingBatches.db'), autoload: true }),
  yieldRecords: Datastore.create({ filename: path.join(__dirname, '../data/yieldRecords.db'), autoload: true }),
  processingQualityChecks: Datastore.create({ filename: path.join(__dirname, '../data/processingQualityChecks.db'), autoload: true }),
  processingStaff: Datastore.create({ filename: path.join(__dirname, '../data/processingStaff.db'), autoload: true }),

  // --- Inventory Collections (FR-008, FR-009) ---
  inventory: Datastore.create({ filename: path.join(__dirname, '../data/inventory.db'), autoload: true }),

  // --- CRM Collections (FR-016) ---
  customerProfiles: Datastore.create({ filename: path.join(__dirname, '../data/customerProfiles.db'), autoload: true }),
  loyaltyPrograms: Datastore.create({ filename: path.join(__dirname, '../data/loyaltyPrograms.db'), autoload: true }),
  customerEnrollments: Datastore.create({ filename: path.join(__dirname, '../data/customerEnrollments.db'), autoload: true }),
  pointsTransactions: Datastore.create({ filename: path.join(__dirname, '../data/pointsTransactions.db'), autoload: true }),
  feedbackComplaints: Datastore.create({ filename: path.join(__dirname, '../data/feedbackComplaints.db'), autoload: true }),
  promotionalCampaigns: Datastore.create({ filename: path.join(__dirname, '../data/promotionalCampaigns.db'), autoload: true }),

  // --- Compliance Collections (FR-020, FR-021) ---
  qualityChecks: Datastore.create({ filename: path.join(__dirname, '../data/qualityChecks.db'), autoload: true }),
  complianceRecords: Datastore.create({ filename: path.join(__dirname, '../data/complianceRecords.db'), autoload: true }),
  audits: Datastore.create({ filename: path.join(__dirname, '../data/audits.db'), autoload: true }),

  // --- System Collections (FR-022, FR-023) ---
  systemConfig: Datastore.create({ filename: path.join(__dirname, '../data/systemConfig.db'), autoload: true }),
  notificationConfigs: Datastore.create({ filename: path.join(__dirname, '../data/notificationConfigs.db'), autoload: true }),
  systemLogs: Datastore.create({ filename: path.join(__dirname, '../data/systemLogs.db'), autoload: true }),
  apiKeys: Datastore.create({ filename: path.join(__dirname, '../data/apiKeys.db'), autoload: true }),

  // --- Employee & Notification Collections ---
  employees: Datastore.create({ filename: path.join(__dirname, '../data/employees.db'), autoload: true }),
  notifications: Datastore.create({ filename: path.join(__dirname, '../data/notifications.db'), autoload: true }),

  // --- Auth & Contact Collections (FR-001, FR-003) ---
  passwordResets: Datastore.create({ filename: path.join(__dirname, '../data/passwordResets.db'), autoload: true }),
  contactMessages: Datastore.create({ filename: path.join(__dirname, '../data/contactMessages.db'), autoload: true })
};

/**
 * Ensure unique _id index on all collections.
 * Prevents duplicate records and enables fast lookups by primary key.
 */
Object.values(db).forEach(collection => {
  collection.ensureIndex({ fieldName: '_id', unique: true });
});

module.exports = db;