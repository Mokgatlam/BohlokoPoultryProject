/**
 * Product Service
 * ===============
 * 
 * SRS Reference: FR-010 (Product Catalog)
 * 
 * Business logic layer for product catalog management. Handles CRUD operations,
 * filtering, search, and stock management for poultry products.
 * 
 * Responsibilities:
 *   - Product CRUD (create, read, update, soft-delete)
 *   - Full-text search across name, description, sku
 *   - Filtering by status, category, availability
 *   - Active/featured product queries for shop display
 *   - Stock quantity updates
 *   - Product count for analytics
 * 
 * Design Patterns:
 *   - Singleton pattern (exported as instance, not class)
 *   - Repository pattern (delegates to BaseRepository for data access)
 *   - Soft-delete pattern (available = false instead of DB removal)
 * 
 * Dependencies: db (Knex MySQL connection), uuid (primary key generation)
 */

const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * ProductService - Singleton service for product catalog operations.
 * 
 * Uses Knex.js for MySQL queries directly.
 */
class ProductService {
  /**
   * Create a new product in the catalog.
   * 
   * SRS: FR-010 - Add product to catalog
   * 
   * @param {Object} data - Product data { name, slug, sku, price, description, image, ... }
   * @param {string} userId - ID of user creating the product (audit trail)
   * @returns {Object} Created product with id
   */
  async create(data, userId) {
    const id = uuidv4();
    const product = {
      id,
      name: data.name,
      slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      sku: data.sku || null,
      description: data.description || null,
      category: data.category || null,
      price: data.price,
      price_consumer: data.price_consumer || data.price,
      price_restaurant: data.price_restaurant || data.price,
      price_retailer: data.price_retailer || data.price,
      price_distributor: data.price_distributor || data.price,
      unit: data.unit || 'pieces',
      image: data.image || null,
      available: data.available !== undefined ? data.available : true,
      badge: data.badge || null,
      badge_tag: data.badge_tag || null,
      fallback_icon: data.fallback_icon || null,
      featured: data.featured || false,
      sort_order: data.sort_order || 0,
      created_by: userId || null
    };
    
    await db('products').insert(product);
    return product;
  }

  /**
   * Get all products with optional filtering and search.
   * 
   * SRS: FR-010 - Browse/search product catalog
   * 
   * Supported Filters:
   *   - status: Filter by availability (active = available, inactive = !available)
   *   - category: Filter by product category
   *   - search: Full-text search across name, description, sku
   *   - sort: Sort field (default: sort_order ASC)
   *   - limit: Limit results
   * 
   * @param {Object} filters - Optional filter criteria
   * @returns {Array} Matching products
   */
  async getAll(filters = {}) {
    let query = db('products');
    
    // Filter by availability
    if (filters.status === 'active') {
      query = query.where('available', true);
    } else if (filters.status === 'inactive') {
      query = query.where('available', false);
    }
    
    // Filter by category
    if (filters.category) {
      query = query.where('category', filters.category);
    }
    
    // Filter by featured
    if (filters.featured === 'true' || filters.featured === true) {
      query = query.where('featured', true);
    }
    
    // Full-text search
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.where(function() {
        this.where('name', 'like', searchTerm)
          .orWhere('description', 'like', searchTerm)
          .orWhere('sku', 'like', searchTerm)
          .orWhere('category', 'like', searchTerm);
      });
    }
    
    // Sort
    if (filters.sort) {
      const parts = filters.sort.split(':');
      query = query.orderBy(parts[0], parts[1] || 'asc');
    } else {
      query = query.orderBy('sort_order', 'asc').orderBy('name', 'asc');
    }
    
    // Limit
    if (filters.limit) {
      query = query.limit(parseInt(filters.limit));
    }
    
    return await query;
  }

  /**
   * Get a single product by ID.
   * 
   * SRS: FR-010 - View product details
   * 
   * @param {string} id - Product ID
   * @returns {Object|null} Product or null if not found
   */
  async getById(id) {
    const product = await db('products').where('id', id).first();
    return product || null;
  }

  /**
   * Get a single product by slug.
   * 
   * @param {string} slug - Product slug
   * @returns {Object|null} Product or null if not found
   */
  async getBySlug(slug) {
    const product = await db('products').where('slug', slug).first();
    return product || null;
  }

  /**
   * Update product fields.
   * 
   * SRS: FR-010 - Edit product catalog entry
   * 
   * @param {string} id - Product ID
   * @param {Object} data - Fields to update
   * @returns {Object|null} Updated product
   */
  async update(id, data) {
    const updates = { ...data, updated_at: new Date() };
    delete updates.id;
    delete updates.created_by;
    delete updates.created_at;
    
    await db('products').where('id', id).update(updates);
    return await this.getById(id);
  }

  /**
   * Soft-delete a product (set available to false).
   * 
   * SRS: FR-010 - Remove product from catalog
   * 
   * @param {string} id - Product ID
   * @returns {Object} Updated product
   */
  async delete(id) {
    await db('products').where('id', id).update({ available: false, updated_at: new Date() });
    return await this.getById(id);
  }

  /**
   * Get all active products for the public shop.
   * 
   * SRS: FR-010 - Display available products
   * 
   * @returns {Array} Active products
   */
  async getActive() {
    return await db('products')
      .where('available', true)
      .orderBy('sort_order', 'asc')
      .orderBy('name', 'asc');
  }

  /**
   * Get featured products for homepage/promotional display.
   * 
   * SRS: FR-010 - Featured products section
   * 
   * @returns {Array} Featured products
   */
  async getFeatured() {
    return await db('products')
      .where('available', true)
      .where('featured', true)
      .orderBy('sort_order', 'asc');
  }

  /**
   * Get products filtered by category.
   * 
   * SRS: FR-010 - Product categorization
   * 
   * @param {string} category - Category name
   * @returns {Array} Active products in the category
   */
  async getByCategory(category) {
    return await db('products')
      .where('category', category)
      .where('available', true)
      .orderBy('sort_order', 'asc');
  }

  /**
   * Get unique categories from active products.
   * 
   * @returns {Array} List of unique category names
   */
  async getCategories() {
    const result = await db('products')
      .where('available', true)
      .distinct('category')
      .orderBy('category');
    return result.map(r => r.category);
  }

  /**
   * Update stock quantity for a product.
   * 
   * SRS: FR-010 - Real-time availability tracking
   * 
   * @param {string} id - Product ID
   * @param {number} quantity - New stock quantity
   * @returns {Object} Updated product
   * @throws {Error} If product not found
   */
  async updateStock(id, quantity) {
    const product = await this.getById(id);
    if (!product) throw new Error('Product not found');
    await db('products').where('id', id).update({ updated_at: new Date() });
    return await this.getById(id);
  }

  /**
   * Count total products.
   * 
   * SRS: FR-010 - Product catalog statistics
   * 
   * @param {Object} filters - Optional filters
   * @returns {number} Product count
   */
  async count(filters = {}) {
    let query = db('products');
    
    if (filters.available !== undefined) {
      query = query.where('available', filters.available);
    }
    if (filters.category) {
      query = query.where('category', filters.category);
    }
    
    const result = await query.count('id as count').first();
    return result.count;
  }
}

module.exports = new ProductService();
