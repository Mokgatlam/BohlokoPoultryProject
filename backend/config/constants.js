const PRODUCT_TYPES = [
  'Whole Chicken', 'Breast', 'Thighs', 'Wings', 'Drumsticks',
  'Eggs', 'Sausages', 'Marinated', 'Offal Pack', 'Soup Pack'
];

const USER_TYPES = ['Consumer', 'Restaurant', 'Retailer', 'Distributor', 'Farm Gate', 'Institution', 'Staff'];

const USER_ROLES = ['Farm Manager', 'Poultry Attendant', 'Processing Staff', 'Sales Assistant', 'Customer'];

const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const PAYMENT_METHODS = ['cash', 'bank_transfer', 'mobile_money', 'credit_card'];

const DELIVERY_OPTIONS = ['pickup', 'farm_gate', 'local_delivery'];

const USER_STATUSES = ['pending', 'approved', 'suspended', 'rejected', 'deleted'];

const BATCH_STATUSES = ['Scheduled', 'In Progress', 'Completed', 'Cancelled'];

const COMPLIANCE_STATUSES = ['Pass', 'Fail', 'Conditional'];

const FEEDBACK_STATUSES = ['Open', 'Responded', 'Resolved'];

const CAMPAIGN_STATUSES = ['Draft', 'Active', 'Paused', 'Completed'];

const LOYALTY_TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];

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
