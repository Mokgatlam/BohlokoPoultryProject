/**
 * Order Management Routes
 * =======================
 * 
 * SRS Reference: FR-011 (Order Placement), FR-012 (Order Processing), FR-014 (Order Cancellation & Refunds)
 * 
 * REST API endpoints for the complete order lifecycle: creation, viewing,
 * status updates, and cancellation. Supports both customer self-service
 * and admin/staff management.
 * 
 * Endpoints Summary:
 *   POST /api/orders          - Place a new order (any authenticated user)
 *   GET  /api/orders          - Get current user's orders (any authenticated user)
 *   GET  /api/orders/all      - Get all orders (Farm Manager, Sales Assistant only)
 *   GET  /api/orders/:id      - Get order by ID (owner or admin/staff)
 *   PUT  /api/orders/:id/status - Update order status (Farm Manager, Sales Assistant)
 *   PUT  /api/orders/:id/cancel - Cancel an order (owner or Farm Manager)
 * 
 * Order Lifecycle (FR-012):
 *   Pending -> Confirmed -> Processing -> Shipped -> Delivered
 *                                    \-> Cancelled (any time before Shipped)
 * 
 * Design Principles:
 *   - Authorization is owner-based: customers see only their own orders
 *   - Admin/staff can view all orders and update status
 *   - Cancellation releases reserved inventory back to stock
 *   - Payment status auto-updates to 'Refunded' on paid order cancellation
 *   - Order number format: ORD-{timestamp}-{random6}
 * 
 * Coding Principles Demonstrated:
 *   - Separation of concerns: Routes handle HTTP, Service handles business logic
 *   - Input validation via express-validator before service calls
 *   - Consistent response format: { success, data/message }
 *   - Error status codes mapped to specific error types (403, 404, 400)
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const validate = require('../middleware/validate');
const orderService = require('../services/OrderService');
const { protect, authorize } = require('../middleware/auth');

/**
 * POST /api/orders
 * Place a new order with inventory validation and stock reservation.
 * 
 * SRS: FR-011 - Order placement, FR-012 - Inventory reservation
 * Access: Any authenticated user (Customer, Staff, etc.)
 * 
 * Validates:
 *   - items: Array with at least 1 item
 *   - items.*.product: Inventory batch ID (required)
 *   - items.*.quantity: Integer >= 1 (required)
 *   - deliveryOption: One of 'pickup', 'farm_gate', 'local_delivery'
 *   - paymentMethod: One of 'cash', 'bank_transfer', 'mobile_money', 'credit_card'
 * 
 * Business Logic (handled by OrderService):
 *   1. Validates each product exists and has sufficient stock
 *   2. Calculates subtotal from inventory batch prices
 *   3. Applies tax rate from systemConfig (default 15%)
 *   4. Adds shipping cost for local_delivery option
 *   5. Generates unique order number
 *   6. Reduces inventory quantities (reserves stock)
 *   7. Creates order record with all details
 * 
 * @param {Array} items - [{ product: inventoryBatchId, quantity: number }]
 * @param {string} deliveryOption - Delivery method
 * @param {string} paymentMethod - Payment method
 * @param {string} [deliveryAddress] - Address for local_delivery
 * @param {string} [notes] - Order notes
 * @returns {Object} Created order with orderNumber, totals, status
 */
router.post('/', protect, [
  body('items').isArray({ min: 1 }),
  body('items.*.product').notEmpty(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('deliveryOption').isIn(['pickup', 'farm_gate', 'local_delivery']),
  body('paymentMethod').isIn(['cash', 'bank_transfer', 'mobile_money', 'credit_card'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const order = await orderService.create(req.body, req.user);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Server error' });
  }
});

/**
 * GET /api/orders
 * Get all orders for the current authenticated user.
 * 
 * SRS: FR-011 - View order history, FR-012 - Order tracking
 * Access: Any authenticated user (filtered to own orders)
 * 
 * @returns {Object} { success: true, data: Array<Order> } sorted by createdAt DESC
 */
router.get('/', protect, async (req, res) => {
  try {
    const orders = await orderService.getByUser(req.user._id);
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * GET /api/orders/all
 * Get all orders across all customers (admin/staff view).
 * 
 * SRS: FR-012 - Admin order management, order processing
 * Access: Farm Manager, Sales Assistant only
 * 
 * @returns {Object} { success: true, data: Array<Order> } all orders
 */
router.get('/all', protect, authorize('Farm Manager', 'Sales Assistant'), async (req, res) => {
  try {
    const orders = await orderService.getAll();
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * GET /api/orders/:id
 * Get a single order by ID with ownership verification.
 * 
 * SRS: FR-012 - View order details
 * Access: Order owner OR Farm Manager/Sales Assistant
 * 
 * Authorization Logic:
 *   - Compares order.customer with requesting user._id
 *   - If mismatch, checks if user has Farm Manager or Sales Assistant role
 *   - Returns 403 if unauthorized, 404 if not found
 * 
 * @param {string} id - Order ID
 * @returns {Object} Full order data or 403/404
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await orderService.getById(req.params.id, req.user);
    res.json({ success: true, data: order });
  } catch (error) {
    const statusCode = error.message.includes('Not authorized') ? 403 : 
                       error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ success: false, message: error.message || 'Server error' });
  }
});

/**
 * PUT /api/orders/:id/status
 * Update order status (workflow progression).
 * 
 * SRS: FR-012 - Order status workflow management
 * Access: Farm Manager, Sales Assistant only
 * 
 * Validates: status must be one of ORDER_STATUSES
 * 
 * Status Workflow:
 *   Pending -> Confirmed -> Processing -> Shipped -> Delivered
 *                                    \-> Cancelled
 * 
 * @param {string} id - Order ID
 * @param {string} status - New status value
 * @returns {Object} Updated order with new status
 */
router.put('/:id/status', protect, authorize('Farm Manager', 'Sales Assistant'), [
  body('status').isIn(['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const order = await orderService.updateStatus(req.params.id, req.body.status);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: { ...order, status: req.body.status } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * PUT /api/orders/:id/cancel
 * Cancel an order with reason, release inventory, and handle refunds.
 * 
 * SRS: FR-014 - Order cancellation, refund processing, inventory release
 * Access: Order owner OR Farm Manager
 * 
 * Validates: reason (optional, max 500 chars)
 * 
 * Business Logic (handled by OrderService):
 *   1. Verifies authorization (owner or Farm Manager)
 *   2. Prevents cancellation after shipping/delivery
 *   3. Releases reserved inventory back to stock
 *   4. If order was paid, sets paymentStatus to 'Refunded'
 *   5. Records cancellation reason for analytics
 * 
 * @param {string} id - Order ID
 * @param {string} [reason] - Cancellation reason (for analytics)
 * @returns {Object} Cancelled order with refund details
 */
router.put('/:id/cancel', protect, [
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason must be 500 characters or less')
], validate, async (req, res) => {
  try {
    const order = await orderService.cancel(req.params.id, req.body.reason, req.user);
    res.json({ success: true, data: order });
  } catch (error) {
    const statusCode = error.message.includes('Not authorized') ? 403 :
                       error.message.includes('not found') ? 404 :
                       error.message.includes('Cannot cancel') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message || 'Server error' });
  }
});

module.exports = router;