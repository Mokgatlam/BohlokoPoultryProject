/**
 * Seed Data - Bohloko Family Farm
 * =================================
 * 
 * Comprehensive seed data for development and testing.
 * Run with: npx knex seed:run
 * 
 * Creates realistic data for:
 *   - Users (staff, customers, restaurants)
 *   - Products (poultry products with tiered pricing)
 *   - Production cycles, daily logs, medications
 *   - Harvest and processing batches
 *   - Orders and payments
 *   - Inventory items
 *   - System configuration
 */

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Pre-hashed password for 'Password123!' (12 salt rounds)
const HASHED_PASSWORD = '$2a$12$LJ3m4ys4Lz7nQZmhRqeJMOJpKCmGS1wBpVTy8qVbOCwFnN0YxYvWe';

// Helper to generate consistent IDs
const id = (prefix, num) => `${prefix}-${String(num).padStart(3, '0')}`;

// Helper to generate order/payment numbers
const orderNum = (timestamp, suffix) => `ORD-${timestamp}-${suffix}`;
const payNum = (timestamp, suffix) => `PAY-${timestamp}-${suffix}`;
const batchNum = (timestamp, suffix) => `BATCH-${timestamp}-${suffix}`;

exports.seed = async function(knex) {
  // Clean existing data (in reverse order of dependencies)
  console.log('Cleaning existing data...');
  await knex('contactMessages').del();
  await knex('passwordResets').del();
  await knex('audits').del();
  await knex('complianceRecords').del();
  await knex('qualityChecks').del();
  await knex('promotionalCampaigns').del();
  await knex('feedbackComplaints').del();
  await knex('pointsTransactions').del();
  await knex('customerEnrollments').del();
  await knex('loyaltyPrograms').del();
  await knex('customerProfiles').del();
  await knex('apiKeys').del();
  await knex('employees').del();
  await knex('notificationConfigs').del();
  await knex('notifications').del();
  await knex('systemLogs').del();
  await knex('systemConfig').del();
  await knex('processingStaff').del();
  await knex('processingQualityChecks').del();
  await knex('yieldRecords').del();
  await knex('processingSteps').del();
  await knex('processingBatches').del();
  await knex('harvestBatches').del();
  await knex('environmentRecords').del();
  await knex('feedRecords').del();
  await knex('weightRecords').del();
  await knex('vaccinations').del();
  await knex('healthChecks').del();
  await knex('medications').del();
  await knex('dailyLogs').del();
  await knex('productionCycles').del();
  await knex('carts').del();
  await knex('payments').del();
  await knex('orders').del();
  await knex('inventory').del();
  await knex('products').del();
  await knex('users').del();

  console.log('Seeding users...');
  const now = new Date();
  const users = [
    // Staff
    {
      id: id('usr', 1), firstName: 'Thabo', lastName: 'Bohloko', email: 'thabo@bohlokofarm.co.za',
      password: HASHED_PASSWORD, userType: 'Staff', role: 'Farm Manager', status: 'approved',
      phone: '+27821234567', businessName: '', address: JSON.stringify({}),
      failedLoginAttempts: 0, lockUntil: null, lastLogin: now, created_at: now, updated_at: now
    },
    {
      id: id('usr', 2), firstName: 'Lerato', lastName: 'Mokoena', email: 'lerato@bohlokofarm.co.za',
      password: HASHED_PASSWORD, userType: 'Staff', role: 'Poultry Attendant', status: 'approved',
      phone: '+27822345678', businessName: '', address: JSON.stringify({}),
      failedLoginAttempts: 0, lockUntil: null, lastLogin: now, created_at: now, updated_at: now
    },
    {
      id: id('usr', 3), firstName: 'Sipho', lastName: 'Ndlovu', email: 'sipho@bohlokofarm.co.za',
      password: HASHED_PASSWORD, userType: 'Staff', role: 'Processing Staff', status: 'approved',
      phone: '+27823456789', businessName: '', address: JSON.stringify({}),
      failedLoginAttempts: 0, lockUntil: null, lastLogin: now, created_at: now, updated_at: now
    },
    {
      id: id('usr', 4), firstName: 'Nompumelelo', lastName: 'Dlamini', email: 'nompumelelo@bohlokofarm.co.za',
      password: HASHED_PASSWORD, userType: 'Staff', role: 'Sales Assistant', status: 'approved',
      phone: '+27824567890', businessName: '', address: JSON.stringify({}),
      failedLoginAttempts: 0, lockUntil: null, lastLogin: now, created_at: now, updated_at: now
    },
    // Consumers
    {
      id: id('usr', 10), firstName: 'John', lastName: 'Smith', email: 'john.smith@email.com',
      password: HASHED_PASSWORD, userType: 'Consumer', role: 'Customer', status: 'approved',
      phone: '+27825678901', businessName: '', address: JSON.stringify({ street: '123 Main St', city: 'Bloemfontein', postalCode: '9300' }),
      failedLoginAttempts: 0, lockUntil: null, lastLogin: now, created_at: now, updated_at: now
    },
    {
      id: id('usr', 11), firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.j@email.com',
      password: HASHED_PASSWORD, userType: 'Consumer', role: 'Customer', status: 'approved',
      phone: '+27825678902', businessName: '', address: JSON.stringify({ street: '45 Park Ave', city: 'Bloemfontein', postalCode: '9301' }),
      failedLoginAttempts: 0, lockUntil: null, lastLogin: now, created_at: now, updated_at: now
    },
    {
      id: id('usr', 12), firstName: 'David', lastName: 'Brown', email: 'david.b@email.com',
      password: HASHED_PASSWORD, userType: 'Consumer', role: 'Customer', status: 'approved',
      phone: '+27825678903', businessName: '', address: JSON.stringify({ street: '78 Oak Road', city: 'Bloemfontein', postalCode: '9302' }),
      failedLoginAttempts: 0, lockUntil: null, lastLogin: now, created_at: now, updated_at: now
    },
    // Restaurants
    {
      id: id('usr', 20), firstName: 'Maria', lastName: 'Garcia', email: 'maria@latrattoria.co.za',
      password: HASHED_PASSWORD, userType: 'Restaurant', role: 'Customer', status: 'approved',
      phone: '+27826789012', businessName: 'La Trattoria', address: JSON.stringify({ street: '456 Food Ave', city: 'Bloemfontein', postalCode: '9301' }),
      failedLoginAttempts: 0, lockUntil: null, lastLogin: now, created_at: now, updated_at: now
    },
    {
      id: id('usr', 21), firstName: 'Chen', lastName: 'Wei', email: 'chen@dragonskitchen.co.za',
      password: HASHED_PASSWORD, userType: 'Restaurant', role: 'Customer', status: 'approved',
      phone: '+27826789013', businessName: "Dragon's Kitchen", address: JSON.stringify({ street: '789 Noodle St', city: 'Bloemfontein', postalCode: '9300' }),
      failedLoginAttempts: 0, lockUntil: null, lastLogin: now, created_at: now, updated_at: now
    },
    {
      id: id('usr', 22), firstName: 'Priya', lastName: 'Patel', email: 'priya@spicegarden.co.za',
      password: HASHED_PASSWORD, userType: 'Restaurant', role: 'Customer', status: 'approved',
      phone: '+27826789014', businessName: 'Spice Garden', address: JSON.stringify({ street: '321 Curry Lane', city: 'Bloemfontein', postalCode: '9301' }),
      failedLoginAttempts: 0, lockUntil: null, lastLogin: now, created_at: now, updated_at: now
    },
    // Pending users
    {
      id: id('usr', 30), firstName: 'New', lastName: 'User', email: 'new.user@email.com',
      password: HASHED_PASSWORD, userType: 'Consumer', role: 'Customer', status: 'pending',
      phone: '+27827890123', businessName: '', address: JSON.stringify({}),
      failedLoginAttempts: 0, lockUntil: null, lastLogin: null, created_at: now, updated_at: now
    },
    {
      id: id('usr', 31), firstName: 'Pending', lastName: 'Restaurant', email: 'pending@restaurant.co.za',
      password: HASHED_PASSWORD, userType: 'Restaurant', role: 'Customer', status: 'pending',
      phone: '+27827890124', businessName: 'New Restaurant', address: JSON.stringify({}),
      failedLoginAttempts: 0, lockUntil: null, lastLogin: null, created_at: now, updated_at: now
    }
  ];
  await knex('users').insert(users);

  console.log('Seeding products...');
  const products = [
    {
      id: id('prod', 1), name: 'Whole Chicken', slug: 'whole-chicken', sku: 'WC-001',
      description: 'Fresh whole chicken, approximately 1.8kg. Perfect for roasting or grilling.',
      category: 'Processed', price: 89.99, price_consumer: 89.99, price_restaurant: 79.99,
      price_retailer: 74.99, price_distributor: 69.99, unit: 'each',
      image: '/images/whole-chicken.jpg', available: true, featured: true, sort_order: 1,
      created_at: now, updated_at: now
    },
    {
      id: id('prod', 2), name: 'Chicken Breast', slug: 'chicken-breast', sku: 'CB-001',
      description: 'Boneless, skinless chicken breast fillets. Lean protein perfect for healthy meals.',
      category: 'Portions', price: 129.99, price_consumer: 129.99, price_restaurant: 119.99,
      price_retailer: 109.99, price_distributor: 99.99, unit: 'kg',
      image: '/images/breast.jpg', available: true, featured: true, sort_order: 2,
      created_at: now, updated_at: now
    },
    {
      id: id('prod', 3), name: 'Chicken Wings', slug: 'chicken-wings', sku: 'CW-001',
      description: 'Fresh chicken wings, perfect for braaiing or oven baking.',
      category: 'Portions', price: 99.99, price_consumer: 99.99, price_restaurant: 89.99,
      price_retailer: 84.99, price_distributor: 79.99, unit: 'kg',
      image: '/images/wings.jpg', available: true, featured: true, sort_order: 3,
      created_at: now, updated_at: now
    },
    {
      id: id('prod', 4), name: 'Chicken Thighs', slug: 'chicken-thighs', sku: 'CT-001',
      description: 'Juicy chicken thighs, bone-in or boneless. Great value for money.',
      category: 'Portions', price: 79.99, price_consumer: 79.99, price_restaurant: 72.99,
      price_retailer: 67.99, price_distributor: 62.99, unit: 'kg',
      image: '/images/thighs.jpg', available: true, featured: false, sort_order: 4,
      created_at: now, updated_at: now
    },
    {
      id: id('prod', 5), name: 'Chicken Drumsticks', slug: 'chicken-drumsticks', sku: 'CD-001',
      description: 'Tender chicken drumsticks, perfect for kids and family meals.',
      category: 'Portions', price: 69.99, price_consumer: 69.99, price_restaurant: 62.99,
      price_retailer: 57.99, price_distributor: 52.99, unit: 'kg',
      image: '/images/drumsticks.jpg', available: true, featured: false, sort_order: 5,
      created_at: now, updated_at: now
    },
    {
      id: id('prod', 6), name: 'Chicken Sausages', slug: 'chicken-sausages', sku: 'CS-001',
      description: 'Homemade chicken sausages with herbs and spices. Pack of 6.',
      category: 'Value Added', price: 59.99, price_consumer: 59.99, price_restaurant: 54.99,
      price_retailer: 49.99, price_distributor: 44.99, unit: 'pack',
      image: '/images/sausages.jpg', available: true, featured: false, sort_order: 6,
      created_at: now, updated_at: now
    },
    {
      id: id('prod', 7), name: 'Chicken Livers', slug: 'chicken-livers', sku: 'CL-001',
      description: 'Fresh chicken livers, cleaned and ready to cook. Rich in iron.',
      category: 'Offal', price: 39.99, price_consumer: 39.99, price_restaurant: 34.99,
      price_retailer: 29.99, price_distributor: 24.99, unit: 'kg',
      image: '/images/livers.jpg', available: true, featured: false, sort_order: 7,
      created_at: now, updated_at: now
    },
    {
      id: id('prod', 8), name: 'Soup Pack', slug: 'soup-pack', sku: 'SP-001',
      description: 'Mixed chicken pieces perfect for soup. Includes necks, feet, and back.',
      category: 'Value Added', price: 29.99, price_consumer: 29.99, price_restaurant: 24.99,
      price_retailer: 19.99, price_distributor: 14.99, unit: 'kg',
      image: '/images/souppack.jpg', available: true, featured: false, sort_order: 8,
      created_at: now, updated_at: now
    },
    {
      id: id('prod', 9), name: 'Marinated Chicken', slug: 'marinated-chicken', sku: 'MC-001',
      description: 'Pre-marinated chicken pieces in peri-peri or lemon herb. Ready to cook.',
      category: 'Value Added', price: 119.99, price_consumer: 119.99, price_restaurant: 109.99,
      price_retailer: 99.99, price_distributor: 89.99, unit: 'kg',
      image: '/images/marinated.jpg', available: true, featured: true, sort_order: 9,
      created_at: now, updated_at: now
    },
    {
      id: id('prod', 10), name: 'Eggs (Tray of 30)', slug: 'eggs-tray-30', sku: 'EG-001',
      description: 'Fresh farm eggs, free-range. Tray of 30 large eggs.',
      category: 'Eggs', price: 75.00, price_consumer: 75.00, price_restaurant: 68.00,
      price_retailer: 62.00, price_distributor: 55.00, unit: 'tray',
      image: '/images/eggs.jpg', available: true, featured: true, sort_order: 10,
      created_at: now, updated_at: now
    }
  ];
  await knex('products').insert(products);

  console.log('Seeding production cycles...');
  const cycles = [
    {
      id: id('cyc', 1), cycleName: 'Broiler Cycle 2026-Q3', productionType: 'Broiler Cycle',
      expectedBirds: 500, actualBirds: 495, startDate: '2026-07-01', expectedEndDate: '2026-08-15',
      actualEndDate: null, status: 'In Progress', createdBy: id('usr', 1),
      approvedBy: id('usr', 1), approvedAt: now, created_at: now, updated_at: now
    },
    {
      id: id('cyc', 2), cycleName: 'Egg Production Cycle 2026-Q4', productionType: 'Egg Production',
      expectedBirds: 300, actualBirds: null, startDate: '2026-09-01', expectedEndDate: '2026-12-31',
      actualEndDate: null, status: 'Planned', createdBy: id('usr', 1),
      approvedBy: null, approvedAt: null, created_at: now, updated_at: now
    },
    {
      id: id('cyc', 3), cycleName: 'Hatching Cycle 2026-Q2', productionType: 'Hatching',
      expectedBirds: 200, actualBirds: 195, startDate: '2026-04-01', expectedEndDate: '2026-06-30',
      actualEndDate: '2026-06-30', status: 'Completed', createdBy: id('usr', 1),
      approvedBy: id('usr', 1), approvedAt: new Date('2026-03-25'), created_at: now, updated_at: now
    },
    {
      id: id('cyc', 4), cycleName: 'Broiler Cycle 2026-Q2', productionType: 'Broiler Cycle',
      expectedBirds: 400, actualBirds: 392, startDate: '2026-04-01', expectedEndDate: '2026-06-15',
      actualEndDate: '2026-06-15', status: 'Completed', createdBy: id('usr', 1),
      approvedBy: id('usr', 1), approvedAt: new Date('2026-03-28'), created_at: now, updated_at: now
    }
  ];
  await knex('productionCycles').insert(cycles);

  console.log('Seeding daily logs...');
  const dailyLogs = [];
  // Generate 30 days of logs for active cycle
  for (let i = 0; i < 30; i++) {
    const logDate = new Date('2026-07-01');
    logDate.setDate(logDate.getDate() + i);
    const birdCount = 500 - Math.floor(i * 0.17); // Slight mortality
    const mortalityCount = Math.floor(Math.random() * 3) + 1;
    dailyLogs.push({
      id: id('log', i + 1), cycle: id('cyc', 1), date: logDate.toISOString().split('T')[0],
      birdCount, mortality: JSON.stringify({ count: mortalityCount, rate: ((mortalityCount / birdCount) * 100).toFixed(2) }),
      feedConsumption: JSON.stringify({ quantity: Math.floor(birdCount * 0.12), unit: 'kg' }),
      issues: i === 15 ? 'Slightly reduced appetite observed' : null,
      recordedBy: id('usr', 2), created_at: now, updated_at: now
    });
  }
  await knex('dailyLogs').insert(dailyLogs);

  console.log('Seeding medications...');
  const medications = [
    {
      id: id('med', 1), cycle: id('cyc', 1), medicationName: 'Antibiotic Solution',
      dosage: '10ml per liter water', date: '2026-08-01', status: 'Active',
      administeredBy: id('usr', 2), expiryDate: '2027-08-01', medicationType: 'Antibiotic',
      notes: 'Weekly respiratory treatment', completedAt: null, cancellationReason: null,
      cancelledAt: null, created_at: now, updated_at: now
    },
    {
      id: id('med', 2), cycle: id('cyc', 1), medicationName: 'Vitamin Supplement',
      dosage: '5ml per liter water', date: '2026-07-28', status: 'Completed',
      administeredBy: id('usr', 2), expiryDate: '2026-12-31', medicationType: 'Supplement',
      notes: 'Growth promoter - completed 7 day course', completedAt: new Date('2026-08-04'),
      cancellationReason: null, cancelledAt: null, created_at: now, updated_at: now
    },
    {
      id: id('med', 3), cycle: id('cyc', 1), medicationName: 'Dewormer',
      dosage: '2ml per bird', date: '2026-07-15', status: 'Active',
      administeredBy: id('usr', 2), expiryDate: '2026-08-10', medicationType: 'Antiparasitic',
      notes: 'Monthly deworming - expiring soon', completedAt: null, cancellationReason: null,
      cancelledAt: null, created_at: now, updated_at: now
    },
    {
      id: id('med', 4), cycle: id('cyc', 3), medicationName: 'Newcastle Vaccine',
      dosage: '0.5ml per bird', date: '2026-05-15', status: 'Completed',
      administeredBy: id('usr', 2), expiryDate: '2026-11-15', medicationType: 'Vaccine',
      notes: 'Standard Newcastle disease vaccination', completedAt: new Date('2026-05-15'),
      cancellationReason: null, cancelledAt: null, created_at: now, updated_at: now
    }
  ];
  await knex('medications').insert(medications);

  console.log('Seeding health checks...');
  const healthChecks = [
    {
      id: id('hc', 1), cycle: id('cyc', 1), date: '2026-08-05', overallHealth: 'Good',
      birdsChecked: 495, inspectedBy: id('usr', 2),
      notes: 'All birds active, no signs of disease', created_at: now, updated_at: now
    },
    {
      id: id('hc', 2), cycle: id('cyc', 1), date: '2026-07-28', overallHealth: 'Excellent',
      birdsChecked: 498, inspectedBy: id('usr', 2),
      notes: 'Flock in excellent condition, uniform growth', created_at: now, updated_at: now
    },
    {
      id: id('hc', 3), cycle: id('cyc', 1), date: '2026-07-20', overallHealth: 'Good',
      birdsChecked: 499, inspectedBy: id('usr', 2),
      notes: 'Minor respiratory issue in 2 birds - isolated', created_at: now, updated_at: now
    }
  ];
  await knex('healthChecks').insert(healthChecks);

  console.log('Seeding vaccinations...');
  const vaccinations = [
    {
      id: id('vacc', 1), cycle: id('cyc', 1), vaccineName: 'Newcastle Disease',
      scheduledDate: '2026-07-15', dosage: '0.5ml per bird', status: 'Completed',
      completedDate: '2026-07-15', completedBy: id('usr', 2),
      created_at: now, updated_at: now
    },
    {
      id: id('vacc', 2), cycle: id('cyc', 1), vaccineName: 'Infectious Bronchitis',
      scheduledDate: '2026-08-01', dosage: '0.3ml per bird', status: 'Completed',
      completedDate: '2026-08-01', completedBy: id('usr', 2),
      created_at: now, updated_at: now
    },
    {
      id: id('vacc', 3), cycle: id('cyc', 1), vaccineName: 'Gumboro Disease',
      scheduledDate: '2026-08-15', dosage: '1 dose per bird (oral)', status: 'Scheduled',
      completedDate: null, completedBy: null,
      created_at: now, updated_at: now
    },
    {
      id: id('vacc', 4), cycle: id('cyc', 2), vaccineName: 'Newcastle Disease',
      scheduledDate: '2026-09-15', dosage: '0.5ml per bird', status: 'Scheduled',
      completedDate: null, completedBy: null,
      created_at: now, updated_at: now
    }
  ];
  await knex('vaccinations').insert(vaccinations);

  console.log('Seeding weight records...');
  const weightRecords = [];
  for (let i = 0; i < 10; i++) {
    const recordDate = new Date('2026-07-05');
    recordDate.setDate(recordDate.getDate() + i * 3);
    weightRecords.push({
      id: id('wt', i + 1), cycle: id('cyc', 1), date: recordDate.toISOString().split('T')[0],
      averageWeight: 0.2 + (i * 0.18), sampleSize: 20,
      recordedBy: id('usr', 2), created_at: now, updated_at: now
    });
  }
  await knex('weightRecords').insert(weightRecords);

  console.log('Seeding feed records...');
  const feedRecords = [];
  for (let i = 0; i < 30; i++) {
    const feedDate = new Date('2026-07-01');
    feedDate.setDate(feedDate.getDate() + i);
    feedRecords.push({
      id: id('feed', i + 1), cycle: id('cyc', 1), date: feedDate.toISOString().split('T')[0],
      feedType: i < 15 ? 'Starter Feed' : 'Grower Feed',
      quantityKg: Math.floor((500 - i * 0.5) * 0.12),
      recordedBy: id('usr', 2),
      created_at: now, updated_at: now
    });
  }
  await knex('feedRecords').insert(feedRecords);

  console.log('Seeding environment records...');
  const envRecords = [];
  for (let i = 0; i < 30; i++) {
    const envDate = new Date('2026-07-01');
    envDate.setDate(envDate.getDate() + i);
    envRecords.push({
      id: id('env', i + 1), cycle: id('cyc', 1), date: envDate.toISOString().split('T')[0],
      temperature: 24 + Math.floor(Math.random() * 5),
      humidity: 55 + Math.floor(Math.random() * 15),
      notes: null, recordedBy: id('usr', 2),
      created_at: now, updated_at: now
    });
  }
  await knex('environmentRecords').insert(envRecords);

  console.log('Seeding harvest batches...');
  const harvestBatches = [
    {
      id: id('hvest', 1), cycle: id('cyc', 3), harvestDate: '2026-06-28', birdCount: 195,
      batchNumber: 'HARV-2026-001', totalWeight: 350, actualWeight: 340, actualCount: 192,
      notes: 'Good yield, healthy birds', status: 'Completed',
      startedAt: new Date('2026-06-28T06:00:00'), startedBy: id('usr', 2),
      completedAt: new Date('2026-06-28T12:00:00'), completedBy: id('usr', 2),
      createdBy: id('usr', 1), created_at: now, updated_at: now
    },
    {
      id: id('hvest', 2), cycle: id('cyc', 4), harvestDate: '2026-06-15', birdCount: 392,
      batchNumber: 'HARV-2026-002', totalWeight: 700, actualWeight: 685, actualCount: 390,
      notes: 'Excellent harvest', status: 'Completed',
      startedAt: new Date('2026-06-15T06:00:00'), startedBy: id('usr', 2),
      completedAt: new Date('2026-06-15T13:00:00'), completedBy: id('usr', 2),
      createdBy: id('usr', 1), created_at: now, updated_at: now
    },
    {
      id: id('hvest', 3), cycle: id('cyc', 1), harvestDate: '2026-08-10', birdCount: 495,
      batchNumber: 'HARV-2026-003', totalWeight: 900, actualWeight: null, actualCount: null,
      notes: null, status: 'Scheduled',
      startedAt: null, startedBy: null, completedAt: null, completedBy: null,
      createdBy: id('usr', 1), created_at: now, updated_at: now
    }
  ];
  await knex('harvestBatches').insert(harvestBatches);

  console.log('Seeding processing batches...');
  const processingBatches = [
    {
      id: id('proc', 1), harvestBatch: id('hvest', 1), productType: 'Whole Chicken',
      processingDate: '2026-06-29', batchNumber: 'PROC-2026-001', quantity: 180,
      outputQuantity: 178, wasteWeight: 20,
      notes: 'High quality processing', status: 'Completed',
      startedAt: new Date('2026-06-29T08:00:00'), startedBy: id('usr', 3),
      completedAt: new Date('2026-06-29T14:00:00'), completedBy: id('usr', 3),
      createdBy: id('usr', 1), created_at: now, updated_at: now
    },
    {
      id: id('proc', 2), harvestBatch: id('hvest', 1), productType: 'Breast',
      processingDate: '2026-06-29', batchNumber: 'PROC-2026-002', quantity: 60,
      outputQuantity: 58, wasteWeight: 3,
      notes: 'Good cut quality', status: 'Completed',
      startedAt: new Date('2026-06-29T15:00:00'), startedBy: id('usr', 3),
      completedAt: new Date('2026-06-29T18:00:00'), completedBy: id('usr', 3),
      createdBy: id('usr', 1), created_at: now, updated_at: now
    },
    {
      id: id('proc', 3), harvestBatch: id('hvest', 2), productType: 'Wings',
      processingDate: '2026-06-16', batchNumber: 'PROC-2026-003', quantity: 100,
      outputQuantity: 98, wasteWeight: 5,
      notes: 'Wings processed', status: 'Completed',
      startedAt: new Date('2026-06-16T08:00:00'), startedBy: id('usr', 3),
      completedAt: new Date('2026-06-16T12:00:00'), completedBy: id('usr', 3),
      createdBy: id('usr', 1), created_at: now, updated_at: now
    }
  ];
  await knex('processingBatches').insert(processingBatches);

  console.log('Seeding inventory...');
  const inventory = [
    {
      id: id('inv', 1), cycle: id('cyc', 1), productType: 'Whole Chicken',
      batchNumber: 'BATCH-2026-001', quantity: 50, pricePerUnit: 89.99,
      harvestDate: new Date('2026-08-05'), expiryDate: new Date('2026-08-12'),
      storageLocation: 'Cold Storage A', status: 'available',
      createdBy: id('usr', 3), created_at: now
    },
    {
      id: id('inv', 2), cycle: id('cyc', 1), productType: 'Breast',
      batchNumber: 'BATCH-2026-002', quantity: 30, pricePerUnit: 129.99,
      harvestDate: new Date('2026-08-05'), expiryDate: new Date('2026-08-12'),
      storageLocation: 'Cold Storage B', status: 'available',
      createdBy: id('usr', 3), created_at: now
    },
    {
      id: id('inv', 3), cycle: id('cyc', 1), productType: 'Wings',
      batchNumber: 'BATCH-2026-003', quantity: 25, pricePerUnit: 99.99,
      harvestDate: new Date('2026-08-05'), expiryDate: new Date('2026-08-08'),
      storageLocation: 'Freezer A', status: 'available',
      createdBy: id('usr', 3), created_at: now
    },
    {
      id: id('inv', 4), cycle: id('cyc', 4), productType: 'Whole Chicken',
      batchNumber: 'BATCH-2026-004', quantity: 3, pricePerUnit: 89.99,
      harvestDate: new Date('2026-06-15'), expiryDate: new Date('2026-06-22'),
      storageLocation: 'Cold Storage A', status: 'available',
      createdBy: id('usr', 3), created_at: now
    },
    {
      id: id('inv', 5), cycle: id('cyc', 3), productType: 'Whole Chicken',
      batchNumber: 'BATCH-2026-005', quantity: 10, pricePerUnit: 89.99,
      harvestDate: new Date('2026-06-29'), expiryDate: new Date('2026-07-06'),
      storageLocation: 'Cold Storage A', status: 'reserved',
      createdBy: id('usr', 3), created_at: now
    },
    {
      id: id('inv', 6), cycle: id('cyc', 3), productType: 'Wings',
      batchNumber: 'BATCH-2026-006', quantity: 15, pricePerUnit: 99.99,
      harvestDate: new Date('2026-06-01'), expiryDate: new Date('2026-06-08'),
      storageLocation: 'Freezer B', status: 'available',
      createdBy: id('usr', 3), created_at: now
    }
  ];
  await knex('inventory').insert(inventory);

  console.log('Seeding orders...');
  const orders = [
    {
      id: id('ord', 1), orderNumber: orderNum(1725000000000, 'ABC123'), customer: id('usr', 10),
      items: JSON.stringify([{ product: id('prod', 1), productName: 'Whole Chicken', quantity: 3, pricePerUnit: 89.99, total: 269.97 }]),
      subtotal: 269.97, tax: 40.50, shippingCost: 50, total: 360.47,
      deliveryOption: 'local_delivery', deliveryAddress: JSON.stringify({ street: '123 Main St', city: 'Bloemfontein' }),
      paymentMethod: 'payfast', paymentStatus: 'Pending', status: 'Pending',
      notes: null, cancellationReason: null, refundAmount: null,
      created_at: new Date('2026-08-01'), updated_at: new Date('2026-08-01')
    },
    {
      id: id('ord', 2), orderNumber: orderNum(1725000000001, 'DEF456'), customer: id('usr', 20),
      items: JSON.stringify([
        { product: id('prod', 2), productName: 'Chicken Breast', quantity: 5, pricePerUnit: 119.99, total: 599.95 },
        { product: id('prod', 3), productName: 'Chicken Wings', quantity: 2, pricePerUnit: 89.99, total: 179.98 }
      ]),
      subtotal: 779.93, tax: 116.99, shippingCost: 0, total: 896.92,
      deliveryOption: 'pickup', deliveryAddress: null,
      paymentMethod: 'payfast', paymentStatus: 'Paid', status: 'Confirmed',
      notes: 'Ring bell on arrival', cancellationReason: null, refundAmount: null,
      created_at: new Date('2026-07-28'), updated_at: new Date('2026-07-29')
    },
    {
      id: id('ord', 3), orderNumber: orderNum(1725000000002, 'GHI789'), customer: id('usr', 11),
      items: JSON.stringify([{ product: id('prod', 1), productName: 'Whole Chicken', quantity: 2, pricePerUnit: 89.99, total: 179.98 }]),
      subtotal: 179.98, tax: 27.00, shippingCost: 50, total: 256.98,
      deliveryOption: 'local_delivery', deliveryAddress: JSON.stringify({ street: '45 Park Ave', city: 'Bloemfontein' }),
      paymentMethod: 'payfast', paymentStatus: 'Paid', status: 'Shipped',
      notes: null, cancellationReason: null, refundAmount: null,
      created_at: new Date('2026-07-20'), updated_at: new Date('2026-07-25')
    },
    {
      id: id('ord', 4), orderNumber: orderNum(1725000000003, 'JKL012'), customer: id('usr', 21),
      items: JSON.stringify([{ product: id('prod', 3), productName: 'Chicken Wings', quantity: 10, pricePerUnit: 89.99, total: 899.90 }]),
      subtotal: 899.90, tax: 134.99, shippingCost: 50, total: 1084.89,
      deliveryOption: 'local_delivery', deliveryAddress: JSON.stringify({ street: '789 Noodle St', city: 'Bloemfontein' }),
      paymentMethod: 'payfast', paymentStatus: 'Refunded', status: 'Cancelled',
      notes: null, cancellationReason: 'Customer changed mind', refundAmount: 1084.89,
      created_at: new Date('2026-07-15'), updated_at: new Date('2026-07-16')
    },
    {
      id: id('ord', 5), orderNumber: orderNum(1725000000004, 'MNO345'), customer: id('usr', 12),
      items: JSON.stringify([
        { product: id('prod', 4), productName: 'Chicken Thighs', quantity: 3, pricePerUnit: 79.99, total: 239.97 },
        { product: id('prod', 5), productName: 'Chicken Drumsticks', quantity: 2, pricePerUnit: 69.99, total: 139.98 }
      ]),
      subtotal: 379.95, tax: 56.99, shippingCost: 50, total: 486.94,
      deliveryOption: 'local_delivery', deliveryAddress: JSON.stringify({ street: '78 Oak Road', city: 'Bloemfontein' }),
      paymentMethod: 'payfast', paymentStatus: 'Paid', status: 'Delivered',
      notes: 'Leave at gate', cancellationReason: null, refundAmount: null,
      created_at: new Date('2026-07-10'), updated_at: new Date('2026-07-12')
    },
    {
      id: id('ord', 6), orderNumber: orderNum(1725000000005, 'PQR678'), customer: id('usr', 22),
      items: JSON.stringify([
        { product: id('prod', 9), productName: 'Marinated Chicken', quantity: 4, pricePerUnit: 109.99, total: 439.96 },
        { product: id('prod', 10), productName: 'Eggs (Tray of 30)', quantity: 2, pricePerUnit: 68.00, total: 136.00 }
      ]),
      subtotal: 575.96, tax: 86.39, shippingCost: 0, total: 662.35,
      deliveryOption: 'pickup', deliveryAddress: null,
      paymentMethod: 'payfast', paymentStatus: 'Paid', status: 'Processing',
      notes: 'Large order - check stock', cancellationReason: null, refundAmount: null,
      created_at: new Date('2026-08-05'), updated_at: new Date('2026-08-05')
    },
    {
      id: id('ord', 7), orderNumber: orderNum(1725000000006, 'STU901'), customer: id('usr', 10),
      items: JSON.stringify([{ product: id('prod', 10), productName: 'Eggs (Tray of 30)', quantity: 1, pricePerUnit: 75.00, total: 75.00 }]),
      subtotal: 75.00, tax: 11.25, shippingCost: 50, total: 136.25,
      deliveryOption: 'local_delivery', deliveryAddress: JSON.stringify({ street: '123 Main St', city: 'Bloemfontein' }),
      paymentMethod: 'payfast', paymentStatus: 'Pending', status: 'Pending',
      notes: 'Regular customer', cancellationReason: null, refundAmount: null,
      created_at: new Date('2026-08-06'), updated_at: new Date('2026-08-06')
    }
  ];
  await knex('orders').insert(orders);

  console.log('Seeding payments...');
  const payments = [
    {
      id: id('pay', 1), orderId: id('ord', 2), transactionId: 'TXN-BANK-001',
      amount: 896.92, currency: 'ZAR', method: 'bank_transfer', status: 'completed',
      gatewayResponse: JSON.stringify({ reference: 'EFT Proof #1234' }),
      created_at: new Date('2026-07-28'), updated_at: new Date('2026-07-28')
    },
    {
      id: id('pay', 2), orderId: id('ord', 3), transactionId: 'TXN-MOBILE-001',
      amount: 256.98, currency: 'ZAR', method: 'mobile_money', status: 'completed',
      gatewayResponse: JSON.stringify({ reference: 'MOB-789012' }),
      created_at: new Date('2026-07-20'), updated_at: new Date('2026-07-20')
    },
    {
      id: id('pay', 3), orderId: id('ord', 4), transactionId: null,
      amount: 1084.89, currency: 'ZAR', method: 'cash', status: 'refunded',
      gatewayResponse: JSON.stringify({ refundReason: 'Order cancelled by customer' }),
      created_at: new Date('2026-07-15'), updated_at: new Date('2026-07-16')
    },
    {
      id: id('pay', 4), orderId: id('ord', 5), transactionId: 'TXN-CC-001',
      amount: 486.94, currency: 'ZAR', method: 'credit_card', status: 'completed',
      gatewayResponse: JSON.stringify({ cardLast4: '4242' }),
      created_at: new Date('2026-07-10'), updated_at: new Date('2026-07-10')
    },
    {
      id: id('pay', 5), orderId: id('ord', 6), transactionId: 'TXN-BANK-002',
      amount: 662.35, currency: 'ZAR', method: 'bank_transfer', status: 'completed',
      gatewayResponse: JSON.stringify({ reference: 'EFT Proof #5678' }),
      created_at: new Date('2026-08-05'), updated_at: new Date('2026-08-05')
    }
  ];
  await knex('payments').insert(payments);

  console.log('Seeding system config...');
  const config = [
    { id: id('cfg', 1), key: 'taxRate', value: JSON.stringify('15'), updatedBy: id('usr', 1), updated_at: now },
    { id: id('cfg', 2), key: 'shippingLocal', value: JSON.stringify('50'), updatedBy: id('usr', 1), updated_at: now },
    { id: id('cfg', 3), key: 'lowStockThreshold', value: JSON.stringify('10'), updatedBy: id('usr', 1), updated_at: now },
    { id: id('cfg', 4), key: 'freeDeliveryThreshold', value: JSON.stringify('500'), updatedBy: id('usr', 1), updated_at: now },
    { id: id('cfg', 5), key: 'businessName', value: JSON.stringify('Bohloko Family Farm'), updatedBy: id('usr', 1), updated_at: now },
    { id: id('cfg', 6), key: 'businessEmail', value: JSON.stringify('info@bohlokofarm.co.za'), updatedBy: id('usr', 1), updated_at: now },
    { id: id('cfg', 7), key: 'businessPhone', value: JSON.stringify('+27511234567'), updatedBy: id('usr', 1), updated_at: now },
    { id: id('cfg', 8), key: 'currency', value: JSON.stringify('ZAR'), updatedBy: id('usr', 1), updated_at: now }
  ];
  await knex('systemConfig').insert(config);

  console.log('Seeding notifications...');
  const notifications = [
    {
      id: id('notif', 1), userId: id('usr', 1), type: 'info', title: 'System Ready',
      message: 'Seed data loaded successfully. Welcome to Bohloko Family Farm!',
      read: false, created_at: now
    },
    {
      id: id('notif', 2), userId: id('usr', 1), type: 'warning', title: 'Low Stock Alert',
      message: 'Whole Chicken inventory is running low (3 units remaining).',
      read: false, created_at: now
    },
    {
      id: id('notif', 3), userId: id('usr', 1), type: 'success', title: 'Order Confirmed',
      message: 'Order ORD-2026-DEF456 has been confirmed and paid.',
      read: true, created_at: new Date('2026-07-29')
    }
  ];
  await knex('notifications').insert(notifications);

  console.log('Seeding employee profiles...');
  const employees = [
    {
      id: id('emp', 1), userId: id('usr', 1), employeeId: 'EMP-001', employeeNumber: 'EMP-001',
      department: 'Management', position: 'Farm Manager',
      hireDate: '2020-01-01', status: 'active',
      created_at: now, updated_at: now
    },
    {
      id: id('emp', 2), userId: id('usr', 2), employeeId: 'EMP-002', employeeNumber: 'EMP-002',
      department: 'Production', position: 'Poultry Attendant',
      hireDate: '2022-03-15', status: 'active',
      created_at: now, updated_at: now
    },
    {
      id: id('emp', 3), userId: id('usr', 3), employeeId: 'EMP-003', employeeNumber: 'EMP-003',
      department: 'Processing', position: 'Processing Staff',
      hireDate: '2022-06-01', status: 'active',
      created_at: now, updated_at: now
    },
    {
      id: id('emp', 4), userId: id('usr', 4), employeeId: 'EMP-004', employeeNumber: 'EMP-004',
      department: 'Sales', position: 'Sales Assistant',
      hireDate: '2023-01-10', status: 'active',
      created_at: now, updated_at: now
    }
  ];
  await knex('employees').insert(employees);

  console.log('Seeding system logs...');
  const logs = [
    {
      id: id('logsys', 1), level: 'info', message: 'System started with seed data',
      action: 'system_start',
      details: JSON.stringify({ info: 'System started with seed data' }), userId: id('usr', 1),
      ipAddress: '127.0.0.1', created_at: now
    },
    {
      id: id('logsys', 2), level: 'info', message: 'Farm Manager logged in',
      action: 'user_login',
      details: JSON.stringify({ info: 'Farm Manager logged in' }), userId: id('usr', 1),
      ipAddress: '192.168.1.100', created_at: now
    },
    {
      id: id('logsys', 3), level: 'info', message: 'New order ORD-2026-ABC123 created',
      action: 'order_created',
      details: JSON.stringify({ info: 'New order created' }), userId: id('usr', 10),
      ipAddress: '192.168.1.101', created_at: new Date('2026-08-01')
    }
  ];
  await knex('systemLogs').insert(logs);

  console.log('Seeding contact messages...');
  const contacts = [
    {
      id: id('msg', 1), name: 'John Smith', email: 'john.smith@email.com',
      phone: '+27825678901', subject: 'Wholesale Inquiry',
      message: 'I would like to inquire about wholesale pricing for my restaurant.',
      status: 'new', created_at: now
    },
    {
      id: id('msg', 2), name: 'Sarah Johnson', email: 'sarah.j@email.com',
      phone: '+27825678902', subject: 'Delivery Question',
      message: 'Do you deliver to the Bloemfontein CBD area?',
      status: 'replied', created_at: new Date('2026-08-03')
    }
  ];
  await knex('contactMessages').insert(contacts);

  console.log('Seed data completed successfully!');
  console.log('Summary:');
  console.log(`  - ${users.length} users`);
  console.log(`  - ${products.length} products`);
  console.log(`  - ${cycles.length} production cycles`);
  console.log(`  - ${dailyLogs.length} daily logs`);
  console.log(`  - ${medications.length} medications`);
  console.log(`  - ${healthChecks.length} health checks`);
  console.log(`  - ${vaccinations.length} vaccinations`);
  console.log(`  - ${weightRecords.length} weight records`);
  console.log(`  - ${feedRecords.length} feed records`);
  console.log(`  - ${envRecords.length} environment records`);
  console.log(`  - ${harvestBatches.length} harvest batches`);
  console.log(`  - ${processingBatches.length} processing batches`);
  console.log(`  - ${inventory.length} inventory items`);
  console.log(`  - ${orders.length} orders`);
  console.log(`  - ${payments.length} payments`);
  console.log(`  - ${config.length} config entries`);
  console.log(`  - ${notifications.length} notifications`);
  console.log(`  - ${employees.length} employees`);
  console.log(`  - ${logs.length} system logs`);
  console.log(`  - ${contacts.length} contact messages`);
};
