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
 * Responsibilities:
 *   - Order creation with real-time inventory validation
 *   - Stock reservation (reduce inventory on order)
 *   - Tax and shipping cost calculation
 *   - Order number generation (ORD-{timestamp}-{random6})
 *   - Order status workflow management
 *   - Order cancellation with inventory release
 *   - Refund processing for paid orders
 *   - Owner-based authorization for order access
 *   - Order count for analytics
 * 
 * Order Lifecycle:
 *   Pending -> Confirmed -> Processing -> Shipped -> Delivered
 *                                    \-> Cancelled
 * 
 * Design Principles:
 *   - Atomic operations: stock reduction happens with order creation
 *   - Cancellation releases inventory back to stock
 *   - Payment status auto-updates on cancellation
 *   - Owner-based data access (customers see only their orders)
 * 
 * Dependencies: BaseRepository, db (database), uuid (order number generation)
 */

const BaseRepository = require('../repositories/BaseRepository');
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * OrderService - Singleton service for order management operations.
 * 
 * Uses two repositories:
 *   - repo: orders collection
 *   - inventoryRepo: inventory collection (for stock validation/updates)
 */
class OrderService {
  /**
   * Initialize order and inventory repositories.
   */
  constructor() {
    this.repo = new BaseRepository(db.orders);
    this.inventoryRepo = new BaseRepository(db.inventory);
  }

  /**
   * Create a new order with inventory validation and stock reservation.
   * 
   * SRS: FR-011 - Order placement with inventory check, FR-012 - Stock reservation
   * 
   * Business Process:
   *   1. Fetch tax rate and shipping cost from systemConfig
   *   2. For each order item:
   *      a. Verify product exists in inventory
   *      b. Check sufficient stock available
   *      c. Calculate line item total (quantity * pricePerUnit)
   *      d. Prepare stock update (reduce quantity)
   *   3. Calculate order totals:
   *      - subtotal: Sum of all line items
   *      - tax: subtotal * (taxRate / 100)
   *      - shippingCost: Applied only for 'local_delivery'
   *      - total: subtotal + tax + shippingCost
   *   4. Generate unique order number
   *   5. Create order record
   *   6. Apply all stock reductions atomically
   *   7. Mark inventory as 'sold' if quantity reaches 0
   * 
   * @param {Object} data - { items, deliveryOption, deliveryAddress, paymentMethod, notes }
   * @param {Object} user - Authenticated user object
   * @returns {Object} Created order with orderNumber, totals, items
   * @throws {Error} If product not found or insufficient stock
   */
  async create(data, user) {
    const { items, deliveryOption, deliveryAddress, paymentMethod, notes } = data;

    // Fetch configuration values from systemConfig
    const taxRate = (await db.systemConfig.findOne({ key: 'taxRate' }))?.value || 15;
    const shippingCostConfig = (await db.systemConfig.findOne({ key: 'shippingLocal' }))?.value || 50;

    let subtotal = 0;
    const orderItems = [];
    const stockUpdates = [];

    // Validate inventory and calculate totals for each item
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

    // Calculate tax and shipping
    const tax = subtotal * (taxRate / 100);
    const shippingCost = deliveryOption === 'local_delivery' ? shippingCostConfig : 0;
    const total = subtotal + tax + shippingCost;

    // Generate order number and create order
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const order = await this.repo.create({
      orderNumber, customer: user._id, items: orderItems, subtotal, tax, shippingCost, total,
      deliveryOption, deliveryAddress, paymentMethod, notes
    });

    // Apply stock reductions (reserve inventory)
    for (const update of stockUpdates) {
      const newStatus = update.newQty <= 0 ? 'sold' : 'available';
      await this.inventoryRepo.findByIdAndUpdate(update.id, { quantity: update.newQty, status: newStatus });
    }

    return order;
  }

  /**
   * Get all orders for a specific user.
   * 
   * SRS: FR-011 - View order history
   * 
   * @param {string} userId - User ID (customer)
   * @returns {Array} User's orders sorted by createdAt DESC
   */
  async getByUser(userId) {
    return await this.repo.find({ customer: userId });
  }

  /**
   * Get all orders across all customers.
   * 
   * SRS: FR-012 - Admin order management
   * Used by admin/staff for order processing and fulfillment.
   * 
   * @returns {Array} All orders sorted by createdAt DESC
   */
  async getAll() {
    return await this.repo.find();
  }

  /**
   * Get a single order by ID with ownership verification.
   * 
   * SRS: FR-012 - View order details
   * 
   * Authorization Logic:
   *   - Extracts customerId from order and userId from requesting user
   *   - If customer ID matches user ID: access granted (owner)
   *   - If user role is Farm Manager or Sales Assistant: access granted (admin)
   *   - Otherwise: throws 'Not authorized' error (403)
   * 
   * @param {string} id - Order ID
   * @param {Object} user - Authenticated user object
   * @returns {Object} Order data
   * @throws {Error} If not found or not authorized
   */
  async getById(id, user) {
    const order = await this.repo.findById(id);
    if (!order) throw new Error('Order not found');
    // Owner-based authorization
    const customerId = order.customer ? order.customer.toString() : order.customer;
    const userId = user._id ? user._id.toString() : user._id;
    if (customerId !== userId && user.role !== 'Farm Manager' && user.role !== 'Sales Assistant') {
      throw new Error('Not authorized to view this order');
    }
    return order;
  }

  /**
   * Update order status (workflow progression).
   * 
   * SRS: FR-012 - Order status workflow management
   * 
   * Status Workflow:
   *   Pending -> Confirmed -> Processing -> Shipped -> Delivered
   *                                    \-> Cancelled
   * 
   * Note: This method performs a simple status update. Business rules
   * about valid transitions should be enforced at the route/controller level.
   * 
   * @param {string} id - Order ID
   * @param {string} status - New status value
   * @returns {Object} Updated order
   */
  async updateStatus(id, status) {
    return await this.repo.findByIdAndUpdate(id, { status });
  }

  /**
   * Cancel an order with inventory release and refund processing.
   * 
   * SRS: FR-014 - Order cancellation, FR-014 - Inventory release, FR-014 - Refund
   * 
   * Business Process:
   *   1. Fetch order and verify it exists
   *   2. Authorization check: owner or Farm Manager only
   *   3. Prevent cancellation if order is Shipped or Delivered
   *   4. For each order item:
   *      a. Fetch current inventory batch
   *      b. Add ordered quantity back to inventory (release reserved stock)
   *   5. Update order status to 'Cancelled'
   *   6. Record cancellation reason for analytics
   *   7. If order was paid (paymentStatus === 'Paid'):
   *      - Set paymentStatus to 'Refunded'
   *      - Record refundAmount as order total
   * 
   * @param {string} id - Order ID
   * @param {string} reason - Cancellation reason (for analytics)
   * @param {Object} user - Authenticated user (owner or admin)
   * @returns {Object} Cancelled order with refund details
   * @throws {Error} If not found, not authorized, or already shipped
   */
  async cancel(id, reason, user) {
    const order = await this.repo.findById(id);
    if (!order) throw new Error('Order not found');
    // Authorization: owner or Farm Manager
    const cancelCustomerId = order.customer ? order.customer.toString() : order.customer;
    const cancelUserId = user._id ? user._id.toString() : user._id;
    if (cancelCustomerId !== cancelUserId && user.role !== 'Farm Manager') {
      throw new Error('Not authorized');
    }
    // Cannot cancel after shipping
    if (order.status === 'Shipped' || order.status === 'Delivered') {
      throw new Error('Cannot cancel after shipping');
    }

    // Release reserved inventory back to stock
    for (const item of order.items) {
      const inv = await this.inventoryRepo.findById(item.product);
      if (inv) await this.inventoryRepo.findByIdAndUpdate(item.product, { quantity: inv.quantity + item.quantity });
    }

    // Update order with cancellation details and refund if paid
    return await this.repo.findByIdAndUpdate(id, {
      status: 'Cancelled', cancellationReason: reason,
      paymentStatus: order.paymentStatus === 'Paid' ? 'Refunded' : order.paymentStatus,
      refundAmount: order.paymentStatus === 'Paid' ? order.total : 0
    });
  }

  /**
   * Count orders matching a query.
   * 
   * SRS: FR-012 - Order analytics
   * 
   * @param {Object} query - Optional query filter
   * @returns {number} Count of matching orders
   */
  async count(query = {}) {
    return await this.repo.count(query);
  }
}

module.exports = new OrderService();