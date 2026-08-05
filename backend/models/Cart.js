/**
 * Cart Model
 * ===========
 * 
 * SRS Reference: FR-010 (Product Catalog), FR-011 (Order Placement)
 * 
 * Data model for the shopping cart. Each user has one cart containing
 * product items with quantities, ready for checkout.
 * 
 * MySQL Schema:
 *   id:        varchar(36) - Primary key (UUID)
 *   userId:    varchar(36) - User ID (one cart per user)
 *   items:     json - Cart items array (productId, quantity, price, name, image)
 *   updatedAt: timestamp - Last modification timestamp
 * 
 * Design Patterns:
 *   - Singleton object pattern (not class-based like other models)
 *   - Get-or-create pattern (ensures cart exists before operations)
 *   - Denormalized product data (name, price, image stored in cart)
 *   - Read-modify-write pattern for atomic updates
 * 
 * Dependencies: db (Knex MySQL connection), uuid
 */

const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Cart - Singleton object for shopping cart operations.
 * 
 * Uses Knex.js MySQL queries directly.
 */
const Cart = {
  /**
   * Get existing cart for a user, or create a new empty cart.
   * 
   * SRS: FR-011 - Initialize shopping cart
   * 
   * @param {string} userId - User ID
   * @returns {Object} Cart object with items array
   */
  async getOrCreate(userId) {
    let cart = await db('carts').where('userId', userId).first();
    if (!cart) {
      const id = uuidv4();
      cart = { id, userId, items: JSON.stringify([]), updatedAt: new Date() };
      await db('carts').insert(cart);
      cart.items = [];
    } else {
      cart.items = typeof cart.items === 'string' ? JSON.parse(cart.items) : (cart.items || []);
    }
    return cart;
  },

  /**
   * Add an item to the cart, or increment quantity if already present.
   * 
   * SRS: FR-011 - Add products to shopping cart
   * 
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   * @param {number} quantity - Quantity to add
   * @param {number} price - Current price per unit
   * @param {string} name - Product display name
   * @param {string} image - Product image URL
   * @returns {Object} Updated cart
   */
  async addItem(userId, productId, quantity, price, name, image) {
    const cart = await this.getOrCreate(userId);
    const items = Array.isArray(cart.items) ? cart.items : [];
    const existing = items.find(i => i.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({ productId, quantity, price, name, image });
    }
    await db('carts').where('id', cart.id).update({
      items: JSON.stringify(items),
      updatedAt: new Date()
    });
    return { ...cart, items };
  },

  /**
   * Update item quantity in the cart.
   * 
   * SRS: FR-011 - Modify cart quantities
   * 
   * @param {string} userId - User ID
   * @param {string} productId - Product ID to update
   * @param {number} quantity - New quantity (0 or less = remove)
   * @returns {Object} Updated cart
   */
  async updateItem(userId, productId, quantity) {
    const cart = await this.getOrCreate(userId);
    let items = Array.isArray(cart.items) ? cart.items : [];
    if (quantity <= 0) {
      items = items.filter(i => i.productId !== productId);
    } else {
      const item = items.find(i => i.productId === productId);
      if (item) item.quantity = quantity;
    }
    await db('carts').where('id', cart.id).update({
      items: JSON.stringify(items),
      updatedAt: new Date()
    });
    return { ...cart, items };
  },

  /**
   * Remove a specific item from the cart.
   * 
   * SRS: FR-011 - Remove items from cart
   * 
   * @param {string} userId - User ID
   * @param {string} productId - Product ID to remove
   * @returns {Object} Updated cart
   */
  async removeItem(userId, productId) {
    const cart = await this.getOrCreate(userId);
    let items = Array.isArray(cart.items) ? cart.items : [];
    items = items.filter(i => i.productId !== productId);
    await db('carts').where('id', cart.id).update({
      items: JSON.stringify(items),
      updatedAt: new Date()
    });
    return { ...cart, items };
  },

  /**
   * Clear all items from the cart.
   * 
   * SRS: FR-011 - Clear cart
   * 
   * @param {string} userId - User ID
   */
  async clear(userId) {
    const cart = await this.getOrCreate(userId);
    await db('carts').where('id', cart.id).update({
      items: JSON.stringify([]),
      updatedAt: new Date()
    });
  },

  /**
   * Get cart summary with totals and item count.
   * 
   * SRS: FR-011 - View cart contents and totals
   * 
   * @param {string} userId - User ID
   * @returns {Object} Cart summary with items, total, itemCount
   */
  async getSummary(userId) {
    const cart = await this.getOrCreate(userId);
    const items = Array.isArray(cart.items) ? cart.items : [];
    const total = items.reduce((sum, i) => sum + (parseFloat(i.price) * i.quantity), 0);
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    return { items, total, itemCount, updatedAt: cart.updatedAt };
  }
};

module.exports = Cart;
