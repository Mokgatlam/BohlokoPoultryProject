/**
 * Migration: Add tiered pricing and product metadata to products table
 * 
 * Adds columns for slug, SKU, tiered pricing (Consumer/Restaurant/Retailer/Distributor),
 * badges, fallback icon, and badge tag text.
 */

exports.up = function(knex) {
  return knex.schema.table('products', function(table) {
    table.string('slug', 100).unique().after('name');
    table.string('sku', 50).after('slug');
    table.decimal('price_consumer', 10, 2).after('price');
    table.decimal('price_restaurant', 10, 2).after('price_consumer');
    table.decimal('price_retailer', 10, 2).after('price_restaurant');
    table.decimal('price_distributor', 10, 2).after('price_retailer');
    table.string('badge', 50).after('available');
    table.string('badge_tag', 100).after('badge');
    table.string('fallback_icon', 50).after('badge_tag');
    table.boolean('featured').defaultTo(false).after('fallback_icon');
    table.integer('sort_order').defaultTo(0).after('featured');
  });
};

exports.down = function(knex) {
  return knex.schema.table('products', function(table) {
    table.dropColumn('slug');
    table.dropColumn('sku');
    table.dropColumn('price_consumer');
    table.dropColumn('price_restaurant');
    table.dropColumn('price_retailer');
    table.dropColumn('price_distributor');
    table.dropColumn('badge');
    table.dropColumn('badge_tag');
    table.dropColumn('fallback_icon');
    table.dropColumn('featured');
    table.dropColumn('sort_order');
  });
};
