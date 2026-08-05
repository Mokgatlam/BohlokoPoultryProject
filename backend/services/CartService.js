const Cart = require('../models/Cart');

class CartService {
  async getCart(userId) {
    return await Cart.getOrCreate(userId);
  }

  async addItem(userId, productId, quantity, price, name, image) {
    if (!productId) throw new Error('Product ID is required');
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) throw new Error('Quantity must be a positive number');
    if (qty > 999) throw new Error('Quantity exceeds maximum limit');
    const p = parseFloat(price);
    if (isNaN(p) || p < 0) throw new Error('Invalid price');
    return await Cart.addItem(userId, productId, qty, p, name, image);
  }

  async updateItem(userId, productId, quantity) {
    if (!productId) throw new Error('Product ID is required');
    const qty = parseInt(quantity);
    if (isNaN(qty)) throw new Error('Invalid quantity');
    return await Cart.updateItem(userId, productId, qty);
  }

  async removeItem(userId, productId) {
    if (!productId) throw new Error('Product ID is required');
    return await Cart.removeItem(userId, productId);
  }

  async clear(userId) {
    await Cart.clear(userId);
  }

  async getSummary(userId) {
    return await Cart.getSummary(userId);
  }
}

module.exports = new CartService();
