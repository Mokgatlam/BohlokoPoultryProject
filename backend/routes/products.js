/**
 * Product Catalog Routes
 * ======================
 * 
 * SRS Reference: FR-010 (Product Catalog)
 * 
 * REST API endpoints for managing the poultry product catalog. Supports
 * public browsing (no auth required for reads) and admin-only mutations.
 * 
 * Endpoints Summary:
 *   GET    /api/products          - List all products (public, with filters/search)
 *   GET    /api/products/active   - List active products only (public)
 *   GET    /api/products/featured - List featured products (public)
 *   GET    /api/products/:id      - Get product by ID (public)
 *   POST   /api/products          - Create a new product (Farm Manager only)
 *   PUT    /api/products/:id      - Update product details (Farm Manager only)
 *   DELETE /api/products/:id      - Soft-delete a product (Farm Manager only)
 * 
 * Design Principles:
 *   - Read endpoints are PUBLIC (no auth) to allow anonymous shop browsing
 *   - Write endpoints require JWT + Farm Manager role (admin-only)
 *   - Uses express-validator for input validation on all write operations
 *   - Soft-delete pattern: status set to 'deleted' rather than DB removal
 *   - Search uses regex with escaped special characters to prevent ReDoS
 * 
 * FR-010 Requirements Covered:
 *   1. Display products with images, descriptions, prices (GET /, GET /:id)
 *   3. Support product categorization (filter by category, productType)
 *   5. Display batch information for traceability (product linked to inventory)
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const validate = require('../middleware/validate');
const productService = require('../services/ProductService');
const { protect, authorize } = require('../middleware/auth');

/**
 * GET /api/products
 * List all products with optional filtering and full-text search.
 * 
 * SRS: FR-010 - Browse product catalog
 * Access: PUBLIC (no authentication required)
 * 
 * Query params:
 *   - status: Filter by status (active, inactive, featured, deleted)
 *   - category: Filter by product category
 *   - productType: Filter by product type (e.g., 'Whole Chicken')
 *   - search: Full-text search across name, description, productType
 * 
 * Search implementation: Uses NeDB regex with escaped special characters
 * to safely handle user input without ReDoS vulnerabilities.
 * 
 * @returns {Object} { success: true, data: Array<Product> }
 */
router.get('/', async (req, res) => {
  try {
    const products = await productService.getAll(req.query);
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/products/active
 * List only active products for the public shop.
 * 
 * SRS: FR-010 - Display available products
 * Access: PUBLIC
 * Filters: status = 'active' only (excludes inactive, featured, deleted)
 * 
 * @returns {Object} { success: true, data: Array<Product> }
 */
router.get('/active', async (req, res) => {
  try {
    const products = await productService.getActive();
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/products/featured
 * List featured products for homepage/promotional display.
 * 
 * SRS: FR-010 - Featured products display
 * Access: PUBLIC
 * Filters: status = 'active' AND featured = true
 * 
 * @returns {Object} { success: true, data: Array<Product> }
 */
router.get('/featured', async (req, res) => {
  try {
    const products = await productService.getFeatured();
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/products/:id
 * Get a single product by ID with full details.
 * 
 * SRS: FR-010 - View product details (images, description, price, batch info)
 * Access: PUBLIC
 * 
 * @param {string} id - Product ID
 * @returns {Object} Product data or 404
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await productService.getById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/products
 * Create a new product in the catalog.
 * 
 * SRS: FR-010 - Admin product management
 * Access: AUTHENTICATED + Farm Manager role only
 * 
 * Validates:
 *   - productType: Required (product classification)
 *   - name: Required (display name)
 *   - price: Required, float >= 0 (pricing)
 * 
 * @param {string} productType - Product type from PRODUCT_TYPES
 * @param {string} name - Product display name
 * @param {number} price - Price per unit (non-negative)
 * @returns {Object} Created product with _id
 */
router.post('/', protect, authorize('Farm Manager'), [
  body('productType').notEmpty().withMessage('Product type is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const product = await productService.create(req.body, req.user._id);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/products/:id
 * Update product details (name, price, status, etc.).
 * 
 * SRS: FR-010 - Edit product catalog entry
 * Access: AUTHENTICATED + Farm Manager role only
 * 
 * Validates (all optional for partial updates):
 *   - productType: Non-empty string
 *   - name: Non-empty string
 *   - price: Float >= 0
 *   - unit: Non-empty string
 *   - status: One of 'active', 'inactive', 'featured'
 * 
 * @param {string} id - Product ID
 * @param {Object} body - Fields to update
 * @returns {Object} Updated product or 404
 */
router.put('/:id', protect, authorize('Farm Manager'), [
  body('productType').optional().trim().notEmpty().withMessage('Product type cannot be empty'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('unit').optional().trim().notEmpty().withMessage('Unit cannot be empty'),
  body('status').optional().isIn(['active', 'inactive', 'featured']).withMessage('Invalid status')
], validate, async (req, res) => {
  try {
    const product = await productService.update(req.params.id, req.body);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/products/:id
 * Soft-delete a product (sets status to 'deleted').
 * 
 * SRS: FR-010 - Remove product from catalog
 * Access: AUTHENTICATED + Farm Manager role only
 * 
 * Design: Uses soft-delete pattern - product is NOT removed from database.
 * Instead, status is set to 'deleted' so it no longer appears in active
 * listings but remains for historical order traceability.
 * 
 * @param {string} id - Product ID
 * @returns {Object} Success message or 404
 */
router.delete('/:id', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const product = await productService.delete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;