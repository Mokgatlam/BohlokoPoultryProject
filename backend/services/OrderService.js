const BaseRepository = require('../repositories/BaseRepository');
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class OrderService {
  constructor() {
    this.repo = new BaseRepository(db.orders);
    this.inventoryRepo = new BaseRepository(db.inventory);
  }

  async create(data, user) {
    const { items, deliveryOption, deliveryAddress, paymentMethod, notes } = data;

    const taxRate = (await db.systemConfig.findOne({ key: 'taxRate' }))?.value || 15;
    const shippingCostConfig = (await db.systemConfig.findOne({ key: 'shippingLocal' }))?.value || 50;

    let subtotal = 0;
    const orderItems = [];
    const stockUpdates = [];

    for (const item of items) {
      const inventory = await this.inventoryRepo.findById(item.product);
      if (!inventory) throw new Error('Product not found');
      if (inventory.quantity < item.quantity) throw new Error(`Insufficient stock for ${inventory.productType}`);

      const itemTotal = item.quantity * (inventory.pricePerUnit || 0);
      subtotal += itemTotal;
      orderItems.push({
        product: item.product, productName: inventory.productType, quantity: item.quantity,
        unit: inventory.unit, pricePerUnit: inventory.pricePerUnit, total: itemTotal
      });
      stockUpdates.push({ id: item.product, newQty: inventory.quantity - item.quantity });
    }

    const tax = subtotal * (taxRate / 100);
    const shippingCost = deliveryOption === 'local_delivery' ? shippingCostConfig : 0;
    const total = subtotal + tax + shippingCost;

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const order = await this.repo.create({
      orderNumber, customer: user._id, items: orderItems, subtotal, tax, shippingCost, total,
      deliveryOption, deliveryAddress, paymentMethod, notes
    });

    for (const update of stockUpdates) {
      const newStatus = update.newQty <= 0 ? 'sold' : 'available';
      await this.inventoryRepo.findByIdAndUpdate(update.id, { quantity: update.newQty, status: newStatus });
    }

    return order;
  }

  async getByUser(userId) {
    return await this.repo.find({ customer: userId });
  }

  async getAll() {
    return await this.repo.find();
  }

  async getById(id, user) {
    const order = await this.repo.findById(id);
    if (!order) throw new Error('Order not found');
    const customerId = order.customer ? order.customer.toString() : order.customer;
    const userId = user._id ? user._id.toString() : user._id;
    if (customerId !== userId && user.role !== 'Farm Manager' && user.role !== 'Sales Assistant') {
      throw new Error('Not authorized to view this order');
    }
    return order;
  }

  async updateStatus(id, status) {
    return await this.repo.findByIdAndUpdate(id, { status });
  }

  async cancel(id, reason, user) {
    const order = await this.repo.findById(id);
    if (!order) throw new Error('Order not found');
    const cancelCustomerId = order.customer ? order.customer.toString() : order.customer;
    const cancelUserId = user._id ? user._id.toString() : user._id;
    if (cancelCustomerId !== cancelUserId && user.role !== 'Farm Manager') {
      throw new Error('Not authorized');
    }
    if (order.status === 'Shipped' || order.status === 'Delivered') {
      throw new Error('Cannot cancel after shipping');
    }

    for (const item of order.items) {
      const inv = await this.inventoryRepo.findById(item.product);
      if (inv) await this.inventoryRepo.findByIdAndUpdate(item.product, { quantity: inv.quantity + item.quantity });
    }

    return await this.repo.findByIdAndUpdate(id, {
      status: 'Cancelled', cancellationReason: reason,
      paymentStatus: order.paymentStatus === 'Paid' ? 'Refunded' : order.paymentStatus,
      refundAmount: order.paymentStatus === 'Paid' ? order.total : 0
    });
  }

  async count(query = {}) {
    return await this.repo.count(query);
  }
}

module.exports = new OrderService();
