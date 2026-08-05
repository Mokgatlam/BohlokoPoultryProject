/**
 * Product Seed Script
 * 
 * Seeds the MySQL products table with all 18 products from the shop.
 * Includes tiered pricing, descriptions, images, categories, and badges.
 */

require('dotenv').config();
const knex = require('knex');
const { v4: uuidv4 } = require('uuid');
const knexConfig = require('./knexfile');

const db = knex(knexConfig.development);

const products = [
  {
    name: 'Whole Fresh Chicken',
    slug: 'whole-chicken',
    sku: 'CHK-WHOLE-001',
    description: 'Fresh whole broiler chicken, perfect for roasting, boiling, or braai.',
    category: 'whole',
    price: 89.99,
    unit: 'kg',
    image: '../../assets/images/products/whole-chicken.png',
    available: true,
    badge: 'Best Seller',
    badge_tag: 'Antibiotic Free',
    fallback_icon: 'fa-drumstick-bite',
    featured: true,
    sort_order: 1,
    price_consumer: 89.99,
    price_restaurant: 75.99,
    price_retailer: 65.99,
    price_distributor: 55.99
  },
  {
    name: 'Chicken Breast Fillets',
    slug: 'chicken-breast',
    sku: 'CHK-BREAST-002',
    description: 'Premium boneless, skinless chicken breast fillets. Lean, tender, and versatile — perfect for grilling, stir-fry, sandwiches, salads, and healthy meal prep. Low in fat, high in protein. Sourced from free-range broilers raised without antibiotics.',
    category: 'portions',
    price: 129.99,
    unit: 'kg',
    image: '../../assets/images/products/chicken-breast.png',
    available: true,
    badge: 'Popular',
    badge_tag: 'Antibiotic Free',
    fallback_icon: 'fa-cut',
    featured: false,
    sort_order: 2,
    price_consumer: 129.99,
    price_restaurant: 110.99,
    price_retailer: 95.99,
    price_distributor: 85.99
  },
  {
    name: 'Chicken Thighs',
    slug: 'chicken-thighs',
    sku: 'CHK-THIGH-003',
    description: 'Juicy, flavourful bone-in chicken thighs with skin. Perfect for braai, curries, stews, and slow-cooking. Rich in flavour and tender when cooked. Available boneless or bone-in. Great value cut for family meals and restaurants.',
    category: 'portions',
    price: 79.99,
    unit: 'kg',
    image: '../../assets/images/products/chicken-thighs.png',
    available: true,
    badge: null,
    badge_tag: 'Antibiotic Free',
    fallback_icon: 'fa-drumstick-bite',
    featured: false,
    sort_order: 3,
    price_consumer: 79.99,
    price_restaurant: 65.99,
    price_retailer: 55.99,
    price_distributor: 45.99
  },
  {
    name: 'Chicken Wings',
    slug: 'chicken-wings',
    sku: 'CHK-WINGS-004',
    description: 'Fresh whole chicken wings and wing portions. Ideal for braai, deep-frying, oven-baking, or buffalo wings. Crispy skin with tender meat. Party favourite and restaurant bestseller. Available whole or cut into drumettes and flats.',
    category: 'portions',
    price: 69.99,
    unit: 'kg',
    image: '../../assets/images/products/chicken-wings.png',
    available: true,
    badge: null,
    badge_tag: 'Hormone Free',
    fallback_icon: 'fa-feather-alt',
    featured: false,
    sort_order: 4,
    price_consumer: 69.99,
    price_restaurant: 55.99,
    price_retailer: 45.99,
    price_distributor: 35.99
  },
  {
    name: 'Marinated Chicken Pieces',
    slug: 'marinated-chicken',
    sku: 'CHK-MARIN-005',
    description: 'Ready-to-cook marinated chicken pieces infused with traditional African spices and herbs. Available in Peri-Peri, BBQ, Lemon & Herb, and Mild Curry flavours. No artificial preservatives — just fresh chicken and real spices. Perfect for quick weeknight dinners.',
    category: 'value-added',
    price: 139.99,
    unit: 'kg',
    image: '../../assets/images/products/marinated-chicken.png',
    available: true,
    badge: 'New',
    badge_tag: 'No Artificial Preservatives',
    fallback_icon: 'fa-pepper-hot',
    featured: true,
    sort_order: 5,
    price_consumer: 139.99,
    price_restaurant: 120.99,
    price_retailer: 105.99,
    price_distributor: 95.99
  },
  {
    name: 'Chicken Sausages',
    slug: 'chicken-sausages',
    sku: 'CHK-SAUS-006',
    description: 'Premium chicken sausages made from quality chicken mince with natural spices. No MSG, no artificial fillers. Available in Original, Spicy, and Garlic & Herb varieties. Perfect for braai, breakfast, or quick meals. Low in fat compared to beef sausages.',
    category: 'value-added',
    price: 119.99,
    unit: 'kg',
    image: '../../assets/images/products/chicken-sausages.png',
    available: true,
    badge: null,
    badge_tag: 'No MSG Added',
    fallback_icon: 'fa-hotdog',
    featured: false,
    sort_order: 6,
    price_consumer: 119.99,
    price_restaurant: 100.99,
    price_retailer: 85.99,
    price_distributor: 75.99
  },
  {
    name: 'Chicken Livers (500g)',
    slug: 'chicken-livers',
    sku: 'CHK-LIVER-013',
    description: 'Fresh, clean chicken livers. Rich in iron, vitamin A, and B12. Perfect for traditional dishes, pâté, stir-fry, and gravies. A nutritious and affordable protein source.',
    category: 'byproducts',
    price: 30.00,
    unit: '500g',
    image: '../../assets/images/products/chicken-livers.png',
    available: true,
    badge: null,
    badge_tag: 'Rich in Iron',
    fallback_icon: 'fa-heart',
    featured: false,
    sort_order: 7,
    price_consumer: 30.00,
    price_restaurant: 25.00,
    price_retailer: 22.00,
    price_distributor: 18.00
  },
  {
    name: 'Chicken Gizzards (500g)',
    slug: 'chicken-gizzards',
    sku: 'CHK-GIZZ-014',
    description: 'Fresh, cleaned chicken gizzards. High in protein and low in fat. Perfect for stews, curries, braais, and traditional South African dishes. Tender and flavourful when cooked properly.',
    category: 'byproducts',
    price: 30.00,
    unit: '500g',
    image: '../../assets/images/products/chicken-gizzards.png',
    available: true,
    badge: null,
    badge_tag: 'High Protein',
    fallback_icon: 'fa-drumstick-bite',
    featured: false,
    sort_order: 8,
    price_consumer: 30.00,
    price_restaurant: 25.00,
    price_retailer: 22.00,
    price_distributor: 18.00
  },
  {
    name: 'Chicken Feet (1kg) - Cleaned',
    slug: 'chicken-feet-cleaned',
    sku: 'CHK-FEET-015',
    description: 'Cleaned and trimmed chicken feet. Rich in collagen and gelatin. Perfect for making rich, flavourful stock, traditional dishes, and dim sum. Ready to cook.',
    category: 'byproducts',
    price: 50.00,
    unit: '1kg',
    image: '../../assets/images/products/chicken-feet-cleaned.png',
    available: true,
    badge: 'Popular',
    badge_tag: 'Cleaned & Ready',
    fallback_icon: 'fa-shoe-prints',
    featured: false,
    sort_order: 9,
    price_consumer: 50.00,
    price_restaurant: 42.00,
    price_retailer: 35.00,
    price_distributor: 28.00
  },
  {
    name: 'Chicken Hearts (500g)',
    slug: 'chicken-hearts',
    sku: 'CHK-HEART-016',
    description: 'Fresh chicken hearts. Lean, protein-rich organ meat. Perfect for skewers, stir-fry, stews, and braai. A delicacy in many cultures. Affordable and nutritious.',
    category: 'byproducts',
    price: 25.00,
    unit: '500g',
    image: '../../assets/images/products/chicken-hearts.png',
    available: true,
    badge: null,
    badge_tag: 'Lean Protein',
    fallback_icon: 'fa-heart',
    featured: false,
    sort_order: 10,
    price_consumer: 25.00,
    price_restaurant: 20.00,
    price_retailer: 18.00,
    price_distributor: 15.00
  },
  {
    name: 'Chicken Necks (1kg)',
    slug: 'chicken-necks',
    sku: 'CHK-NECK-017',
    description: 'Fresh chicken necks with meat. Perfect for soups, stews, stocks, and traditional dishes. Rich in flavour and collagen. Great value for money.',
    category: 'byproducts',
    price: 35.00,
    unit: '1kg',
    image: '../../assets/images/products/chicken-necks.png',
    available: true,
    badge: null,
    badge_tag: 'Great for Stock',
    fallback_icon: 'fa-bone',
    featured: false,
    sort_order: 11,
    price_consumer: 35.00,
    price_restaurant: 30.00,
    price_retailer: 25.00,
    price_distributor: 20.00
  },
  {
    name: 'Malana (1kg)',
    slug: 'malana',
    sku: 'CHK-MALN-018',
    description: 'Cleaned chicken intestines (malana). A traditional favourite in South African cuisine. Perfect for braai, stews, and traditional dishes. Cleaned and prepared for cooking.',
    category: 'byproducts',
    price: 25.00,
    unit: '1kg',
    image: '../../assets/images/products/chicken-malana.png',
    available: true,
    badge: null,
    badge_tag: 'Traditional Favourite',
    fallback_icon: 'fa-utensils',
    featured: false,
    sort_order: 12,
    price_consumer: 25.00,
    price_restaurant: 20.00,
    price_retailer: 18.00,
    price_distributor: 15.00
  },
  {
    name: 'Soup Packs (1kg)',
    slug: 'soup-packs',
    sku: 'CHK-SOUP-019',
    description: 'Mixed chicken pieces perfect for soups and stews. Includes backs, wings, necks, and feet. Great for making rich, flavourful chicken soup. Economical and delicious.',
    category: 'byproducts',
    price: 30.00,
    unit: '1kg',
    image: '../../assets/images/products/chicken-soup-pack.png',
    available: true,
    badge: 'Value',
    badge_tag: 'Perfect for Soup',
    fallback_icon: 'fa-bowl-food',
    featured: false,
    sort_order: 13,
    price_consumer: 30.00,
    price_restaurant: 25.00,
    price_retailer: 22.00,
    price_distributor: 18.00
  },
  {
    name: 'Chicken Feet (1kg) - Uncleaned',
    slug: 'chicken-feet-uncleaned',
    sku: 'CHK-FEET-020',
    description: 'Fresh uncleaned chicken feet. For customers who prefer to prepare them at home. Perfect for traditional recipes and rich stock. More affordable option.',
    category: 'byproducts',
    price: 50.00,
    unit: '1kg',
    image: '../../assets/images/products/chicken-feet-uncleaned.png',
    available: true,
    badge: null,
    badge_tag: 'Budget Friendly',
    fallback_icon: 'fa-shoe-prints',
    featured: false,
    sort_order: 14,
    price_consumer: 50.00,
    price_restaurant: 42.00,
    price_retailer: 35.00,
    price_distributor: 28.00
  },
  {
    name: '2kg Mixed Chicken Portions',
    slug: 'mixed-pack-2kg',
    sku: 'CHK-MIX2-009',
    description: 'Convenient 2kg mixed pack with a variety of chicken cuts including breast, thighs, wings, and drumsticks. Perfect for small families or meal prep. Great value — saves time and money. Pre-packed and ready to cook.',
    category: 'portions',
    price: 169.99,
    unit: 'pack',
    image: '../../assets/images/products/chicken-mixed-2kg.png',
    available: true,
    badge: 'Value Pack',
    badge_tag: 'Best Value',
    fallback_icon: 'fa-weight-hanging',
    featured: true,
    sort_order: 15,
    price_consumer: 169.99,
    price_restaurant: 149.99,
    price_retailer: 129.99,
    price_distributor: 109.99
  },
  {
    name: '3kg Chicken Portions',
    slug: 'mixed-pack-3kg',
    sku: 'CHK-MIX3-010',
    description: 'Generous 3kg family pack with mixed chicken portions. Includes a balance of breast, thighs, drumsticks, and wings. Ideal for medium-sized families, meal prep, or small gatherings. Hygienically packed and labelled.',
    category: 'portions',
    price: 249.99,
    unit: 'pack',
    image: '../../assets/images/products/chicken-mixed-3kg.png',
    available: true,
    badge: 'Family Pack',
    badge_tag: 'Family Favourite',
    fallback_icon: 'fa-weight-hanging',
    featured: false,
    sort_order: 16,
    price_consumer: 249.99,
    price_restaurant: 219.99,
    price_retailer: 189.99,
    price_distributor: 159.99
  },
  {
    name: '5kg Chicken Portions',
    slug: 'mixed-pack-5kg',
    sku: 'CHK-MIX5-011',
    description: 'Large 5kg bulk pack of mixed chicken portions. Perfect for large families, restaurants, and catering. Includes breast, thighs, drumsticks, wings, and back pieces. Cost-effective way to buy fresh chicken. Save more per kilogram.',
    category: 'portions',
    price: 399.99,
    unit: 'pack',
    image: '../../assets/images/products/chicken-mixed-5kg.png',
    available: true,
    badge: 'Bulk Deal',
    badge_tag: '5% Discount Applied',
    fallback_icon: 'fa-weight-hanging',
    featured: false,
    sort_order: 17,
    price_consumer: 399.99,
    price_restaurant: 349.99,
    price_retailer: 299.99,
    price_distributor: 259.99
  },
  {
    name: '8kg Chicken Portions',
    slug: 'mixed-pack-8kg',
    sku: 'CHK-MIX8-012',
    description: 'Wholesale 8kg bulk pack for restaurants, caterers, and retailers. Full range of chicken cuts including breast, thighs, wings, drumsticks, and back pieces. Maximum savings on bulk orders. Custom cuts available on request.',
    category: 'portions',
    price: 629.99,
    unit: 'pack',
    image: '../../assets/images/products/chicken-mixed-8kg.png',
    available: true,
    badge: 'Wholesale',
    badge_tag: '10% Discount Applied',
    fallback_icon: 'fa-weight-hanging',
    featured: false,
    sort_order: 18,
    price_consumer: 629.99,
    price_restaurant: 549.99,
    price_retailer: 469.99,
    price_distributor: 399.99
  }
];

async function seedProducts() {
  try {
    // Clear existing products
    await db('products').del();
    console.log('Cleared existing products');

    // Insert all products
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
    
    // Verify
    const count = await db('products').count('id as count').first();
    console.log(`Total products in database: ${count.count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error.message);
    process.exit(1);
  }
}

seedProducts();
