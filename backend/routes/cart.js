const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const cartService = require('../services/CartService');
const { protect } = require('../middleware/auth');

// @route   GET /api/cart
// @desc    Get cart summary
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const summary = await cartService.getSummary(req.user._id);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/cart/items
// @desc    Add item to cart
// @access  Private
router.post('/items', protect, [
  body('productId').notEmpty().withMessage('Product ID is required'),
  body('quantity').isInt({ min: 1, max: 999 }).withMessage('Quantity must be a positive number (1-999)'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('name').notEmpty().withMessage('Product name is required'),
  body('image').optional().isString()
], validate, async (req, res) => {
  try {
    const { productId, quantity, price, name, image } = req.body;
    const cart = await cartService.addItem(req.user._id, productId, quantity, price, name, image);
    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/cart/items/:productId
// @desc    Update cart item quantity
// @access  Private
router.put('/items/:productId', protect, [
  body('quantity').isInt({ min: 0, max: 999 }).withMessage('Quantity must be an integer (0-999)')
], validate, async (req, res) => {
  try {
    const cart = await cartService.updateItem(req.user._id, req.params.productId, req.body.quantity);
    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/cart/items/:productId
// @desc    Remove item from cart
// @access  Private
router.delete('/items/:productId', protect, async (req, res) => {
  try {
    const cart = await cartService.removeItem(req.user._id, req.params.productId);
    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/cart
// @desc    Clear cart
// @access  Private
router.delete('/', protect, async (req, res) => {
  try {
    await cartService.clear(req.user._id);
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;