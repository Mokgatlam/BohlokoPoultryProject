/**
 * Order Service
 * =============
 * 
 * SRS Reference: FR-011 (Order Placement), FR-012 (Order Processing), FR-014 (Order Cancellation & Refunds)
 * 
 * Business logic layer for the complete order lifecycle. Handles order creation
 * with inventory validation, stock reservation, status management, cancellation
 * with inventory release, and refund processing.
 * 
 * Dependencies: db (Knex MySQL), uuid
 */

const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class OrderService {
  /**
   * Create a new order with inventory validation and stock reservation.
   */
  async create(data, user) {
    const { items, deliveryOption, deliveryAddress, paymentMethod, notes } = data;

    // Fetch configuration values from systemconfig
    const taxRateRow = await db('systemconfig').where('key', 'taxRate').first();
    const taxRate = taxRateRow ? parseFloat(taxRateRow.value) : 15;
    const shippingRow = await db('systemconfig').where('key', 'shippingLocal').first();
    const shippingCostConfig = shippingRow ? parseFloat(shippingRow.value) : 50;

    let subtotal = 0;
    const orderItems = [];
    const stockUpdates = [];

    // Validate inventory and calculate totals for each item
    for (const item of items) {
      // Check if product exists in products table
      const product = await db('products').where('id', item.product).first();
      if (!product) {
        // Try by slug
        const bySlug = await db('products').where('slug', item.product).first();
        if (!bySlug) throw new Error(`Product not found: ${item.product}`);
        item.product = bySlug.id;
      }
      
      // Check inventory for stock
      const inventory = await db('inventory').where('id', item.product).first();
      const pricePerUnit = item.price || (product ? parseFloat(product.price) : 0);
      const productName = item.productName || (product ? product.name : 'Unknown Product');
      
      if (inventory) {
        if (inventory.quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${productName}`);
        }
        stockUpdates.push({ id: item.product, newQty: inventory.quantity - item.quantity });
      }

      const itemTotal = item.quantity * pricePerUnit;
      subtotal += itemTotal;
      orderItems.push({
        product: item.product,
        productName: productName,
        quantity: item.quantity,
        unit: product ? product.unit : 'items',
        pricePerUnit: pricePerUnit,
        total: itemTotal
      });
    }

    // Calculate tax and shipping
    const tax = subtotal * (taxRate / 100);
    const shippingCost = deliveryOption === 'local_delivery' ? shippingCostConfig : 0;
    const total = subtotal + tax + shippingCost;

    // Generate order number and create order
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const orderId = uuidv4();
    
    await db('orders').insert({
      id: orderId,
      orderNumber,
      customer: user._id || user.id,
      items: JSON.stringify(orderItems),
      subtotal,
      tax,
      shippingCost,
      total,
      status: 'Pending',
      paymentStatus: paymentMethod === 'cash' ? 'Pending' : 'Unpaid',
      deliveryOption,
      deliveryAddress: deliveryAddress ? JSON.stringify(deliveryAddress) : null,
      paymentMethod,
      notes: notes || null,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Apply stock reductions (reserve inventory)
    for (const update of stockUpdates) {
      const newStatus = update.newQty <= 0 ? 'sold' : 'available';
      await db('inventory').where('id', update.id).update({
        quantity: update.newQty,
        status: newStatus,
        updated_at: new Date()
      });
    }

    return { id: orderId, orderNumber, subtotal, tax, shippingCost, total, items: orderItems };
  }

  /**
   * Get all orders for a specific user.
   */
  async getByUser(userId) {
    const orders = await db('orders').where('customer', userId).orderBy('created_at', 'desc');
    return orders.map(o => ({
      ...o,
      items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
      deliveryAddress: typeof o.deliveryAddress === 'string' ? JSON.parse(o.deliveryAddress) : o.deliveryAddress
    }));
  }

  /**
   * Get all orders across all customers.
   */
  async getAll() {
    const orders = await db('orders')
      .leftJoin('users', 'orders.customer', 'users.id')
      .select('orders.*', 'users.firstName as customerFirstName', 'users.lastName as customerLastName', 'users.email as customerEmail')
      .orderBy('orders.created_at', 'desc');
    return orders.map(o => ({
      ...o,
      customerName: [o.customerFirstName, o.customerLastName].filter(Boolean).join(' ') || null,
      items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
      deliveryAddress: typeof o.deliveryAddress === 'string' ? JSON.parse(o.deliveryAddress) : o.deliveryAddress
    }));
  }

  /**
   * Get a single order by ID with ownership verification.
   */
  async getById(id, user) {
    const order = await db('orders')
      .leftJoin('users', 'orders.customer', 'users.id')
      .select('orders.*', 'users.firstName as customerFirstName', 'users.lastName as customerLastName', 'users.email as customerEmail')
      .where('orders.id', id)
      .first();
    if (!order) throw new Error('Order not found');
    
    const customerId = order.customer ? order.customer.toString() : order.customer;
    const userId = user._id ? user._id.toString() : (user.id ? user.id.toString() : user._id);
    
    if (customerId !== userId && user.role !== 'Farm Manager' && user.role !== 'Sales Assistant') {
      throw new Error('Not authorized to view this order');
    }
    
    return {
      ...order,
      customerName: [order.customerFirstName, order.customerLastName].filter(Boolean).join(' ') || null,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
      deliveryAddress: typeof order.deliveryAddress === 'string' ? JSON.parse(order.deliveryAddress) : order.deliveryAddress
    };
  }

  /**
   * Update order status.
   */
  async updateStatus(id, status) {
    await db('orders').where('id', id).update({ status, updated_at: new Date() });
    const order = await db('orders').where('id', id).first();
    return {
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
    };
  }

  /**
   * Cancel an order with inventory release and refund processing.
   */
  async cancel(id, reason, user) {
    const order = await db('orders').where('id', id).first();
    if (!order) throw new Error('Order not found');
    
    const cancelCustomerId = order.customer ? order.customer.toString() : order.customer;
    const cancelUserId = user._id ? user._id.toString() : (user.id ? user.id.toString() : user._id);
    
    if (cancelCustomerId !== cancelUserId && user.role !== 'Farm Manager') {
      throw new Error('Not authorized');
    }
    if (order.status === 'Shipped' || order.status === 'Delivered') {
      throw new Error('Cannot cancel after shipping');
    }

    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;

    // Release reserved inventory back to stock
    for (const item of items) {
      const inv = await db('inventory').where('id', item.product).first();
      if (inv) {
        await db('inventory').where('id', item.product).update({
          quantity: inv.quantity + item.quantity,
          updated_at: new Date()
        });
      }
    }

    const updates = {
      status: 'Cancelled',
      cancellationReason: reason,
      updated_at: new Date()
    };
    
    if (order.paymentStatus === 'Paid') {
      updates.paymentStatus = 'Refunded';
      updates.refundAmount = order.total;
    }

    await db('orders').where('id', id).update(updates);
    const updated = await db('orders').where('id', id).first();
    return {
      ...updated,
      items: typeof updated.items === 'string' ? JSON.parse(updated.items) : updated.items
    };
  }

  /**
   * Count orders.
   */
  async count(filters = {}) {
    let query = db('orders');
    if (filters.status) query = query.where('status', filters.status);
    const result = await query.count('id as count').first();
    return result.count;
  }
}

module.exports = new OrderService();
