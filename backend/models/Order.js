/**
 * Order Model
 * ============
 * 
 * SRS Reference: FR-011 (Order Placement), FR-012 (Order Processing), FR-014 (Cancellation & Refunds)
 * 
 * Data model for customer orders. Each record represents a complete order
 * including line items, pricing breakdown, delivery details, and status tracking.
 * 
 * Schema Fields:
 *   _id:              UUID - Unique identifier (auto-generated)
 *   orderNumber:      String - Unique order reference (format: ORD-{timestamp}-{random6})
 *   customer:         String - User ID of the customer who placed the order
 *   items:            Array - Order line items, each containing:
 *     - product:        String - Inventory batch ID
 *     - productName:    String - Product display name (denormalized)
 *     - quantity:       Number - Quantity ordered
 *     - unit:           String - Unit of measure (denormalized)
 *     - pricePerUnit:   Number - Price per unit at time of order
 *     - total:          Number - Line item total (quantity * pricePerUnit)
 *   subtotal:         Number - Sum of all line item totals
 *   tax:              Number - Tax amount (subtotal * taxRate / 100)
 *   shippingCost:     Number - Delivery fee (applied for local_delivery)
 *   total:            Number - Order total (subtotal + tax + shippingCost)
 *   deliveryOption:   String - Delivery method (pickup|farm_gate|local_delivery)
 *   deliveryAddress:  String - Delivery address (for local_delivery)
 *   paymentMethod:    String - Payment method (cash|bank_transfer|mobile_money|credit_card)
 *   paymentStatus:    String - Payment status (Pending|Paid|Refunded|Failed)
 *   status:           String - Order status (Pending|Confirmed|Processing|Shipped|Delivered|Cancelled)
 *   notes:            String - Customer order notes
 *   cancellationReason: String - Reason for cancellation (if cancelled)
 *   refundAmount:     Number - Amount refunded (if applicable)
 *   createdAt:        Date - Record creation timestamp
 *   updatedAt:        Date - Last modification timestamp
 * 
 * Storage: NeDB collection 'orders' (file-based, no external DB required)
 * Sorting: Default sort by createdAt DESC (newest orders first)
 * 
 * Order Lifecycle:
 *   Pending -> Confirmed -> Processing -> Shipped -> Delivered
 *                                    \-> Cancelled
 */

const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Order - Static data access layer for orders collection.
 * 
 * Provides standard CRUD operations on the orders NeDB collection.
 * Uses UUID v4 for primary key generation.
 * 
 * Note: Most order operations go through OrderService which adds
 * business logic (inventory validation, stock reservation, etc.).
 */
class Order {
  /**
   * Create a new order with auto-generated order number.
   * 
   * SRS: FR-011 - Place a new order
   * 
   * Auto-generates:
   *   - _id: UUID v4
   *   - orderNumber: ORD-{timestamp}-{random6}
   *   - status: 'Pending' (default)
   *   - paymentStatus: 'Pending' (default)
   *   - createdAt, updatedAt: Current timestamp
   * 
   * @param {Object} data - Order data (items, customer, totals, delivery, payment)
   * @returns {Object} Created order with _id, orderNumber, timestamps
   */
  static async create(data) {
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const order = { 
      _id: uuidv4(), 
      orderNumber, 
      ...data, 
      status: data.status || 'Pending',
      paymentStatus: data.paymentStatus || 'Pending',
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    await db.orders.insert(order);
    return order;
  }

  /**
   * Find orders matching a query.
   * 
   * SRS: FR-011 - View order history, FR-012 - Admin order list
   * Default sort: createdAt DESC (newest orders first)
   * 
   * @param {Object} query - NeDB query filter (defaults to all orders)
   * @returns {Array} Matching orders sorted by createdAt DESC
   */
  static async find(query = {}) {
    return await db.orders.find(query, { sort: { created_at: -1 } });
  }

  /**
   * Find a single order by ID.
   * 
   * SRS: FR-012 - View order details
   * 
   * @param {string} id - Order UUID
   * @returns {Object|null} Order or null if not found
   */
  static async findById(id) {
    return await db.orders.findOne({ _id: id });
  }

  /**
   * Find an order by ID and update its fields.
   * 
   * SRS: FR-012 - Update order, FR-014 - Cancel order
   * Automatically updates the updatedAt timestamp.
   * Returns the updated order (re-fetches after update).
   * 
   * @param {string} id - Order UUID
   * @param {Object} updates - Fields to update (status, paymentStatus, etc.)
   * @returns {Object} Updated order
   */
  static async findByIdAndUpdate(id, updates) {
    updates.updatedAt = new Date();
    await db.orders.update({ _id: id }, { $set: updates });
    return await db.orders.findOne({ _id: id });
  }

  /**
   * Count orders matching a query.
   * 
   * SRS: FR-012 - Order analytics
   * 
   * @param {Object} query - NeDB query filter (defaults to all orders)
   * @returns {number} Count of matching orders
   */
  static async count(query = {}) {
    return await db.orders.count(query);
  }
}

module.exports = Order;