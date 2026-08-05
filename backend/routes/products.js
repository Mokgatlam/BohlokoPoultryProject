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
 *   GET    /api/products/categories - List unique categories (public)
 *   GET    /api/products/:id      - Get product by ID (public)
 *   POST   /api/products          - Create a new product (Farm Manager only)
 *   PUT    /api/products/:id      - Update product details (Farm Manager only)
 *   DELETE /api/products/:id      - Soft-delete a product (Farm Manager only)
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const validate = require('../middleware/validate');
const productService = require('../services/ProductService');
const { protect, authorize } = require('../middleware/auth');

/**
 * GET /api/products
 * List all products with optional filtering and search.
 * Access: PUBLIC
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
 * Access: PUBLIC
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
 * Access: PUBLIC
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
 * GET /api/products/categories
 * List unique categories from active products.
 * Access: PUBLIC
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await productService.getCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/products/:id
 * Get a single product by ID with full details.
 * Access: PUBLIC
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
 * Access: AUTHENTICATED + Farm Manager role only
 */
router.post('/', protect, authorize('Farm Manager'), [
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
 * Access: AUTHENTICATED + Farm Manager role only
 */
router.put('/:id', protect, authorize('Farm Manager'), [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('unit').optional().trim().notEmpty().withMessage('Unit cannot be empty')
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
 * Soft-delete a product (sets available to false).
 * Access: AUTHENTICATED + Farm Manager role only
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
