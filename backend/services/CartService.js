/**
 * Cart Service
 * ============
 * 
 * SRS Reference: FR-010 (Product Catalog), FR-011 (Order Placement)
 * 
 * Business logic layer for shopping cart operations. Acts as a thin validation
 * layer between the cart routes and the Cart model, ensuring data integrity
 * before delegating to model methods.
 * 
 * Responsibilities:
 *   - Input validation (product ID, quantity, price)
 *   - Delegation to Cart model for CRUD operations
 *   - Cart summary retrieval (totals, item counts)
 * 
 * Design Principles:
 *   - Thin service layer: validates inputs, delegates to model
 *   - Cart model handles all data operations directly
 *   - Maximum quantity limit: 999 per item (prevents abuse)
 *   - Quantity of 0 = remove item (convention)
 * 
 * Cart Data Flow:
 *   Route (HTTP) -> CartService (validation) -> Cart (NeDB operations)
 * 
 * Dependencies: Cart (model)
 */

const Cart = require('../models/Cart');

/**
 * CartService - Singleton service for shopping cart operations.
 * 
 * Provides input validation and delegates to Cart model.
 */
class CartService {
  /**
   * Get or create a cart for a user.
   * 
   * SRS: FR-011 - Initialize shopping cart
   * Uses get-or-create pattern: returns existing cart or creates new one.
   * 
   * @param {string} userId - User ID
   * @returns {Object} Cart with items array
   */
  async getCart(userId) {
    return await Cart.getOrCreate(userId);
  }

  /**
   * Add an item to the cart with validation.
   * 
   * SRS: FR-011 - Add products to shopping cart
   * 
   * Validation:
   *   - productId: Required
   *   - quantity: Must be positive integer, max 999
   *   - price: Must be non-negative number
   * 
   * Business Logic (in Cart model):
   *   - If product already in cart: increments quantity
   *   - If product not in cart: adds new item entry
   * 
   * @param {string} userId - User ID
   * @param {string} productId - Product/inventory batch ID
   * @param {number} quantity - Quantity to add (1-999)
   * @param {number} price - Current price per unit
   * @param {string} name - Product display name
   * @param {string} image - Product image URL
   * @returns {Object} Updated cart
   * @throws {Error} If validation fails
   */
  async addItem(userId, productId, quantity, price, name, image) {
    if (!productId) throw new Error('Product ID is required');
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) throw new Error('Quantity must be a positive number');
    if (qty > 999) throw new Error('Quantity exceeds maximum limit');
    const p = parseFloat(price);
    if (isNaN(p) || p < 0) throw new Error('Invalid price');
    return await Cart.addItem(userId, productId, qty, p, name, image);
  }

  /**
   * Update item quantity in the cart.
   * 
   * SRS: FR-011 - Modify cart quantities
   * 
   * Convention: quantity of 0 removes the item from the cart.
   * 
   * @param {string} userId - User ID
   * @param {string} productId - Product ID to update
   * @param {number} quantity - New quantity (0 to remove, 1-999 to set)
   * @returns {Object} Updated cart
   * @throws {Error} If quantity is invalid
   */
  async updateItem(userId, productId, quantity) {
    if (!productId) throw new Error('Product ID is required');
    const qty = parseInt(quantity);
    if (isNaN(qty)) throw new Error('Invalid quantity');
    return await Cart.updateItem(userId, productId, qty);
  }

  /**
   * Remove an item from the cart.
   * 
   * SRS: FR-011 - Remove items from cart
   * 
   * @param {string} userId - User ID
   * @param {string} productId - Product ID to remove
   * @returns {Object} Updated cart
   * @throws {Error} If productId is missing
   */
  async removeItem(userId, productId) {
    if (!productId) throw new Error('Product ID is required');
    return await Cart.removeItem(userId, productId);
  }

  /**
   * Clear all items from the cart.
   * 
   * SRS: FR-011 - Clear cart
   * Used when starting a new order or after order placement.
   * 
   * @param {string} userId - User ID
   */
  async clear(userId) {
    await Cart.clear(userId);
  }

  /**
   * Get cart summary with totals and item count.
   * 
   * SRS: FR-011 - View cart contents
   * 
   * Returns:
   *   - items: Array of cart items
   *   - total: Sum of (price * quantity)
   *   - itemCount: Total quantity across all items
   *   - updatedAt: Last modification timestamp
   * 
   * @param {string} userId - User ID
   * @returns {Object} Cart summary
   */
  async getSummary(userId) {
    return await Cart.getSummary(userId);
  }
}

module.exports = new CartService();