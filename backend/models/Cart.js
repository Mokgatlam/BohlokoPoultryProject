const db = require('../config/db');

const Cart = {
  getCollection() { return db.carts; },

  async getOrCreate(userId) {
    let cart = await this.getCollection().findOne({ userId });
    if (!cart) {
      cart = { userId, items: [], updatedAt: new Date() };
      await this.getCollection().insert(cart);
    }
    return cart;
  },

  async addItem(userId, productId, quantity, price, name, image) {
    const cart = await this.getOrCreate(userId);
    const existing = cart.items.find(i => i.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity, price, name, image });
    }
    await this.getCollection().update({ _id: cart._id }, { $set: { items: cart.items, updatedAt: new Date() } });
    return await this.getCollection().findOne({ _id: cart._id });
  },

  async updateItem(userId, productId, quantity) {
    const cart = await this.getOrCreate(userId);
    const item = cart.items.find(i => i.productId === productId);
    if (item) {
      if (quantity <= 0) {
        cart.items = cart.items.filter(i => i.productId !== productId);
      } else {
        item.quantity = quantity;
      }
    }
    await this.getCollection().update({ _id: cart._id }, { $set: { items: cart.items, updatedAt: new Date() } });
    return await this.getCollection().findOne({ _id: cart._id });
  },

  async removeItem(userId, productId) {
    const cart = await this.getOrCreate(userId);
    cart.items = cart.items.filter(i => i.productId !== productId);
    await this.getCollection().update({ _id: cart._id }, { $set: { items: cart.items, updatedAt: new Date() } });
    return await this.getCollection().findOne({ _id: cart._id });
  },

  async clear(userId) {
    await this.getCollection().update({ userId }, { $set: { items: [], updatedAt: new Date() } });
  },

  async getSummary(userId) {
    const cart = await this.getOrCreate(userId);
    const total = cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);
    return { items: cart.items, total, itemCount, updatedAt: cart.updatedAt };
  }
};

module.exports = Cart;
