/**
 * Migration: Add Missing Product Columns
 * 
 * Adds slug, sku, badge, badge_tag, fallback_icon, featured, sort_order,
 * and tiered pricing columns that ProductService expects.
 */

exports.up = function(knex) {
  return knex.schema.alterTable('products', table => {
    table.string('slug', 255).after('name');
    table.string('sku', 100).after('slug');
    table.string('badge', 100).after('image');
    table.string('badge_tag', 100).after('badge');
    table.string('fallback_icon', 100).after('badge_tag');
    table.boolean('featured').defaultTo(false).after('available');
    table.integer('sort_order').defaultTo(0).after('featured');
    table.decimal('price_consumer', 10, 2).after('price');
    table.decimal('price_restaurant', 10, 2).after('price_consumer');
    table.decimal('price_retailer', 10, 2).after('price_restaurant');
    table.decimal('price_distributor', 10, 2).after('price_retailer');
    table.string('created_by', 36).after('sort_order');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('products', table => {
    table.dropColumn('slug');
    table.dropColumn('sku');
    table.dropColumn('badge');
    table.dropColumn('badge_tag');
    table.dropColumn('fallback_icon');
    table.dropColumn('featured');
    table.dropColumn('sort_order');
    table.dropColumn('price_consumer');
    table.dropColumn('price_restaurant');
    table.dropColumn('price_retailer');
    table.dropColumn('price_distributor');
    table.dropColumn('created_by');
  });
};
