/**
 * PostgreSQL Product Seed Script
 * 
 * Seeds the products table for Render production (PostgreSQL).
 * Uses DATABASE_URL from environment.
 * 
 * Usage: node seed-products-pg.js
 */

require('dotenv').config();
const knex = require('knex');
const { v4: uuidv4 } = require('uuid');
const knexConfig = require('./knexfile');

const db = knex(knexConfig.production);

const products = [
  {
    name: 'Whole Fresh Chicken', slug: 'whole-chicken', sku: 'CHK-WHOLE-001',
    description: 'Fresh whole broiler chicken, perfect for roasting, boiling, or braai.',
    category: 'whole', price: 89.99, unit: 'kg', image: '../../assets/images/products/whole-chicken.png',
    available: true, badge: 'Best Seller', badge_tag: 'Antibiotic Free', fallback_icon: 'fa-drumstick-bite',
    featured: true, sort_order: 1,
    price_consumer: 89.99, price_restaurant: 75.99, price_retailer: 65.99, price_distributor: 55.99
  },
  {
    name: 'Chicken Breast Fillets', slug: 'chicken-breast', sku: 'CHK-BREAST-002',
    description: 'Premium boneless, skinless chicken breast fillets. Lean, tender, and versatile.',
    category: 'portions', price: 129.99, unit: 'kg', image: '../../assets/images/products/chicken-breast.png',
    available: true, badge: 'Popular', badge_tag: 'Antibiotic Free', fallback_icon: 'fa-cut',
    featured: false, sort_order: 2,
    price_consumer: 129.99, price_restaurant: 110.99, price_retailer: 95.99, price_distributor: 85.99
  },
  {
    name: 'Chicken Thighs', slug: 'chicken-thighs', sku: 'CHK-THIGH-003',
    description: 'Juicy, flavourful bone-in chicken thighs with skin.',
    category: 'portions', price: 79.99, unit: 'kg', image: '../../assets/images/products/chicken-thighs.png',
    available: true, badge: null, badge_tag: 'Antibiotic Free', fallback_icon: 'fa-drumstick-bite',
    featured: false, sort_order: 3,
    price_consumer: 79.99, price_restaurant: 65.99, price_retailer: 55.99, price_distributor: 45.99
  },
  {
    name: 'Chicken Wings', slug: 'chicken-wings', sku: 'CHK-WINGS-004',
    description: 'Fresh whole chicken wings and wing portions. Ideal for braai and deep-frying.',
    category: 'portions', price: 69.99, unit: 'kg', image: '../../assets/images/products/chicken-wings.png',
    available: true, badge: null, badge_tag: 'Hormone Free', fallback_icon: 'fa-feather-alt',
    featured: false, sort_order: 4,
    price_consumer: 69.99, price_restaurant: 55.99, price_retailer: 45.99, price_distributor: 35.99
  },
  {
    name: 'Marinated Chicken Pieces', slug: 'marinated-chicken', sku: 'CHK-MARIN-005',
    description: 'Ready-to-cook marinated chicken pieces with traditional African spices.',
    category: 'value-added', price: 139.99, unit: 'kg', image: '../../assets/images/products/marinated-chicken.png',
    available: true, badge: 'New', badge_tag: 'No Artificial Preservatives', fallback_icon: 'fa-pepper-hot',
    featured: true, sort_order: 5,
    price_consumer: 139.99, price_restaurant: 120.99, price_retailer: 105.99, price_distributor: 95.99
  },
  {
    name: 'Chicken Sausages', slug: 'chicken-sausages', sku: 'CHK-SAUS-006',
    description: 'Premium chicken sausages with natural spices. No MSG, no artificial fillers.',
    category: 'value-added', price: 119.99, unit: 'kg', image: '../../assets/images/products/chicken-sausages.png',
    available: true, badge: null, badge_tag: 'No MSG Added', fallback_icon: 'fa-hotdog',
    featured: false, sort_order: 6,
    price_consumer: 119.99, price_restaurant: 100.99, price_retailer: 85.99, price_distributor: 75.99
  },
  {
    name: 'Chicken Livers (500g)', slug: 'chicken-livers', sku: 'CHK-LIVER-013',
    description: 'Fresh, clean chicken livers. Rich in iron, vitamin A, and B12.',
    category: 'byproducts', price: 30.00, unit: '500g', image: '../../assets/images/products/chicken-livers.png',
    available: true, badge: null, badge_tag: 'Rich in Iron', fallback_icon: 'fa-heart',
    featured: false, sort_order: 7,
    price_consumer: 30.00, price_restaurant: 25.00, price_retailer: 22.00, price_distributor: 18.00
  },
  {
    name: 'Chicken Gizzards (500g)', slug: 'chicken-gizzards', sku: 'CHK-GIZZ-014',
    description: 'Fresh, cleaned chicken gizzards. High in protein and low in fat.',
    category: 'byproducts', price: 30.00, unit: '500g', image: '../../assets/images/products/chicken-gizzards.png',
    available: true, badge: null, badge_tag: 'High Protein', fallback_icon: 'fa-drumstick-bite',
    featured: false, sort_order: 8,
    price_consumer: 30.00, price_restaurant: 25.00, price_retailer: 22.00, price_distributor: 18.00
  },
  {
    name: 'Chicken Feet (1kg) - Cleaned', slug: 'chicken-feet-cleaned', sku: 'CHK-FEET-015',
    description: 'Cleaned and trimmed chicken feet. Rich in collagen and gelatin.',
    category: 'byproducts', price: 50.00, unit: '1kg', image: '../../assets/images/products/chicken-feet-cleaned.png',
    available: true, badge: 'Popular', badge_tag: 'Cleaned & Ready', fallback_icon: 'fa-shoe-prints',
    featured: false, sort_order: 9,
    price_consumer: 50.00, price_restaurant: 42.00, price_retailer: 35.00, price_distributor: 28.00
  },
  {
    name: 'Chicken Hearts (500g)', slug: 'chicken-hearts', sku: 'CHK-HEART-016',
    description: 'Fresh chicken hearts. Lean, protein-rich organ meat.',
    category: 'byproducts', price: 25.00, unit: '500g', image: '../../assets/images/products/chicken-hearts.png',
    available: true, badge: null, badge_tag: 'Lean Protein', fallback_icon: 'fa-heart',
    featured: false, sort_order: 10,
    price_consumer: 25.00, price_restaurant: 20.00, price_retailer: 18.00, price_distributor: 15.00
  },
  {
    name: 'Chicken Necks (1kg)', slug: 'chicken-necks', sku: 'CHK-NECK-017',
    description: 'Fresh chicken necks with meat. Perfect for soups and stews.',
    category: 'byproducts', price: 35.00, unit: '1kg', image: '../../assets/images/products/chicken-necks.png',
    available: true, badge: null, badge_tag: 'Great for Stock', fallback_icon: 'fa-bone',
    featured: false, sort_order: 11,
    price_consumer: 35.00, price_restaurant: 30.00, price_retailer: 25.00, price_distributor: 20.00
  },
  {
    name: 'Malana (1kg)', slug: 'malana', sku: 'CHK-MALN-018',
    description: 'Cleaned chicken intestines. A traditional favourite in South African cuisine.',
    category: 'byproducts', price: 25.00, unit: '1kg', image: '../../assets/images/products/chicken-malana.png',
    available: true, badge: null, badge_tag: 'Traditional Favourite', fallback_icon: 'fa-utensils',
    featured: false, sort_order: 12,
    price_consumer: 25.00, price_restaurant: 20.00, price_retailer: 18.00, price_distributor: 15.00
  },
  {
    name: 'Soup Packs (1kg)', slug: 'soup-packs', sku: 'CHK-SOUP-019',
    description: 'Mixed chicken pieces perfect for soups and stews.',
    category: 'byproducts', price: 30.00, unit: '1kg', image: '../../assets/images/products/chicken-soup-pack.png',
    available: true, badge: 'Value', badge_tag: 'Perfect for Soup', fallback_icon: 'fa-bowl-food',
    featured: false, sort_order: 13,
    price_consumer: 30.00, price_restaurant: 25.00, price_retailer: 22.00, price_distributor: 18.00
  },
  {
    name: 'Chicken Feet (1kg) - Uncleaned', slug: 'chicken-feet-uncleaned', sku: 'CHK-FEET-020',
    description: 'Fresh uncleaned chicken feet. For customers who prefer to prepare at home.',
    category: 'byproducts', price: 50.00, unit: '1kg', image: '../../assets/images/products/chicken-feet-uncleaned.png',
    available: true, badge: null, badge_tag: 'Budget Friendly', fallback_icon: 'fa-shoe-prints',
    featured: false, sort_order: 14,
    price_consumer: 50.00, price_restaurant: 42.00, price_retailer: 35.00, price_distributor: 28.00
  },
  {
    name: '2kg Mixed Chicken Portions', slug: 'mixed-pack-2kg', sku: 'CHK-MIX2-009',
    description: 'Convenient 2kg mixed pack with breast, thighs, wings, and drumsticks.',
    category: 'portions', price: 169.99, unit: 'pack', image: '../../assets/images/products/chicken-mixed-2kg.png',
    available: true, badge: 'Value Pack', badge_tag: 'Best Value', fallback_icon: 'fa-weight-hanging',
    featured: true, sort_order: 15,
    price_consumer: 169.99, price_restaurant: 149.99, price_retailer: 129.99, price_distributor: 109.99
  },
  {
    name: '3kg Chicken Portions', slug: 'mixed-pack-3kg', sku: 'CHK-MIX3-010',
    description: 'Generous 3kg family pack with mixed chicken portions.',
    category: 'portions', price: 249.99, unit: 'pack', image: '../../assets/images/products/chicken-mixed-3kg.png',
    available: true, badge: 'Family Pack', badge_tag: 'Family Favourite', fallback_icon: 'fa-weight-hanging',
    featured: false, sort_order: 16,
    price_consumer: 249.99, price_restaurant: 219.99, price_retailer: 189.99, price_distributor: 159.99
  },
  {
    name: '5kg Chicken Portions', slug: 'mixed-pack-5kg', sku: 'CHK-MIX5-011',
    description: 'Large 5kg bulk pack for large families, restaurants, and catering.',
    category: 'portions', price: 399.99, unit: 'pack', image: '../../assets/images/products/chicken-mixed-5kg.png',
    available: true, badge: 'Bulk Deal', badge_tag: '5% Discount Applied', fallback_icon: 'fa-weight-hanging',
    featured: false, sort_order: 17,
    price_consumer: 399.99, price_restaurant: 349.99, price_retailer: 299.99, price_distributor: 259.99
  },
  {
    name: '8kg Chicken Portions', slug: 'mixed-pack-8kg', sku: 'CHK-MIX8-012',
    description: 'Wholesale 8kg bulk pack for restaurants, caterers, and retailers.',
    category: 'portions', price: 629.99, unit: 'pack', image: '../../assets/images/products/chicken-mixed-8kg.png',
    available: true, badge: 'Wholesale', badge_tag: '10% Discount Applied', fallback_icon: 'fa-weight-hanging',
    featured: false, sort_order: 18,
    price_consumer: 629.99, price_restaurant: 549.99, price_retailer: 469.99, price_distributor: 399.99
  }
];

async function seedProducts() {
  try {
    const count = await db('products').count('id as count').first();
    if (parseInt(count.count) > 0) {
      console.log(`Products already seeded (${count.count} products). Skipping.`);
      await db.destroy();
      process.exit(0);
    }

    console.log('Seeding products...');
    for (const product of products) {
      const id = uuidv4();
      await db('products').insert({
        id,
        ...product,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    console.log(`Seeded ${products.length} products successfully`);
    await db.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error.message);
    await db.destroy();
    process.exit(1);
  }
}

seedProducts();
