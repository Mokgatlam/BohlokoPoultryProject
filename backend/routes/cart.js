/**
 * Shopping Cart Routes
 * ====================
 * 
 * SRS Reference: FR-010 (Product Catalog), FR-011 (Order Placement)
 * 
 * REST API endpoints for managing the user's shopping cart. The cart is
 * a per-user temporary storage for products before order placement.
 * 
 * Endpoints Summary:
 *   GET    /api/cart              - Get cart summary (total, items, count)
 *   POST   /api/cart/items        - Add item to cart
 *   PUT    /api/cart/items/:productId - Update item quantity
 *   DELETE /api/cart/items/:productId - Remove item from cart
 *   DELETE /api/cart              - Clear entire cart
 * 
 * Design Principles:
 *   - Cart is user-scoped: each user has their own cart (identified by userId)
 *   - Cart auto-creates on first access (getOrCreate pattern)
 *   - Item quantity of 0 removes the item (convention over configuration)
 *   - Cart stores denormalized product data (name, price, image) for display
 *   - Maximum quantity per item: 999 (prevents abuse)
 *   - All endpoints require authentication (protect middleware)
 * 
 * Cart Model Pattern:
 *   - Uses a singleton object pattern (not class-based like other models)
 *   - Direct NeDB operations for performance
 *   - In-memory cart with persistent storage (read-modify-write pattern)
 * 
 * FR-010/FR-011 Requirements Covered:
 *   1. Add products to shopping cart with quantities (POST /items)
 *   2. Update cart quantities (PUT /items/:productId)
 *   3. Remove items from cart (DELETE /items/:productId)
 *   4. View cart contents and totals (GET /)
 *   5. Clear cart before new order (DELETE /)
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const cartService = require('../services/CartService');
const { protect } = require('../middleware/auth');

/**
 * GET /api/cart
 * Get cart summary with items, total price, and item count.
 * 
 * SRS: FR-011 - View shopping cart
 * Access: Any authenticated user (own cart only)
 * 
 * Returns:
 *   - items: Array of cart items with productId, quantity, price, name, image
 *   - total: Sum of (price * quantity) for all items
 *   - itemCount: Total number of items (sum of quantities)
 *   - updatedAt: Last cart modification timestamp
 * 
 * @returns {Object} Cart summary
 */
router.get('/', protect, async (req, res) => {
  try {
    const summary = await cartService.getSummary(req.user._id);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/cart/items
 * Add a product to the cart or increase quantity if already present.
 * 
 * SRS: FR-011 - Add products to shopping cart
 * Access: Any authenticated user (own cart only)
 * 
 * Validates:
 *   - productId: Required (inventory batch ID)
 *   - quantity: Integer 1-999 (prevents abuse)
 *   - price: Float >= 0 (current price at time of adding)
 *   - name: Required (product display name)
 *   - image: Optional string (product image URL)
 * 
 * Business Logic:
 *   - If product already in cart: increments quantity by requested amount
 *   - If product not in cart: adds new item entry
 *   - Stores denormalized data (name, price, image) for cart display
 * 
 * @param {string} productId - Product/inventory batch ID
 * @param {number} quantity - Quantity to add (1-999)
 * @param {number} price - Current price per unit
 * @param {string} name - Product display name
 * @param {string} [image] - Product image URL
 * @returns {Object} Updated cart with all items
 */
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

/**
 * PUT /api/cart/items/:productId
 * Update the quantity of a specific item in the cart.
 * 
 * SRS: FR-011 - Modify cart quantities
 * Access: Any authenticated user (own cart only)
 * 
 * Validates: quantity: Integer 0-999
 *   - Quantity of 0 removes the item from the cart
 *   - Quantity > 0 updates the item quantity
 * 
 * @param {string} productId - Product ID to update
 * @param {number} quantity - New quantity (0 to remove, 1-999 to set)
 * @returns {Object} Updated cart
 */
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

/**
 * DELETE /api/cart/items/:productId
 * Remove a specific item from the cart.
 * 
 * SRS: FR-011 - Remove items from cart
 * Access: Any authenticated user (own cart only)
 * 
 * @param {string} productId - Product ID to remove
 * @returns {Object} Updated cart without the removed item
 */
router.delete('/items/:productId', protect, async (req, res) => {
  try {
    const cart = await cartService.removeItem(req.user._id, req.params.productId);
    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/cart
 * Clear all items from the cart.
 * 
 * SRS: FR-011 - Clear cart before new order
 * Access: Any authenticated user (own cart only)
 * 
 * Business Logic: Sets items array to empty, updates timestamp.
 * Used when starting a new order or after order placement.
 * 
 * @returns {Object} { success: true, message: 'Cart cleared' }
 */
router.delete('/', protect, async (req, res) => {
  try {
    await cartService.clear(req.user._id);
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;