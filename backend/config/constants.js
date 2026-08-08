/**
 * Application Constants
 * =====================
 * 
 * SRS Reference: Multiple FRs - Shared enumerations and configuration values
 * 
 * Central repository for all application-wide constants, enumerations, and
 * configuration values used across backend routes, services, and models.
 * 
 * These constants enforce data integrity by restricting field values to
 * predefined valid options, and are used in express-validator rules,
 * service logic, and frontend display.
 * 
 * Usage:
 *   const { PRODUCT_TYPES, USER_ROLES } = require('../config/constants');
 *   body('productType').isIn(PRODUCT_TYPES)  // Validation
 *   if (roles.includes('Farm Manager'))      // Authorization
 */

/**
 * PRODUCT_TYPES - All poultry product types the farm produces and sells.
 * 
 * SRS: FR-007 - Product catalog, FR-008 - Inventory product classification
 * Used in: inventory creation, order items, processing batches, reports
 * 
 * Types:
 *   - Whole Chicken: Complete processed chicken
 *   - Breast: Chicken breast cuts
 *   - Thighs: Chicken thigh cuts
 *   - Wings: Chicken wings
 *   - Drumsticks: Chicken drumsticks
 *   - Eggs: Fresh eggs
 *   - Sausages: Processed chicken sausages
 *   - Marinated: Pre-marinated chicken products
 *   - Offal Pack: Internal organs variety pack
 *   - Soup Pack: Bones and parts for soup stock
 */
const PRODUCT_TYPES = [
  'Whole Chicken', 'Breast', 'Thighs', 'Wings', 'Drumsticks',
  'Eggs', 'Sausages', 'Marinated', 'Offal Pack', 'Soup Pack'
];

/**
 * USER_TYPES - Customer/actor categories for segmentation.
 * 
 * SRS: FR-001 - User registration, FR-003 - User type management
 * Used in: signup form, customer analytics, pricing tiers
 * 
 * Types:
 *   - Consumer: Individual household buyer
 *   - Restaurant: Food service establishment
 *   - Retailer: Shop/supermarket buyer
 *   - Distributor: Wholesale distribution partner
 *   - Farm Gate: Direct farm-gate collection
 *   - Institution: Schools, hospitals, government
 *   - Staff: Internal farm employees
 */
const USER_TYPES = ['Consumer', 'Restaurant', 'Retailer', 'Distributor', 'Farm Gate', 'Institution', 'Staff'];

/**
 * USER_ROLES - System roles for RBAC (Role-Based Access Control).
 * 
 * SRS: FR-001 - Authentication, FR-003 - Authorization, Role management
 * Used in: middleware/auth.js authorize(), route protection
 * 
 * Roles:
 *   - Farm Manager: Full system access, can manage all modules
 *   - Poultry Attendant: Manages bird care, harvesting operations
 *   - Processing Staff: Handles processing, packaging, quality checks
 *   - Sales Assistant: Manages orders, customer relations
 *   - Customer: Can place orders, view order history (via JWT claims)
 */
const USER_ROLES = ['Farm Manager', 'Poultry Attendant', 'Processing Staff', 'Sales Assistant', 'Customer'];

/**
 * ORDER_STATUSES - Valid states in the order lifecycle.
 * 
 * SRS: FR-010 - Order management, FR-011 - Order processing
 * Used in: order model, order status updates, CRM tracking
 * 
 * Flow: Pending -> Confirmed -> Processing -> Shipped -> Delivered
 *                                   \-> Cancelled (at any point before Delivered)
 */
const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

/**
 * PAYMENT_METHODS - Accepted payment methods.
 * 
 * SRS: FR-012 - Payment processing
 * Used in: checkout, payment recording, financial reports
 */
const PAYMENT_METHODS = ['payfast'];

/**
 * DELIVERY_OPTIONS - Available delivery/collection methods.
 * 
 * SRS: FR-013 - Delivery management
 * Used in: order creation, delivery scheduling
 * 
 * Options:
 *   - pickup: Customer collects from farm/shop
 *   - farm_gate: Collection directly from farm gate
 *   - local_delivery: Farm delivers to customer location
 */
const DELIVERY_OPTIONS = ['pickup', 'farm_gate', 'local_delivery'];

/**
 * USER_STATUSES - Valid states in the user account lifecycle.
 * 
 * SRS: FR-001 - User registration/approval, FR-003 - User management
 * Used in: user model, admin approval workflow
 * 
 * Flow: pending -> approved | suspended | rejected | deleted
 */
const USER_STATUSES = ['pending', 'approved', 'suspended', 'rejected', 'deleted'];

/**
 * BATCH_STATUSES - Valid states for production/processing batches.
 * 
 * SRS: FR-004 - Production cycle management, FR-007 - Harvest/processing
 * Used in: harvest batches, processing batches, production cycles
 * 
 * Flow: Scheduled -> In Progress -> Completed | Cancelled
 */
const BATCH_STATUSES = ['Scheduled', 'In Progress', 'Completed', 'Cancelled'];

/**
 * COMPLIANCE_STATUSES - Quality/compliance check results.
 * 
 * SRS: FR-007 - Quality assurance, FR-016 - Compliance monitoring
 * Used in: quality checks, health checks, compliance reports
 */
const COMPLIANCE_STATUSES = ['Pass', 'Fail', 'Conditional'];

/**
 * FEEDBACK_STATUSES - Customer feedback lifecycle states.
 * 
 * SRS: FR-015 - Customer feedback management
 * Used in: feedback model, CRM follow-up
 * 
 * Flow: Open -> Responded -> Resolved
 */
const FEEDBACK_STATUSES = ['Open', 'Responded', 'Resolved'];

/**
 * CAMPAIGN_STATUSES - Marketing campaign lifecycle states.
 * 
 * SRS: FR-017 - Marketing campaign management
 * Used in: campaign model, campaign scheduling
 * 
 * Flow: Draft -> Active -> Paused -> Completed
 */
const CAMPAIGN_STATUSES = ['Draft', 'Active', 'Paused', 'Completed'];

/**
 * LOYALTY_TIERS - Customer loyalty program tiers.
 * 
 * SRS: FR-018 - Loyalty/rewards program
 * Used in: loyalty point calculation, tier assignment, promotions
 * 
 * Tiers (ascending): Bronze -> Silver -> Gold -> Platinum -> Diamond
 */
const LOYALTY_TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];

/**
 * STORAGE_LOCATIONS - Physical storage locations at the farm.
 * 
 * SRS: FR-008 - Inventory location tracking, FR-009 - Storage management
 * Used in: inventory creation, transfers, picking lists, reports
 * 
 * Locations:
 *   - Cold Storage A: Primary cold storage (2-4°C)
 *   - Cold Storage B: Secondary cold storage (2-4°C)
 *   - Freezer A: Primary frozen storage (-18°C)
 *   - Freezer B: Secondary frozen storage (-18°C)
 *   - Processing Floor: Active processing area (ambient)
 *   - Dispatch Area: Order staging and dispatch zone
 */
const STORAGE_LOCATIONS = ['Cold Storage A', 'Cold Storage B', 'Freezer A', 'Freezer B', 'Processing Floor', 'Dispatch Area'];

module.exports = {
  PRODUCT_TYPES,
  USER_TYPES,
  USER_ROLES,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  DELIVERY_OPTIONS,
  USER_STATUSES,
  BATCH_STATUSES,
  COMPLIANCE_STATUSES,
  FEEDBACK_STATUSES,
  CAMPAIGN_STATUSES,
  LOYALTY_TIERS,
  STORAGE_LOCATIONS
};