/**
 * Test Fixtures - Shared test data for Bohloko Family Farm backend tests
 * 
 * Provides realistic, consistent test data matching the database schema.
 * All passwords are pre-hashed bcrypt values for 'Test@123456'.
 */

const bcrypt = require('bcryptjs');

// Pre-hashed password for 'Test@123456' (12 salt rounds)
const HASHED_PASSWORD = '$2a$12$LJ3m4ys4Lz7nQZmhRqeJMOJpKCmGS1wBpVTy8qVbOCwFnN0YxYvWe';

const users = {
  admin: {
    _id: 'test-admin-001',
    firstName: 'Thabo',
    lastName: 'Bohloko',
    email: 'admin@bohlokofarm.co.za',
    password: HASHED_PASSWORD,
    userType: 'Staff',
    role: 'Farm Manager',
    status: 'approved',
    phone: '+27821234567',
    businessName: '',
    address: {},
    failedLoginAttempts: 0,
    lockUntil: null,
    lastLogin: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01')
  },
  poultryAttendant: {
    _id: 'test-attendant-001',
    firstName: 'Lerato',
    lastName: 'Mokoena',
    email: 'attendant@bohlokofarm.co.za',
    password: HASHED_PASSWORD,
    userType: 'Staff',
    role: 'Poultry Attendant',
    status: 'approved',
    phone: '+27822345678',
    failedLoginAttempts: 0,
    lockUntil: null,
    lastLogin: null,
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15')
  },
  processingStaff: {
    _id: 'test-processing-001',
    firstName: 'Sipho',
    lastName: 'Ndlovu',
    email: 'processing@bohlokofarm.co.za',
    password: HASHED_PASSWORD,
    userType: 'Staff',
    role: 'Processing Staff',
    status: 'approved',
    phone: '+27823456789',
    failedLoginAttempts: 0,
    lockUntil: null,
    lastLogin: null,
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15')
  },
  salesAssistant: {
    _id: 'test-sales-001',
    firstName: 'Nompumelelo',
    lastName: 'Dlamini',
    email: 'sales@bohlokofarm.co.za',
    password: HASHED_PASSWORD,
    userType: 'Staff',
    role: 'Sales Assistant',
    status: 'approved',
    phone: '+27824567890',
    failedLoginAttempts: 0,
    lockUntil: null,
    lastLogin: null,
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-01')
  },
  customer1: {
    _id: 'test-customer-001',
    firstName: 'John',
    lastName: 'Smith',
    email: 'customer1@example.com',
    password: HASHED_PASSWORD,
    userType: 'Consumer',
    role: 'Customer',
    status: 'approved',
    phone: '+27825678901',
    businessName: '',
    address: { street: '123 Main St', city: 'Bloemfontein', postalCode: '9300' },
    failedLoginAttempts: 0,
    lockUntil: null,
    lastLogin: null,
    createdAt: new Date('2026-02-15'),
    updatedAt: new Date('2026-02-15')
  },
  customer2: {
    _id: 'test-customer-002',
    firstName: 'Maria',
    lastName: 'Garcia',
    email: 'customer2@example.com',
    password: HASHED_PASSWORD,
    userType: 'Restaurant',
    role: 'Customer',
    status: 'approved',
    phone: '+27826789012',
    businessName: 'La Trattoria',
    address: { street: '456 Food Ave', city: 'Bloemfontein', postalCode: '9301' },
    failedLoginAttempts: 0,
    lockUntil: null,
    lastLogin: null,
    createdAt: new Date('2026-03-01'),
    updatedAt: new Date('2026-03-01')
  },
  pendingUser: {
    _id: 'test-pending-001',
    firstName: 'New',
    lastName: 'User',
    email: 'pending@example.com',
    password: HASHED_PASSWORD,
    userType: 'Consumer',
    role: 'Customer',
    status: 'pending',
    phone: '+27827890123',
    failedLoginAttempts: 0,
    lockUntil: null,
    lastLogin: null,
    createdAt: new Date('2026-08-01'),
    updatedAt: new Date('2026-08-01')
  },
  suspendedUser: {
    _id: 'test-suspended-001',
    firstName: 'Suspended',
    lastName: 'Account',
    email: 'suspended@example.com',
    password: HASHED_PASSWORD,
    userType: 'Consumer',
    role: 'Customer',
    status: 'suspended',
    phone: '+27828901234',
    failedLoginAttempts: 5,
    lockUntil: Date.now() + 30 * 60 * 1000,
    lastLogin: null,
    createdAt: new Date('2026-07-01'),
    updatedAt: new Date('2026-07-15')
  },
  lockedUser: {
    _id: 'test-locked-001',
    firstName: 'Locked',
    lastName: 'Out',
    email: 'locked@example.com',
    password: HASHED_PASSWORD,
    userType: 'Consumer',
    role: 'Customer',
    status: 'approved',
    phone: '+27829012345',
    failedLoginAttempts: 5,
    lockUntil: Date.now() + 30 * 60 * 1000,
    lastLogin: null,
    createdAt: new Date('2026-06-01'),
    updatedAt: new Date('2026-08-01')
  }
};

const products = {
  wholeChicken: {
    id: 'test-prod-001',
    name: 'Whole Chicken',
    slug: 'whole-chicken',
    sku: 'WC-001',
    description: 'Fresh whole chicken, approximately 1.8kg',
    category: 'Processed',
    price: 89.99,
    price_consumer: 89.99,
    price_restaurant: 79.99,
    price_retailer: 74.99,
    price_distributor: 69.99,
    unit: 'each',
    image: '/images/whole-chicken.jpg',
    available: true,
    featured: true,
    sort_order: 1,
    created_by: 'test-admin-001',
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01')
  },
  chickenBreast: {
    id: 'test-prod-002',
    name: 'Chicken Breast',
    slug: 'chicken-breast',
    sku: 'CB-001',
    description: 'Boneless chicken breast fillets',
    category: 'Portions',
    price: 129.99,
    price_consumer: 129.99,
    price_restaurant: 119.99,
    price_retailer: 109.99,
    price_distributor: 99.99,
    unit: 'kg',
    image: '/images/breast.jpg',
    available: true,
    featured: false,
    sort_order: 2,
    created_by: 'test-admin-001',
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01')
  },
  chickenWings: {
    id: 'test-prod-003',
    name: 'Chicken Wings',
    slug: 'chicken-wings',
    sku: 'CW-001',
    description: 'Fresh chicken wings',
    category: 'Portions',
    price: 99.99,
    price_consumer: 99.99,
    price_restaurant: 89.99,
    price_retailer: 84.99,
    price_distributor: 79.99,
    unit: 'kg',
    image: '/images/wings.jpg',
    available: true,
    featured: true,
    sort_order: 3,
    created_by: 'test-admin-001',
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01')
  },
  inactiveProduct: {
    id: 'test-prod-004',
    name: 'Discontinued Sausages',
    slug: 'discontinued-sausages',
    sku: 'DS-001',
    description: 'No longer available',
    category: 'Value Added',
    price: 59.99,
    price_consumer: 59.99,
    price_restaurant: 54.99,
    price_retailer: 49.99,
    price_distributor: 44.99,
    unit: 'pack',
    image: null,
    available: false,
    featured: false,
    sort_order: 99,
    created_by: 'test-admin-001',
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-06-01')
  }
};

const orders = {
  pendingOrder: {
    id: 'test-order-001',
    orderNumber: 'ORD-1725000000000-ABC123',
    customer: 'test-customer-001',
    items: JSON.stringify([
      { product: 'test-prod-001', productName: 'Whole Chicken', quantity: 3, pricePerUnit: 89.99, total: 269.97 }
    ]),
    subtotal: 269.97,
    tax: 40.50,
    shippingCost: 50,
    total: 360.47,
    status: 'Pending',
    paymentStatus: 'Pending',
    deliveryOption: 'local_delivery',
    deliveryAddress: JSON.stringify({ street: '123 Main St', city: 'Bloemfontein' }),
    paymentMethod: 'cash',
    notes: null,
    created_at: new Date('2026-08-01'),
    updated_at: new Date('2026-08-01')
  },
  confirmedOrder: {
    id: 'test-order-002',
    orderNumber: 'ORD-1725000000001-DEF456',
    customer: 'test-customer-002',
    items: JSON.stringify([
      { product: 'test-prod-002', productName: 'Chicken Breast', quantity: 5, pricePerUnit: 119.99, total: 599.95 },
      { product: 'test-prod-003', productName: 'Chicken Wings', quantity: 2, pricePerUnit: 89.99, total: 179.98 }
    ]),
    subtotal: 779.93,
    tax: 116.99,
    shippingCost: 0,
    total: 896.92,
    status: 'Confirmed',
    paymentStatus: 'Paid',
    deliveryOption: 'pickup',
    deliveryAddress: null,
    paymentMethod: 'bank_transfer',
    notes: 'Ring bell on arrival',
    created_at: new Date('2026-07-28'),
    updated_at: new Date('2026-07-29')
  },
  shippedOrder: {
    id: 'test-order-003',
    orderNumber: 'ORD-1725000000002-GHI789',
    customer: 'test-customer-001',
    items: JSON.stringify([
      { product: 'test-prod-001', productName: 'Whole Chicken', quantity: 2, pricePerUnit: 89.99, total: 179.98 }
    ]),
    subtotal: 179.98,
    tax: 27.00,
    shippingCost: 50,
    total: 256.98,
    status: 'Shipped',
    paymentStatus: 'Paid',
    deliveryOption: 'local_delivery',
    deliveryAddress: JSON.stringify({ street: '123 Main St', city: 'Bloemfontein' }),
    paymentMethod: 'mobile_money',
    notes: null,
    created_at: new Date('2026-07-20'),
    updated_at: new Date('2026-07-25')
  },
  cancelledOrder: {
    id: 'test-order-004',
    orderNumber: 'ORD-1725000000003-JKL012',
    customer: 'test-customer-002',
    items: JSON.stringify([
      { product: 'test-prod-003', productName: 'Chicken Wings', quantity: 10, pricePerUnit: 89.99, total: 899.90 }
    ]),
    subtotal: 899.90,
    tax: 134.99,
    shippingCost: 50,
    total: 1084.89,
    status: 'Cancelled',
    paymentStatus: 'Refunded',
    deliveryOption: 'local_delivery',
    deliveryAddress: JSON.stringify({ street: '456 Food Ave', city: 'Bloemfontein' }),
    paymentMethod: 'cash',
    notes: null,
    cancellationReason: 'Customer changed mind',
    refundAmount: 1084.89,
    created_at: new Date('2026-07-15'),
    updated_at: new Date('2026-07-16')
  }
};

const payments = {
  pendingPayment: {
    _id: 'test-pay-001',
    paymentNumber: 'PAY-1725000000000-XYZ789',
    orderId: 'test-order-001',
    userId: 'test-customer-001',
    amount: 360.47,
    method: 'cash',
    status: 'Pending',
    transactionId: null,
    reference: '',
    notes: '',
    metadata: {},
    createdAt: new Date('2026-08-01')
  },
  paidPayment: {
    _id: 'test-pay-002',
    paymentNumber: 'PAY-1725000000001-ABC456',
    orderId: 'test-order-002',
    userId: 'test-customer-002',
    amount: 896.92,
    method: 'bank_transfer',
    status: 'Paid',
    transactionId: 'TXN-123456789',
    reference: 'EFT Proof #1234',
    notes: '',
    metadata: {},
    createdAt: new Date('2026-07-28')
  },
  refundedPayment: {
    _id: 'test-pay-003',
    paymentNumber: 'PAY-1725000000002-DEF789',
    orderId: 'test-order-004',
    userId: 'test-customer-002',
    amount: 1084.89,
    method: 'cash',
    status: 'Refunded',
    transactionId: null,
    reference: '',
    notes: '',
    refundReason: 'Order cancelled by customer',
    refundedAt: new Date('2026-07-16'),
    metadata: {},
    createdAt: new Date('2026-07-15')
  },
  failedPayment: {
    _id: 'test-pay-004',
    paymentNumber: 'PAY-1725000000003-GHI012',
    orderId: 'test-order-001',
    userId: 'test-customer-001',
    amount: 360.47,
    method: 'credit_card',
    status: 'Failed',
    transactionId: 'TXN-FAILED-001',
    reference: '',
    notes: 'Card declined',
    metadata: {},
    createdAt: new Date('2026-08-01')
  }
};

const inventory = {
  wholeChicken1: {
    _id: 'test-inv-001',
    cycle: 'test-cycle-001',
    productType: 'Whole Chicken',
    batchNumber: 'BATCH-1725000000000-A1B2C3D4E',
    quantity: 50,
    pricePerUnit: 89.99,
    harvestDate: new Date('2026-07-25'),
    expiryDate: new Date('2026-08-01'),
    storageLocation: 'Cold Storage A',
    status: 'available',
    createdBy: 'test-attendant-001',
    createdAt: new Date('2026-07-25')
  },
  breast1: {
    _id: 'test-inv-002',
    cycle: 'test-cycle-001',
    productType: 'Breast',
    batchNumber: 'BATCH-1725000000001-E5F6G7H8I',
    quantity: 30,
    pricePerUnit: 129.99,
    harvestDate: new Date('2026-07-26'),
    expiryDate: new Date('2026-08-08'),
    storageLocation: 'Cold Storage B',
    status: 'available',
    createdBy: 'test-processing-001',
    createdAt: new Date('2026-07-26')
  },
  wings1: {
    _id: 'test-inv-003',
    cycle: 'test-cycle-001',
    productType: 'Wings',
    batchNumber: 'BATCH-1725000000002-J9K0L1M2N',
    quantity: 25,
    pricePerUnit: 99.99,
    harvestDate: new Date('2026-07-27'),
    expiryDate: new Date('2026-07-30'),
    storageLocation: 'Freezer A',
    status: 'available',
    createdBy: 'test-processing-001',
    createdAt: new Date('2026-07-27')
  },
  lowStockItem: {
    _id: 'test-inv-004',
    cycle: 'test-cycle-002',
    productType: 'Whole Chicken',
    batchNumber: 'BATCH-1725000000003-O3P4Q5R6S',
    quantity: 3,
    pricePerUnit: 89.99,
    harvestDate: new Date('2026-07-20'),
    expiryDate: new Date('2026-08-10'),
    storageLocation: 'Cold Storage A',
    status: 'available',
    createdBy: 'test-attendant-001',
    createdAt: new Date('2026-07-20')
  },
  reservedItem: {
    _id: 'test-inv-005',
    cycle: 'test-cycle-001',
    productType: 'Whole Chicken',
    batchNumber: 'BATCH-1725000000004-T7U8V9W0X',
    quantity: 10,
    pricePerUnit: 89.99,
    harvestDate: new Date('2026-07-28'),
    expiryDate: new Date('2026-08-05'),
    storageLocation: 'Cold Storage A',
    status: 'reserved',
    createdBy: 'test-attendant-001',
    createdAt: new Date('2026-07-28')
  },
  expiredItem: {
    _id: 'test-inv-006',
    cycle: 'test-cycle-001',
    productType: 'Wings',
    batchNumber: 'BATCH-1725000000005-Y1Z2A3B4C',
    quantity: 15,
    pricePerUnit: 99.99,
    harvestDate: new Date('2026-06-01'),
    expiryDate: new Date('2026-06-08'),
    storageLocation: 'Freezer B',
    status: 'available',
    createdBy: 'test-processing-001',
    createdAt: new Date('2026-06-01')
  }
};

const config = {
  taxRate: { key: 'taxRate', value: '15', updatedAt: new Date('2026-01-01'), updatedBy: 'test-admin-001' },
  shippingLocal: { key: 'shippingLocal', value: '50', updatedAt: new Date('2026-01-01'), updatedBy: 'test-admin-001' },
  lowStockThreshold: { key: 'lowStockThreshold', value: '10', updatedAt: new Date('2026-01-01'), updatedBy: 'test-admin-001' },
  freeDeliveryThreshold: { key: 'freeDeliveryThreshold', value: '500', updatedAt: new Date('2026-01-01'), updatedBy: 'test-admin-001' }
};

const productionCycles = {
  activeCycle: {
    _id: 'test-cycle-001',
    cycleName: 'Broiler Cycle 2026-Q3',
    productionType: 'Broiler Cycle',
    expectedBirds: 500,
    actualBirds: 495,
    startDate: new Date('2026-07-01'),
    endDate: new Date('2026-08-15'),
    status: 'Active',
    createdBy: 'test-admin-001',
    createdAt: new Date('2026-07-01')
  },
  plannedCycle: {
    _id: 'test-cycle-002',
    cycleName: 'Egg Production Cycle 2026-Q4',
    productionType: 'Egg Production',
    expectedBirds: 300,
    startDate: new Date('2026-09-01'),
    endDate: new Date('2026-12-31'),
    status: 'Planned',
    createdBy: 'test-admin-001',
    createdAt: new Date('2026-08-01')
  },
  completedCycle: {
    _id: 'test-cycle-003',
    cycleName: 'Hatching Cycle 2026-Q2',
    productionType: 'Hatching',
    expectedBirds: 200,
    actualBirds: 195,
    startDate: new Date('2026-04-01'),
    endDate: new Date('2026-06-30'),
    status: 'Completed',
    createdBy: 'test-admin-001',
    createdAt: new Date('2026-04-01')
  }
};

const dailyLogs = {
  normalLog: {
    _id: 'test-log-001',
    cycle: 'test-cycle-001',
    date: '2026-08-05',
    birdCount: 495,
    mortality: { count: 2, rate: 0.40 },
    feedConsumption: { quantity: 150, unit: 'kg' },
    recordedBy: 'test-attendant-001',
    createdAt: new Date('2026-08-05')
  },
  highMortalityLog: {
    _id: 'test-log-002',
    cycle: 'test-cycle-001',
    date: '2026-08-06',
    birdCount: 493,
    mortality: { count: 30, rate: 6.09 },
    feedConsumption: { quantity: 145, unit: 'kg' },
    recordedBy: 'test-attendant-001',
    createdAt: new Date('2026-08-06')
  }
};

const medications = {
  activeMedication: {
    _id: 'test-med-001',
    cycle: 'test-cycle-001',
    medicationName: 'Antibiotic Solution',
    dosage: '10ml per liter',
    date: new Date('2026-08-01'),
    notes: 'Weekly treatment',
    expiryDate: new Date('2027-08-01'),
    medicationType: 'Antibiotic',
    administeredBy: 'test-attendant-001',
    status: 'Active',
    createdAt: new Date('2026-08-01')
  },
  completedMedication: {
    _id: 'test-med-002',
    cycle: 'test-cycle-001',
    medicationName: 'Vitamin Supplement',
    dosage: '5ml per liter',
    date: new Date('2026-07-28'),
    notes: 'Growth promoter',
    expiryDate: new Date('2026-12-31'),
    medicationType: 'Supplement',
    administeredBy: 'test-attendant-001',
    status: 'Completed',
    completedAt: new Date('2026-08-05'),
    createdAt: new Date('2026-07-28')
  },
  expiringMedication: {
    _id: 'test-med-003',
    cycle: 'test-cycle-001',
    medicationName: 'Dewormer',
    dosage: '2ml per bird',
    date: new Date('2026-07-15'),
    notes: 'Monthly deworming',
    expiryDate: new Date('2026-08-10'),
    medicationType: 'Antiparasitic',
    administeredBy: 'test-attendant-001',
    status: 'Active',
    createdAt: new Date('2026-07-15')
  }
};

const harvestBatches = {
  scheduledBatch: {
    _id: 'test-harvest-001',
    cycle: 'test-cycle-003',
    harvestDate: '2026-08-10',
    birdCount: 195,
    expectedWeight: 350,
    status: 'Scheduled',
    createdBy: 'test-admin-001',
    createdAt: new Date('2026-08-01')
  },
  inProgressBatch: {
    _id: 'test-harvest-002',
    cycle: 'test-cycle-001',
    harvestDate: '2026-08-05',
    birdCount: 495,
    expectedWeight: 900,
    status: 'In Progress',
    startedAt: new Date('2026-08-05T06:00:00'),
    startedBy: 'test-attendant-001',
    createdBy: 'test-admin-001',
    createdAt: new Date('2026-08-01')
  },
  completedBatch: {
    _id: 'test-harvest-003',
    cycle: 'test-cycle-003',
    harvestDate: '2026-06-28',
    birdCount: 195,
    expectedWeight: 350,
    actualWeight: 340,
    actualCount: 192,
    notes: 'Good yield',
    status: 'Completed',
    startedAt: new Date('2026-06-28T06:00:00'),
    startedBy: 'test-attendant-001',
    completedAt: new Date('2026-06-28T12:00:00'),
    completedBy: 'test-attendant-001',
    createdBy: 'test-admin-001',
    createdAt: new Date('2026-06-20')
  }
};

const processingBatches = {
  scheduledBatch: {
    _id: 'test-proc-001',
    harvestBatch: 'test-harvest-003',
    productType: 'Whole Chicken',
    processingDate: '2026-06-29',
    batchNumber: 'PROC-001',
    expectedOutput: 180,
    status: 'Scheduled',
    createdBy: 'test-admin-001',
    createdAt: new Date('2026-06-28')
  },
  processingBatch: {
    _id: 'test-proc-002',
    harvestBatch: 'test-harvest-002',
    productType: 'Breast',
    processingDate: '2026-08-05',
    batchNumber: 'PROC-002',
    expectedOutput: 150,
    status: 'Processing',
    startedAt: new Date('2026-08-05T13:00:00'),
    startedBy: 'test-processing-001',
    createdBy: 'test-admin-001',
    createdAt: new Date('2026-08-05')
  },
  completedBatch: {
    _id: 'test-proc-003',
    harvestBatch: 'test-harvest-003',
    productType: 'Wings',
    processingDate: '2026-06-30',
    batchNumber: 'PROC-003',
    expectedOutput: 60,
    outputQuantity: 58,
    outputWeight: 45,
    wasteWeight: 3,
    notes: 'Good quality',
    status: 'Completed',
    startedAt: new Date('2026-06-30T08:00:00'),
    startedBy: 'test-processing-001',
    completedAt: new Date('2026-06-30T14:00:00'),
    completedBy: 'test-processing-001',
    createdBy: 'test-admin-001',
    createdAt: new Date('2026-06-29')
  }
};

module.exports = {
  users,
  products,
  orders,
  payments,
  inventory,
  config,
  productionCycles,
  dailyLogs,
  medications,
  harvestBatches,
  processingBatches,
  HASHED_PASSWORD
};
