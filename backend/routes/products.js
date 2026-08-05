const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const validate = require('../middleware/validate');
const productService = require('../services/ProductService');
const { protect, authorize } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const products = await productService.getAll(req.query);
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/active', async (req, res) => {
  try {
    const products = await productService.getActive();
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/featured', async (req, res) => {
  try {
    const products = await productService.getFeatured();
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await productService.getById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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
