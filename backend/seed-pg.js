/**
 * Comprehensive PostgreSQL Seed Script
 * 
 * Seeds ALL data for Render production:
 * - 10 users (all types)
 * - 18 products (with tiered pricing)
 * - 4 production cycles + daily logs, medications, health checks, etc.
 * - 8 inventory items
 * - 7 orders
 * - 5 customer profiles + loyalty enrollments
 * - 5 feedback records
 * - 4 campaigns
 * - System config defaults
 * 
 * Idempotent: Skips if users table already has data.
 * Usage: node seed-pg.js
 */

require('dotenv').config();
const knex = require('knex');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const knexConfig = require('./knexfile');

const db = knex(knexConfig.production);

const id = () => uuidv4();
const hash = async (pw) => bcrypt.hash(pw, 12);
const today = new Date();
const daysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]; };
const daysFromNow = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; };

async function seed() {
  try {
    // Check if already seeded
    const userCount = await db('users').count('id as count').first();
    if (parseInt(userCount.count) > 0) {
      console.log(`Database already seeded (${userCount.count} users). Skipping.`);
      await db.destroy();
      process.exit(0);
    }

    console.log('Seeding database...\n');

    // ==================== USERS ====================
    console.log('Creating users...');
    const adminId = id();
    const staff1Id = id();
    const staff2Id = id();
    const consumer1Id = id();
    const consumer2Id = id();
    const restaurant1Id = id();
    const retailer1Id = id();
    const distributor1Id = id();
    const institution1Id = id();
    const pendingUserId = id();

    const users = [
      { id: adminId, firstName: 'Thabo', lastName: 'Bohloko', email: 'admin@bohlokofarm.co.za', password: await hash('Admin@123'), userType: 'Staff', role: 'Farm Manager', status: 'approved', phone: '+27821234567', address: JSON.stringify({ street: '12 Farm Road', city: 'Bloemfontein', province: 'Free State', postalCode: '9300' }) },
      { id: staff1Id, firstName: 'John', lastName: 'Doe', email: 'john@bohlokofarm.co.za', password: await hash('Staff@123'), userType: 'Staff', role: 'Poultry Attendant', status: 'approved', phone: '+27822345678', address: JSON.stringify({ street: '45 Worker Lane', city: 'Bloemfontein', province: 'Free State', postalCode: '9301' }) },
      { id: staff2Id, firstName: 'Sarah', lastName: 'Mokoena', email: 'sarah@bohlokofarm.co.za', password: await hash('Staff@123'), userType: 'Staff', role: 'Production Supervisor', status: 'approved', phone: '+27823456789', address: JSON.stringify({ street: '78 Staff Avenue', city: 'Bloemfontein', province: 'Free State', postalCode: '9300' }) },
      { id: consumer1Id, firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', password: await hash('Consumer@123'), userType: 'Consumer', role: 'Customer', status: 'approved', phone: '+27824567890', address: JSON.stringify({ street: '101 Main Street', city: 'Johannesburg', province: 'Gauteng', postalCode: '2000' }) },
      { id: consumer2Id, firstName: 'David', lastName: 'Nkosi', email: 'david@example.com', password: await hash('Consumer@123'), userType: 'Consumer', role: 'Customer', status: 'approved', phone: '+27825678901', address: JSON.stringify({ street: '202 Oak Avenue', city: 'Cape Town', province: 'Western Cape', postalCode: '8000' }) },
      { id: restaurant1Id, firstName: 'Maria', lastName: 'Garcia', email: 'maria@spicekitchen.co.za', password: await hash('Restaurant@123'), userType: 'Restaurant', role: 'Customer', status: 'approved', phone: '+27826789012', businessName: 'Spice Kitchen Restaurant', businessRegNumber: 'REG-2024-001', taxId: 'TAX-987654', address: JSON.stringify({ street: '55 Food Lane', city: 'Pretoria', province: 'Gauteng', postalCode: '0001' }) },
      { id: retailer1Id, firstName: 'Pieter', lastName: 'Van Der Berg', email: 'pieter@greenstore.co.za', password: await hash('Retailer@123'), userType: 'Retailer', role: 'Customer', status: 'approved', phone: '+27827890123', businessName: 'Green Store Supermarket', businessRegNumber: 'REG-2024-002', taxId: 'TAX-543210', address: JSON.stringify({ street: '88 Commerce Road', city: 'Durban', province: 'KwaZulu-Natal', postalCode: '4000' }) },
      { id: distributor1Id, firstName: 'Nomsa', lastName: 'Dlamini', email: 'nomsa@freshdistribute.co.za', password: await hash('Distributor@123'), userType: 'Distributor', role: 'Customer', status: 'approved', phone: '+27828901234', businessName: 'Fresh Distribution Pty Ltd', businessRegNumber: 'REG-2024-003', taxId: 'TAX-112233', address: JSON.stringify({ street: '12 Industrial Park', city: 'Port Elizabeth', province: 'Eastern Cape', postalCode: '6000' }) },
      { id: institution1Id, firstName: 'Admin', lastName: 'School', email: 'admin@brightschool.edu.za', password: await hash('Institution@123'), userType: 'Institution', role: 'Customer', status: 'approved', phone: '+27829012345', businessName: 'Bright Future School', businessRegNumber: 'REG-2024-004', taxId: 'TAX-998877', address: JSON.stringify({ street: '15 Education Drive', city: 'Bloemfontein', province: 'Free State', postalCode: '9300' }) },
      { id: pendingUserId, firstName: 'Alex', lastName: 'Johnson', email: 'alex@example.com', password: await hash('Pending@123'), userType: 'Consumer', role: 'Customer', status: 'pending', phone: '+27830123456', address: JSON.stringify({ street: '99 New Street', city: 'Johannesburg', province: 'Gauteng', postalCode: '2001' }) }
    ];
    await db('users').insert(users);
    console.log('  Created 10 users');

    // ==================== PRODUCTS ====================
    console.log('Creating products...');
    const products = [
      { name: 'Whole Fresh Chicken', slug: 'whole-chicken', sku: 'CHK-WHOLE-001', description: 'Fresh whole broiler chicken, perfect for roasting, boiling, or braai.', category: 'whole', price: 89.99, unit: 'kg', image: '../../assets/images/products/whole-chicken.png', available: true, badge: 'Best Seller', badge_tag: 'Antibiotic Free', fallback_icon: 'fa-drumstick-bite', featured: true, sort_order: 1, price_consumer: 89.99, price_restaurant: 75.99, price_retailer: 65.99, price_distributor: 55.99 },
      { name: 'Chicken Breast Fillets', slug: 'chicken-breast', sku: 'CHK-BREAST-002', description: 'Premium boneless, skinless chicken breast fillets.', category: 'portions', price: 129.99, unit: 'kg', image: '../../assets/images/products/chicken-breast.png', available: true, badge: 'Popular', badge_tag: 'Antibiotic Free', fallback_icon: 'fa-cut', featured: false, sort_order: 2, price_consumer: 129.99, price_restaurant: 110.99, price_retailer: 95.99, price_distributor: 85.99 },
      { name: 'Chicken Thighs', slug: 'chicken-thighs', sku: 'CHK-THIGH-003', description: 'Juicy, flavourful bone-in chicken thighs with skin.', category: 'portions', price: 79.99, unit: 'kg', image: '../../assets/images/products/chicken-thighs.png', available: true, badge: null, badge_tag: 'Antibiotic Free', fallback_icon: 'fa-drumstick-bite', featured: false, sort_order: 3, price_consumer: 79.99, price_restaurant: 65.99, price_retailer: 55.99, price_distributor: 45.99 },
      { name: 'Chicken Wings', slug: 'chicken-wings', sku: 'CHK-WINGS-004', description: 'Fresh whole chicken wings and wing portions.', category: 'portions', price: 69.99, unit: 'kg', image: '../../assets/images/products/chicken-wings.png', available: true, badge: null, badge_tag: 'Hormone Free', fallback_icon: 'fa-feather-alt', featured: false, sort_order: 4, price_consumer: 69.99, price_restaurant: 55.99, price_retailer: 45.99, price_distributor: 35.99 },
      { name: 'Marinated Chicken Pieces', slug: 'marinated-chicken', sku: 'CHK-MARIN-005', description: 'Ready-to-cook marinated chicken pieces with traditional African spices.', category: 'value-added', price: 139.99, unit: 'kg', image: '../../assets/images/products/marinated-chicken.png', available: true, badge: 'New', badge_tag: 'No Artificial Preservatives', fallback_icon: 'fa-pepper-hot', featured: true, sort_order: 5, price_consumer: 139.99, price_restaurant: 120.99, price_retailer: 105.99, price_distributor: 95.99 },
      { name: 'Chicken Sausages', slug: 'chicken-sausages', sku: 'CHK-SAUS-006', description: 'Premium chicken sausages with natural spices.', category: 'value-added', price: 119.99, unit: 'kg', image: '../../assets/images/products/chicken-sausages.png', available: true, badge: null, badge_tag: 'No MSG Added', fallback_icon: 'fa-hotdog', featured: false, sort_order: 6, price_consumer: 119.99, price_restaurant: 100.99, price_retailer: 85.99, price_distributor: 75.99 },
      { name: 'Chicken Livers (500g)', slug: 'chicken-livers', sku: 'CHK-LIVER-013', description: 'Fresh, clean chicken livers. Rich in iron.', category: 'byproducts', price: 30.00, unit: '500g', image: '../../assets/images/products/chicken-livers.png', available: true, badge: null, badge_tag: 'Rich in Iron', fallback_icon: 'fa-heart', featured: false, sort_order: 7, price_consumer: 30.00, price_restaurant: 25.00, price_retailer: 22.00, price_distributor: 18.00 },
      { name: 'Chicken Gizzards (500g)', slug: 'chicken-gizzards', sku: 'CHK-GIZZ-014', description: 'Fresh, cleaned chicken gizzards.', category: 'byproducts', price: 30.00, unit: '500g', image: '../../assets/images/products/chicken-gizzards.png', available: true, badge: null, badge_tag: 'High Protein', fallback_icon: 'fa-drumstick-bite', featured: false, sort_order: 8, price_consumer: 30.00, price_restaurant: 25.00, price_retailer: 22.00, price_distributor: 18.00 },
      { name: 'Chicken Feet (1kg) - Cleaned', slug: 'chicken-feet-cleaned', sku: 'CHK-FEET-015', description: 'Cleaned and trimmed chicken feet.', category: 'byproducts', price: 50.00, unit: '1kg', image: '../../assets/images/products/chicken-feet-cleaned.png', available: true, badge: 'Popular', badge_tag: 'Cleaned & Ready', fallback_icon: 'fa-shoe-prints', featured: false, sort_order: 9, price_consumer: 50.00, price_restaurant: 42.00, price_retailer: 35.00, price_distributor: 28.00 },
      { name: 'Chicken Hearts (500g)', slug: 'chicken-hearts', sku: 'CHK-HEART-016', description: 'Fresh chicken hearts.', category: 'byproducts', price: 25.00, unit: '500g', image: '../../assets/images/products/chicken-hearts.png', available: true, badge: null, badge_tag: 'Lean Protein', fallback_icon: 'fa-heart', featured: false, sort_order: 10, price_consumer: 25.00, price_restaurant: 20.00, price_retailer: 18.00, price_distributor: 15.00 },
      { name: 'Chicken Necks (1kg)', slug: 'chicken-necks', sku: 'CHK-NECK-017', description: 'Fresh chicken necks with meat.', category: 'byproducts', price: 35.00, unit: '1kg', image: '../../assets/images/products/chicken-necks.png', available: true, badge: null, badge_tag: 'Great for Stock', fallback_icon: 'fa-bone', featured: false, sort_order: 11, price_consumer: 35.00, price_restaurant: 30.00, price_retailer: 25.00, price_distributor: 20.00 },
      { name: 'Malana (1kg)', slug: 'malana', sku: 'CHK-MALN-018', description: 'Cleaned chicken intestines.', category: 'byproducts', price: 25.00, unit: '1kg', image: '../../assets/images/products/chicken-malana.png', available: true, badge: null, badge_tag: 'Traditional Favourite', fallback_icon: 'fa-utensils', featured: false, sort_order: 12, price_consumer: 25.00, price_restaurant: 20.00, price_retailer: 18.00, price_distributor: 15.00 },
      { name: 'Soup Packs (1kg)', slug: 'soup-packs', sku: 'CHK-SOUP-019', description: 'Mixed chicken pieces for soups.', category: 'byproducts', price: 30.00, unit: '1kg', image: '../../assets/images/products/chicken-soup-pack.png', available: true, badge: 'Value', badge_tag: 'Perfect for Soup', fallback_icon: 'fa-bowl-food', featured: false, sort_order: 13, price_consumer: 30.00, price_restaurant: 25.00, price_retailer: 22.00, price_distributor: 18.00 },
      { name: 'Chicken Feet (1kg) - Uncleaned', slug: 'chicken-feet-uncleaned', sku: 'CHK-FEET-020', description: 'Fresh uncleaned chicken feet.', category: 'byproducts', price: 50.00, unit: '1kg', image: '../../assets/images/products/chicken-feet-uncleaned.png', available: true, badge: null, badge_tag: 'Budget Friendly', fallback_icon: 'fa-shoe-prints', featured: false, sort_order: 14, price_consumer: 50.00, price_restaurant: 42.00, price_retailer: 35.00, price_distributor: 28.00 },
      { name: '2kg Mixed Chicken Portions', slug: 'mixed-pack-2kg', sku: 'CHK-MIX2-009', description: 'Convenient 2kg mixed pack.', category: 'portions', price: 169.99, unit: 'pack', image: '../../assets/images/products/chicken-mixed-2kg.png', available: true, badge: 'Value Pack', badge_tag: 'Best Value', fallback_icon: 'fa-weight-hanging', featured: true, sort_order: 15, price_consumer: 169.99, price_restaurant: 149.99, price_retailer: 129.99, price_distributor: 109.99 },
      { name: '3kg Chicken Portions', slug: 'mixed-pack-3kg', sku: 'CHK-MIX3-010', description: 'Generous 3kg family pack.', category: 'portions', price: 249.99, unit: 'pack', image: '../../assets/images/products/chicken-mixed-3kg.png', available: true, badge: 'Family Pack', badge_tag: 'Family Favourite', fallback_icon: 'fa-weight-hanging', featured: false, sort_order: 16, price_consumer: 249.99, price_restaurant: 219.99, price_retailer: 189.99, price_distributor: 159.99 },
      { name: '5kg Chicken Portions', slug: 'mixed-pack-5kg', sku: 'CHK-MIX5-011', description: 'Large 5kg bulk pack.', category: 'portions', price: 399.99, unit: 'pack', image: '../../assets/images/products/chicken-mixed-5kg.png', available: true, badge: 'Bulk Deal', badge_tag: '5% Discount Applied', fallback_icon: 'fa-weight-hanging', featured: false, sort_order: 17, price_consumer: 399.99, price_restaurant: 349.99, price_retailer: 299.99, price_distributor: 259.99 },
      { name: '8kg Chicken Portions', slug: 'mixed-pack-8kg', sku: 'CHK-MIX8-012', description: 'Wholesale 8kg bulk pack.', category: 'portions', price: 629.99, unit: 'pack', image: '../../assets/images/products/chicken-mixed-8kg.png', available: true, badge: 'Wholesale', badge_tag: '10% Discount Applied', fallback_icon: 'fa-weight-hanging', featured: false, sort_order: 18, price_consumer: 629.99, price_restaurant: 549.99, price_retailer: 469.99, price_distributor: 399.99 }
    ];
    for (const p of products) {
      await db('products').insert({ id: id(), ...p, created_at: new Date(), updated_at: new Date() });
    }
    console.log('  Created 18 products');

    // ==================== PRODUCTION CYCLES ====================
    console.log('Creating production cycles...');
    const cycle1Id = id(), cycle2Id = id(), cycle3Id = id(), cycle4Id = id();
    await db('productionCycles').insert([
      { id: cycle1Id, cycleName: 'Cycle 2026-Q1', productionType: 'Broiler Cycle', expectedBirds: 500, actualBirds: 500, startDate: '2026-01-15', expectedEndDate: '2026-03-15', status: 'Completed', createdBy: adminId, approvedBy: adminId, approvedAt: new Date('2026-01-14') },
      { id: cycle2Id, cycleName: 'Cycle 2026-Q2', productionType: 'Broiler Cycle', expectedBirds: 750, actualBirds: 750, startDate: '2026-04-01', expectedEndDate: '2026-06-01', status: 'Completed', createdBy: adminId, approvedBy: adminId, approvedAt: new Date('2026-03-30') },
      { id: cycle3Id, cycleName: 'Cycle 2026-Q3', productionType: 'Broiler Cycle', expectedBirds: 1000, actualBirds: 1000, startDate: '2026-07-01', expectedEndDate: '2026-09-01', status: 'In Progress', createdBy: adminId, approvedBy: adminId, approvedAt: new Date('2026-06-28') },
      { id: cycle4Id, cycleName: 'Cycle 2026-Q4 (Planned)', productionType: 'Egg Production', expectedBirds: 300, startDate: '2026-10-01', expectedEndDate: '2026-12-31', status: 'Planned', createdBy: adminId }
    ]);
    console.log('  Created 4 production cycles');

    // ==================== DAILY LOGS ====================
    console.log('Creating daily logs...');
    const dailyLogs = [];
    for (let i = 0; i < 35; i++) {
      const logDate = new Date('2026-07-01');
      logDate.setDate(logDate.getDate() + i);
      dailyLogs.push({
        id: id(), cycle: cycle3Id, date: logDate.toISOString().split('T')[0],
        birdCount: 1000 - Math.floor(i * 0.5),
        mortality: JSON.stringify({ count: Math.floor(Math.random() * 5), rate: ((Math.floor(Math.random() * 5) / 1000) * 100).toFixed(2) }),
        feedConsumption: JSON.stringify({ type: i < 14 ? 'Starter' : (i < 28 ? 'Grower' : 'Finisher'), quantityKg: 80 + (i * 2) }),
        issues: i === 10 ? 'Minor respiratory symptoms observed in 3 birds' : '',
        recordedBy: staff1Id
      });
    }
    await db('dailyLogs').insert(dailyLogs);
    console.log('  Created 35 daily logs');

    // ==================== MEDICATIONS ====================
    console.log('Creating medications...');
    await db('medications').insert([
      { id: id(), cycle: cycle3Id, medicationName: 'Vitamins A & D Supplement', dosage: '5ml per liter of water', date: '2026-07-05', status: 'Completed', administeredBy: staff1Id, expiryDate: '2027-07-01', medicationType: 'Supplement', notes: 'Routine vitamin supplementation' },
      { id: id(), cycle: cycle3Id, medicationName: 'Antibiotic (Oxytetracycline)', dosage: '20mg per bird', date: '2026-07-12', status: 'Completed', administeredBy: staff1Id, expiryDate: '2027-06-01', medicationType: 'Antibiotic', notes: 'Treated respiratory symptoms' },
      { id: id(), cycle: cycle3Id, medicationName: 'Electrolyte Solution', dosage: '2ml per liter of water', date: '2026-07-20', status: 'Completed', administeredBy: staff2Id, expiryDate: '2027-05-01', medicationType: 'Supplement', notes: 'Heat stress prevention' },
      { id: id(), cycle: cycle3Id, medicationName: 'Dewormer (Levamisole)', dosage: '10mg per bird', date: '2026-08-01', status: 'Scheduled', administeredBy: staff1Id, expiryDate: '2027-08-01', medicationType: 'Dewormer', notes: 'Scheduled deworming for week 5' }
    ]);
    console.log('  Created 4 medications');

    // ==================== HEALTH CHECKS ====================
    console.log('Creating health checks...');
    const healthChecks = [];
    for (let i = 0; i < 5; i++) {
      const checkDate = new Date('2026-07-01');
      checkDate.setDate(checkDate.getDate() + (i * 7));
      healthChecks.push({
        id: id(), cycle: cycle3Id, date: checkDate.toISOString().split('T')[0],
        overallHealth: ['Excellent', 'Good', 'Good', 'Excellent', 'Good'][i],
        birdsChecked: 1000, inspectedBy: staff2Id,
        notes: i === 1 ? 'All birds showing good growth' : 'Routine health inspection'
      });
    }
    await db('healthChecks').insert(healthChecks);
    console.log('  Created 5 health checks');

    // ==================== VACCINATIONS ====================
    console.log('Creating vaccinations...');
    await db('vaccinations').insert([
      { id: id(), cycle: cycle3Id, vaccineName: 'Newcastle Disease (NDV)', scheduledDate: '2026-07-08', dosage: '0.5ml per bird', status: 'Completed', completedDate: '2026-07-08', completedBy: staff1Id, createdBy: adminId },
      { id: id(), cycle: cycle3Id, vaccineName: 'Infectious Bronchitis (IB)', scheduledDate: '2026-07-15', dosage: '0.5ml per bird', status: 'Completed', completedDate: '2026-07-15', completedBy: staff1Id, createdBy: adminId },
      { id: id(), cycle: cycle3Id, vaccineName: 'Gumboro Disease (IBD)', scheduledDate: '2026-07-22', dosage: '1ml per bird (drinking water)', status: 'Completed', completedDate: '2026-07-22', completedBy: staff2Id, createdBy: adminId },
      { id: id(), cycle: cycle3Id, vaccineName: 'Newcastle Disease (NDV) Booster', scheduledDate: '2026-08-05', dosage: '0.5ml per bird', status: 'Scheduled', createdBy: adminId },
      { id: id(), cycle: cycle3Id, vaccineName: 'Fowl Pox', scheduledDate: '2026-08-12', dosage: '0.02ml per bird (wing web)', status: 'Scheduled', createdBy: adminId }
    ]);
    console.log('  Created 5 vaccinations');

    // ==================== WEIGHT RECORDS ====================
    console.log('Creating weight records...');
    const weightRecords = [];
    for (let week = 1; week <= 5; week++) {
      const recordDate = new Date('2026-07-01');
      recordDate.setDate(recordDate.getDate() + (week * 7));
      weightRecords.push({
        id: id(), cycle: cycle3Id, date: recordDate.toISOString().split('T')[0],
        averageWeight: parseFloat(((week * 0.25) + (Math.random() * 0.1)).toFixed(2)),
        sampleSize: 50, recordedBy: staff1Id
      });
    }
    await db('weightRecords').insert(weightRecords);
    console.log('  Created 5 weight records');

    // ==================== FEED RECORDS ====================
    console.log('Creating feed records...');
    const feedRecords = [];
    const feedTypes = ['Starter', 'Starter', 'Starter', 'Starter', 'Grower', 'Grower', 'Grower', 'Grower', 'Finisher', 'Finisher', 'Finisher', 'Finisher', 'Finisher'];
    for (let i = 0; i < 13; i++) {
      const recordDate = new Date('2026-07-01');
      recordDate.setDate(recordDate.getDate() + (i * 3));
      feedRecords.push({
        id: id(), cycle: cycle3Id, date: recordDate.toISOString().split('T')[0],
        feedType: feedTypes[i], quantityKg: 60 + (i * 8) + Math.floor(Math.random() * 10),
        recordedBy: staff1Id
      });
    }
    await db('feedRecords').insert(feedRecords);
    console.log('  Created 13 feed records');

    // ==================== ENVIRONMENT RECORDS ====================
    console.log('Creating environment records...');
    const envRecords = [];
    for (let i = 0; i < 35; i++) {
      const recordDate = new Date('2026-07-01');
      recordDate.setDate(recordDate.getDate() + i);
      const temp = 28 + (Math.random() * 6);
      envRecords.push({
        id: id(), cycle: cycle3Id, date: recordDate.toISOString().split('T')[0],
        temperature: parseFloat(temp.toFixed(1)),
        humidity: parseFloat((55 + (Math.random() * 20)).toFixed(1)),
        notes: temp > 33 ? 'High temperature - increased ventilation' : 'Normal conditions',
        recordedBy: staff1Id
      });
    }
    await db('environmentRecords').insert(envRecords);
    console.log('  Created 35 environment records');

    // ==================== INVENTORY ====================
    console.log('Creating inventory...');
    await db('inventory').insert([
      { id: id(), cycle: cycle3Id, productType: 'Whole Chicken', quantity: 200, weight: 400, batchNumber: 'BATCH-2026-001', harvestDate: '2026-07-28', expiryDate: daysFromNow(5), storageLocation: 'Cold Storage A', pricePerUnit: 120, status: 'available', createdBy: staff2Id },
      { id: id(), cycle: cycle3Id, productType: 'Chicken Breast', quantity: 150, weight: 75, batchNumber: 'BATCH-2026-002', harvestDate: '2026-07-28', expiryDate: daysFromNow(5), storageLocation: 'Cold Storage A', pricePerUnit: 85, status: 'available', createdBy: staff2Id },
      { id: id(), cycle: cycle3Id, productType: 'Chicken Thighs', quantity: 120, weight: 60, batchNumber: 'BATCH-2026-003', harvestDate: '2026-07-28', expiryDate: daysFromNow(5), storageLocation: 'Cold Storage B', pricePerUnit: 75, status: 'available', createdBy: staff2Id },
      { id: id(), cycle: cycle3Id, productType: 'Chicken Wings', quantity: 180, weight: 45, batchNumber: 'BATCH-2026-004', harvestDate: '2026-07-28', expiryDate: daysFromNow(5), storageLocation: 'Cold Storage B', pricePerUnit: 65, status: 'available', createdBy: staff2Id },
      { id: id(), cycle: cycle3Id, productType: 'Chicken Livers', quantity: 50, weight: 25, batchNumber: 'BATCH-2026-005', harvestDate: '2026-07-28', expiryDate: daysFromNow(4), storageLocation: 'Freezer A', pricePerUnit: 45, status: 'available', createdBy: staff2Id },
      { id: id(), cycle: cycle3Id, productType: 'Eggs (30 pack)', quantity: 100, weight: 18, batchNumber: 'BATCH-2026-006', harvestDate: '2026-07-25', expiryDate: daysFromNow(14), storageLocation: 'Cold Storage C', pricePerUnit: 95, status: 'available', createdBy: staff2Id },
      { id: id(), cycle: cycle3Id, productType: 'Whole Chicken', quantity: 50, weight: 100, batchNumber: 'BATCH-2026-007', harvestDate: '2026-07-15', expiryDate: daysAgo(2), storageLocation: 'Cold Storage A', pricePerUnit: 120, status: 'sold', createdBy: staff2Id },
      { id: id(), cycle: cycle2Id, productType: 'Whole Chicken', quantity: 30, weight: 60, batchNumber: 'BATCH-2026-OLD', harvestDate: '2026-05-25', expiryDate: daysAgo(10), storageLocation: 'Cold Storage A', pricePerUnit: 115, status: 'expired', createdBy: staff2Id }
    ]);
    console.log('  Created 8 inventory items');

    // ==================== ORDERS ====================
    console.log('Creating orders...');
    await db('orders').insert([
      { id: id(), orderNumber: `ORD-${Date.now()}-001`, customer: consumer1Id, items: JSON.stringify([{ productName: 'Whole Chicken', quantity: 5, unit: 'pieces', pricePerUnit: 120, total: 600 }, { productName: 'Chicken Breast', quantity: 3, unit: 'pieces', pricePerUnit: 85, total: 255 }]), subtotal: 855, tax: 128.25, shippingCost: 0, total: 983.25, deliveryOption: 'pickup', paymentMethod: 'bank_transfer', paymentStatus: 'Paid', status: 'Delivered', notes: 'Please pack separately' },
      { id: id(), orderNumber: `ORD-${Date.now()}-002`, customer: consumer2Id, items: JSON.stringify([{ productName: 'Eggs (30 pack)', quantity: 2, unit: 'packs', pricePerUnit: 95, total: 190 }, { productName: 'Chicken Thighs', quantity: 4, unit: 'pieces', pricePerUnit: 75, total: 300 }]), subtotal: 490, tax: 73.50, shippingCost: 50, total: 613.50, deliveryOption: 'local_delivery', deliveryAddress: '202 Oak Avenue, Cape Town, 8000', paymentMethod: 'mobile_money', paymentStatus: 'Paid', status: 'Shipped', notes: 'Deliver before 2pm' },
      { id: id(), orderNumber: `ORD-${Date.now()}-003`, customer: restaurant1Id, items: JSON.stringify([{ productName: 'Whole Chicken', quantity: 20, unit: 'pieces', pricePerUnit: 120, total: 2400 }, { productName: 'Chicken Breast', quantity: 15, unit: 'pieces', pricePerUnit: 85, total: 1275 }, { productName: 'Chicken Wings', quantity: 25, unit: 'pieces', pricePerUnit: 65, total: 1625 }]), subtotal: 5300, tax: 795, shippingCost: 0, total: 6095, deliveryOption: 'farm_gate', paymentMethod: 'bank_transfer', paymentStatus: 'Paid', status: 'Processing', notes: 'Weekly restaurant order' },
      { id: id(), orderNumber: `ORD-${Date.now()}-004`, customer: retailer1Id, items: JSON.stringify([{ productName: 'Whole Chicken', quantity: 50, unit: 'pieces', pricePerUnit: 120, total: 6000 }, { productName: 'Chicken Thighs', quantity: 30, unit: 'pieces', pricePerUnit: 75, total: 2250 }, { productName: 'Eggs (30 pack)', quantity: 40, unit: 'packs', pricePerUnit: 95, total: 3800 }]), subtotal: 12050, tax: 1807.50, shippingCost: 0, total: 13857.50, deliveryOption: 'farm_gate', paymentMethod: 'bank_transfer', paymentStatus: 'Paid', status: 'Confirmed', notes: 'Bulk order for supermarket' },
      { id: id(), orderNumber: `ORD-${Date.now()}-005`, customer: institution1Id, items: JSON.stringify([{ productName: 'Whole Chicken', quantity: 15, unit: 'pieces', pricePerUnit: 120, total: 1800 }, { productName: 'Eggs (30 pack)', quantity: 10, unit: 'packs', pricePerUnit: 95, total: 950 }]), subtotal: 2750, tax: 412.50, shippingCost: 50, total: 3212.50, deliveryOption: 'local_delivery', deliveryAddress: '15 Education Drive, Bloemfontein, 9300', paymentMethod: 'bank_transfer', paymentStatus: 'Pending', status: 'Pending', notes: 'School catering order' },
      { id: id(), orderNumber: `ORD-${Date.now()}-006`, customer: consumer1Id, items: JSON.stringify([{ productName: 'Chicken Wings', quantity: 10, unit: 'pieces', pricePerUnit: 65, total: 650 }]), subtotal: 650, tax: 97.50, shippingCost: 50, total: 797.50, deliveryOption: 'local_delivery', deliveryAddress: '101 Main Street, Johannesburg, 2000', paymentMethod: 'credit_card', paymentStatus: 'Refunded', status: 'Cancelled', cancellationReason: 'Customer changed mind', refundAmount: 797.50 },
      { id: id(), orderNumber: `ORD-${Date.now()}-007`, customer: consumer2Id, items: JSON.stringify([{ productName: 'Chicken Breast', quantity: 5, unit: 'pieces', pricePerUnit: 85, total: 425 }, { productName: 'Chicken Livers', quantity: 2, unit: 'packs', pricePerUnit: 45, total: 90 }]), subtotal: 515, tax: 77.25, shippingCost: 0, total: 592.25, deliveryOption: 'pickup', paymentMethod: 'cash', paymentStatus: 'Paid', status: 'Delivered', notes: 'Pickup from farm' }
    ]);
    console.log('  Created 7 orders');

    // ==================== CUSTOMER PROFILES ====================
    console.log('Creating customer profiles...');
    await db('customerProfiles').insert([
      { id: id(), userId: consumer1Id, firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', phone: '+27824567890', userType: 'Consumer', address: JSON.stringify({ street: '101 Main Street', city: 'Johannesburg', province: 'Gauteng', postalCode: '2000' }), preferences: JSON.stringify({ communication: 'email', newsletter: true, promotions: true }), stats: JSON.stringify({ totalOrders: 8, totalSpent: 4800, averageOrderValue: 600 }), loyalty: JSON.stringify({ tier: 'Gold', points: 2800 }), segment: 'Returning' },
      { id: id(), userId: consumer2Id, firstName: 'David', lastName: 'Nkosi', email: 'david@example.com', phone: '+27825678901', userType: 'Consumer', address: JSON.stringify({ street: '202 Oak Avenue', city: 'Cape Town', province: 'Western Cape', postalCode: '8000' }), preferences: JSON.stringify({ communication: 'sms', newsletter: true, promotions: false }), stats: JSON.stringify({ totalOrders: 3, totalSpent: 2100, averageOrderValue: 700 }), loyalty: JSON.stringify({ tier: 'Silver', points: 1200 }), segment: 'Returning' },
      { id: id(), userId: restaurant1Id, firstName: 'Maria', lastName: 'Garcia', email: 'maria@spicekitchen.co.za', phone: '+27826789012', userType: 'Restaurant', address: JSON.stringify({ street: '55 Food Lane', city: 'Pretoria', province: 'Gauteng', postalCode: '0001' }), preferences: JSON.stringify({ communication: 'email', newsletter: true, promotions: true }), stats: JSON.stringify({ totalOrders: 25, totalSpent: 45000, averageOrderValue: 1800 }), loyalty: JSON.stringify({ tier: 'Platinum', points: 5200 }), segment: 'VIP' },
      { id: id(), userId: retailer1Id, firstName: 'Pieter', lastName: 'Van Der Berg', email: 'pieter@greenstore.co.za', phone: '+27827890123', userType: 'Retailer', address: JSON.stringify({ street: '88 Commerce Road', city: 'Durban', province: 'KwaZulu-Natal', postalCode: '4000' }), preferences: JSON.stringify({ communication: 'email', newsletter: false, promotions: true }), stats: JSON.stringify({ totalOrders: 15, totalSpent: 82000, averageOrderValue: 5466.67 }), loyalty: JSON.stringify({ tier: 'Diamond', points: 10500 }), segment: 'VIP' },
      { id: id(), userId: institution1Id, firstName: 'Admin', lastName: 'School', email: 'admin@brightschool.edu.za', phone: '+27829012345', userType: 'Institution', address: JSON.stringify({ street: '15 Education Drive', city: 'Bloemfontein', province: 'Free State', postalCode: '9300' }), preferences: JSON.stringify({ communication: 'email', newsletter: true, promotions: true }), stats: JSON.stringify({ totalOrders: 6, totalSpent: 18000, averageOrderValue: 3000 }), loyalty: JSON.stringify({ tier: 'Gold', points: 2600 }), segment: 'Returning' }
    ]);
    console.log('  Created 5 customer profiles');

    // ==================== LOYALTY PROGRAM ====================
    console.log('Creating loyalty program...');
    const loyaltyId = id();
    await db('loyaltyPrograms').insert({
      id: loyaltyId, name: 'Bohloko Rewards', description: 'Earn points with every purchase!',
      tiers: JSON.stringify([{ name: 'Bronze', minPoints: 0, discount: 0 }, { name: 'Silver', minPoints: 1000, discount: 5 }, { name: 'Gold', minPoints: 2500, discount: 10 }, { name: 'Platinum', minPoints: 5000, discount: 15 }, { name: 'Diamond', minPoints: 10000, discount: 20 }]),
      pointsPerRand: 0.1,
      rewards: JSON.stringify([{ name: 'Free Delivery', points: 200 }, { name: '10% Discount', points: 500 }, { name: 'Free Product', points: 1500 }]),
      active: true
    });
    console.log('  Created loyalty program');

    // ==================== FEEDBACK ====================
    console.log('Creating feedback...');
    await db('feedbackComplaints').insert([
      { id: id(), customerId: consumer1Id, userId: consumer1Id, customerName: 'Jane Smith', type: 'feedback', category: 'Product Quality', subject: 'Excellent chicken quality!', message: 'The whole chickens were fresh and well-packaged.', rating: 5, status: 'Resolved', response: 'Thank you, Jane!', respondedBy: adminId, respondedAt: new Date(), resolvedAt: new Date(), priority: 'Low' },
      { id: id(), customerId: consumer2Id, userId: consumer2Id, customerName: 'David Nkosi', type: 'complaint', category: 'Delivery', subject: 'Delivery was late', message: 'Order was supposed to arrive by 2pm but came at 4pm.', rating: 2, status: 'Responded', priority: 'High', response: 'We apologize for the delay.', respondedBy: adminId, respondedAt: new Date() },
      { id: id(), customerId: restaurant1Id, userId: restaurant1Id, customerName: 'Maria Garcia', type: 'suggestion', category: 'Products', subject: 'Request for bulk packaging', message: 'Bulk packaging options for restaurants would be great.', status: 'Open', priority: 'Medium' },
      { id: id(), customerId: retailer1Id, userId: retailer1Id, customerName: 'Pieter Van Der Berg', type: 'inquiry', category: 'Wholesale', subject: 'Wholesale pricing inquiry', message: 'Interested in wholesale supply agreement.', status: 'Open', priority: 'Medium' },
      { id: id(), customerId: consumer1Id, userId: consumer1Id, customerName: 'Jane Smith', type: 'feedback', category: 'Service', subject: 'Great customer service', message: 'Farm staff were very helpful during pickup.', rating: 5, status: 'Resolved', response: 'Thank you, Jane!', respondedBy: adminId, respondedAt: new Date(), resolvedAt: new Date(), priority: 'Low' }
    ]);
    console.log('  Created 5 feedback records');

    // ==================== CAMPAIGNS ====================
    console.log('Creating campaigns...');
    await db('promotionalCampaigns').insert([
      { id: id(), name: 'Winter Warmer Special', description: '15% off all chicken products', type: 'discount', channel: 'email', subject: 'Stay Warm - 15% Off!', content: 'Use code WINTER15 at checkout.', targetAudience: 'all', discount: 15, discountType: 'percentage', startDate: '2026-06-01', endDate: '2026-08-31', status: 'Active', createdBy: adminId, stats: JSON.stringify({ sent: 150, opened: 98, clicked: 45, converted: 22, revenue: 18500 }) },
      { id: id(), name: 'New Customer Welcome', description: '10% off first order', type: 'promotion', channel: 'email', subject: 'Welcome to Bohloko Farm!', content: 'Use code WELCOME10 at checkout.', targetAudience: 'new_customers', discount: 10, discountType: 'percentage', startDate: '2026-01-01', status: 'Active', createdBy: adminId, stats: JSON.stringify({ sent: 45, opened: 38, clicked: 20, converted: 12, revenue: 7200 }) },
      { id: id(), name: 'Refer a Friend', description: 'Earn bonus points for referrals', type: 'promotion', channel: 'both', subject: 'Refer Friends, Earn Rewards!', content: 'Refer a friend and both earn 500 bonus points.', targetAudience: 'loyalty_members', discount: 0, discountType: 'percentage', startDate: '2026-07-01', endDate: '2026-09-30', status: 'Active', createdBy: adminId, stats: JSON.stringify({ sent: 80, opened: 55, clicked: 30, converted: 15, revenue: 0 }) },
      { id: id(), name: 'Easter Egg-stravaganza', description: '20% off eggs and chicken', type: 'discount', channel: 'email', subject: 'Easter Specials!', content: '20% off all egg products!', targetAudience: 'all', discount: 20, discountType: 'percentage', startDate: '2026-04-01', endDate: '2026-04-20', status: 'Completed', createdBy: adminId, stats: JSON.stringify({ sent: 200, opened: 145, clicked: 78, converted: 40, revenue: 32000 }) }
    ]);
    console.log('  Created 4 campaigns');

    // ==================== SYSTEM CONFIG ====================
    console.log('Creating system config...');
    const configs = [
      { key: 'taxRate', value: 15 },
      { key: 'shippingLocal', value: 50 },
      { key: 'shippingThreshold', value: 1000 },
      { key: 'lowStockThreshold', value: 10 },
      { key: 'bulkDiscount5', value: 5 },
      { key: 'bulkDiscount10', value: 10 },
      { key: 'bulkDiscount15', value: 15 },
      { key: 'bulkThreshold1', value: 100 },
      { key: 'bulkThreshold2', value: 500 },
      { key: 'bulkThreshold3', value: 1000 },
      { key: 'currency', value: 'ZAR' },
      { key: 'currencySymbol', value: 'R' },
      { key: 'businessHours', value: JSON.stringify({ open: '06:00', close: '22:00' }) }
    ];
    for (const c of configs) {
      await db('systemConfig').insert({ id: id(), key: c.key, value: JSON.stringify(c.value) });
    }
    console.log('  Created 13 system config entries');

    console.log('\n========================================');
    console.log('SEED COMPLETE!');
    console.log('========================================\n');
    console.log('LOGIN CREDENTIALS:');
    console.log('─────────────────────────────────────────');
    console.log('Admin:      admin@bohlokofarm.co.za / Admin@123');
    console.log('Staff:      john@bohlokofarm.co.za / Staff@123');
    console.log('Staff:      sarah@bohlokofarm.co.za / Staff@123');
    console.log('Consumer:   jane@example.com / Consumer@123');
    console.log('Consumer:   david@example.com / Consumer@123');
    console.log('Restaurant: maria@spicekitchen.co.za / Restaurant@123');
    console.log('Retailer:   pieter@greenstore.co.za / Retailer@123');
    console.log('Distributor: nomsa@freshdistribute.co.za / Distributor@123');
    console.log('Institution: admin@brightschool.edu.za / Institution@123');
    console.log('Pending:    alex@example.com / Pending@123');
    console.log('─────────────────────────────────────────\n');

    await db.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    await db.destroy();
    process.exit(1);
  }
}

seed();
