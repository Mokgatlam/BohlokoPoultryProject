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
 *   - Full-text search across name, description, productType
 *   - Filtering by status, category, productType
 *   - Active/featured product queries for shop display
 *   - Stock quantity updates
 *   - Product count for analytics
 * 
 * Design Patterns:
 *   - Singleton pattern (exported as instance, not class)
 *   - Repository pattern (delegates to BaseRepository for data access)
 *   - Soft-delete pattern (status = 'deleted' instead of DB removal)
 * 
 * Search Implementation:
 *   - Uses NeDB regex with user input escaped to prevent ReDoS
 *   - Case-insensitive search across multiple fields
 *   - OR query: matches if ANY field contains the search term
 * 
 * Dependencies: BaseRepository (generic NeDB wrapper), db (database connections)
 */

const BaseRepository = require('../repositories/BaseRepository');
const db = require('../config/db');

/**
 * ProductService - Singleton service for product catalog operations.
 * 
 * Manages the products collection in NeDB.
 */
class ProductService {
  /**
   * Initialize the product repository.
   */
  constructor() {
    this.repo = new BaseRepository(db.products);
  }

  /**
   * Create a new product in the catalog.
   * 
   * SRS: FR-010 - Add product to catalog
   * 
   * @param {Object} data - Product data { productType, name, price, description, image, ... }
   * @param {string} userId - ID of user creating the product (audit trail)
   * @returns {Object} Created product with _id and createdBy
   */
  async create(data, userId) {
    return await this.repo.create({ ...data, createdBy: userId });
  }

  /**
   * Get all products with optional filtering and full-text search.
   * 
   * SRS: FR-010 - Browse/search product catalog
   * 
   * Supported Filters:
   *   - status: Filter by product status (active, inactive, featured, deleted)
   *   - category: Filter by product category
   *   - productType: Filter by product type (e.g., 'Whole Chicken')
   *   - search: Full-text search across name, description, productType
   * 
   * Search Implementation:
   *   - Escapes special regex characters to prevent ReDoS attacks
   *   - Creates OR query across name, description, productType fields
   *   - Case-insensitive matching via RegExp('term', 'i')
   * 
   * @param {Object} filters - Optional filter criteria
   * @returns {Array} Matching products
   */
  async getAll(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.category) query.category = filters.category;
    if (filters.productType) query.productType = filters.productType;
    if (filters.search) {
      // Escape special regex characters to prevent ReDoS
      const safe = filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: new RegExp(safe, 'i') },
        { description: new RegExp(safe, 'i') },
        { productType: new RegExp(safe, 'i') }
      ];
    }
    return await this.repo.find(query);
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
    return await this.repo.findById(id);
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
    return await this.repo.findByIdAndUpdate(id, data);
  }

  /**
   * Soft-delete a product (set status to 'deleted').
   * 
   * SRS: FR-010 - Remove product from catalog
   * 
   * Design: Uses soft-delete to preserve historical data integrity.
   * Deleted products remain in the database for order traceability
   * but are excluded from active catalog queries.
   * 
   * @param {string} id - Product ID
   * @returns {Object} Updated product with status='deleted'
   */
  async delete(id) {
    return await this.repo.findByIdAndUpdate(id, { status: 'deleted' });
  }

  /**
   * Get all active products for the public shop.
   * 
   * SRS: FR-010 - Display available products
   * Filters: status = 'active' only
   * 
   * @returns {Array} Active products
   */
  async getActive() {
    return await this.repo.find({ status: 'active' });
  }

  /**
   * Get featured products for homepage/promotional display.
   * 
   * SRS: FR-010 - Featured products section
   * Filters: status = 'active' AND featured = true
   * 
   * @returns {Array} Featured products
   */
  async getFeatured() {
    return await this.repo.find({ status: 'active', featured: true });
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
    return await this.repo.find({ category, status: 'active' });
  }

  /**
   * Update stock quantity for a product.
   * 
   * SRS: FR-010 - Real-time availability tracking
   * 
   * Note: This updates the product-level stock field. For inventory-level
   * stock management, see InventoryService.
   * 
   * @param {string} id - Product ID
   * @param {number} quantity - New stock quantity
   * @returns {Object} Updated product
   * @throws {Error} If product not found
   */
  async updateStock(id, quantity) {
    const product = await this.repo.findById(id);
    if (!product) throw new Error('Product not found');
    return await this.repo.findByIdAndUpdate(id, { stock: quantity });
  }

  /**
   * Count total products.
   * 
   * SRS: FR-010 - Product catalog statistics
   * 
   * @returns {number} Total product count
   */
  async count() {
    return await this.repo.count();
  }
}

module.exports = new ProductService();