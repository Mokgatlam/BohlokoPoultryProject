/**
 * Inventory Service
 * =================
 * 
 * SRS Reference: FR-008 (Inventory Management), FR-009 (Inventory Tracking & Reporting)
 * 
 * Business logic layer for inventory operations. Manages the complete lifecycle
 * of poultry product inventory from creation through disposal/transfer.
 * 
 * Responsibilities:
 *   - Inventory batch creation with auto-generated batch numbers
 *   - Stock quantity adjustments with audit trail
 *   - Inter-location transfers with source/destination tracking
 *   - Low stock monitoring and alerting
 *   - Order fulfillment picking lists (FIFO by expiry date)
 *   - Comprehensive inventory reporting (valuation, expiry, turnover)
 * 
 * Inventory Status Lifecycle:
 *   available -> reserved (when allocated to order)
 *   available -> sold (when order completed)
 *   available -> expired (when past expiry date)
 *   available -> damaged (when damaged)
 *   available -> transferred (when moved to another location, source batch)
 * 
 * Dependencies: BaseRepository (generic NeDB wrapper), db (database connections)
 */

const BaseRepository = require('../repositories/BaseRepository');
const db = require('../config/db');

/**
 * InventoryService - Singleton service for inventory management operations.
 * 
 * Uses BaseRepository for CRUD on the inventory NeDB collection.
 */
class InventoryService {
  /**
   * Initialize the inventory repository.
   */
  constructor() {
    this.repo = new BaseRepository(db.inventory);
  }

  /**
   * Create a new inventory batch with auto-generated batch number.
   * 
   * SRS: FR-008 - Inventory creation, batch tracking
   * Batch number format: BATCH-{timestamp}-{random9chars}
   * Example: BATCH-1725000000000-A1B2C3D4E
   * 
   * @param {Object} data - Inventory data { cycle, productType, quantity, harvestDate, expiryDate, storageLocation, ... }
   * @param {Object} user - Authenticated user object (extracts user._id for audit)
   * @returns {Object} Created inventory batch with batchNumber and createdBy
   */
  async create(data, user) {
    const batchNumber = `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    return await this.repo.create({ ...data, batchNumber, createdBy: user._id });
  }

  /**
   * Get all inventory items with optional filtering.
   * 
   * SRS: FR-008 - View inventory, FR-009 - Filter inventory
   * 
   * Supported filters:
   *   - status: Filter by inventory status (available, reserved, sold, expired, damaged, transferred)
   *   - productType: Filter by product type (from PRODUCT_TYPES constant)
   *   - location: Filter by storage location name
   * 
   * @param {Object} filters - Optional filter criteria
   * @returns {Array} Matching inventory items
   */
  async getAll(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.productType) query.productType = filters.productType;
    if (filters.location) query.storageLocation = filters.location;
    return await this.repo.find(query);
  }

  /**
   * Get inventory items below the low stock threshold.
   * 
   * SRS: FR-009 - Low stock alerts, reorder point monitoring
   * 
   * Process:
   *   1. Fetch threshold from systemConfig (key: 'lowStockThreshold', default: 10)
   *   2. Get all available inventory items
   *   3. Filter items where quantity < threshold
   * 
   * @returns {Array} Inventory items below threshold (available status only)
   */
  async getLowStock() {
    const threshold = (await db.systemConfig.findOne({ key: 'lowStockThreshold' }))?.value || 10;
    const all = await this.repo.find({ status: 'available' });
    return all.filter(item => item.quantity < threshold);
  }

  /**
   * Adjust inventory quantity for a batch.
   * 
   * SRS: FR-008 - Stock adjustment, waste/damage recording
   * 
   * The adjustment value can be:
   *   - Positive: to add stock (e.g., receiving new product)
   *   - Negative: to reduce stock (e.g., waste, damage, correction)
   * 
   * Minimum quantity after adjustment is 0 (prevents negative stock).
   * 
   * @param {string} id - Inventory batch ID
   * @param {number} adjustment - Amount to add (positive) or subtract (negative)
   * @param {string} reason - Reason for adjustment (required for audit trail)
   * @returns {Object} Updated inventory batch with new quantity
   * @throws {Error} If batch not found
   */
  async adjust(id, adjustment, reason) {
    const batch = await this.repo.findById(id);
    if (!batch) throw new Error('Batch not found');
    const newQty = Math.max(0, batch.quantity + adjustment);
    return await this.repo.findByIdAndUpdate(id, { quantity: newQty });
  }

  /**
   * Transfer inventory between storage locations.
   * 
   * SRS: FR-008 - Inter-location transfer, FR-009 - Transfer tracking
   * 
   * Process:
   *   1. Validate source batch exists and has sufficient quantity
   *   2. Create a NEW inventory batch at the destination location
   *      - New batch number: TRF-{timestamp}-{random6chars}
   *      - Copies product details (cycle, productType, harvestDate, expiryDate, pricePerUnit)
   *      - Links back to source via transferredFrom field
   *   3. Reduce source batch quantity
   *   4. If source quantity reaches 0, mark as 'transferred' status
   * 
   * @param {string} id - Source inventory batch ID
   * @param {string} toLocation - Destination storage location name
   * @param {number} transferQty - Quantity to transfer (must be > 0 and <= available)
   * @param {string} reason - Reason for transfer (audit trail)
   * @param {Object} user - Authenticated user object
   * @returns {Object} { from: updated source batch, to: new destination batch }
   * @throws {Error} If batch not found or transfer quantity exceeds available stock
   */
  async transfer(id, toLocation, transferQty, reason, user) {
    const batch = await this.repo.findById(id);
    if (!batch) throw new Error('Batch not found');
    if (transferQty > batch.quantity) throw new Error('Transfer quantity exceeds available stock');

    // Create new batch at destination with transfer tracking number
    const newBatchNumber = `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const newBatch = await this.repo.create({
      cycle: batch.cycle,
      productType: batch.productType,
      quantity: transferQty,
      batchNumber: newBatchNumber,
      harvestDate: batch.harvestDate,
      expiryDate: batch.expiryDate,
      storageLocation: toLocation,
      pricePerUnit: batch.pricePerUnit,
      status: 'available',
      transferredFrom: batch._id,
      transferReason: reason,
      createdBy: user._id
    });

    // Reduce source batch quantity; mark as transferred if depleted
    const newQty = batch.quantity - transferQty;
    await this.repo.findByIdAndUpdate(id, {
      quantity: newQty,
      status: newQty === 0 ? 'transferred' : batch.status
    });

    return { from: { ...batch, quantity: newQty }, to: newBatch };
  }

  /**
   * Get all inventory transfer records.
   * 
   * SRS: FR-009 - Transfer history, audit trail
   * Returns items that were created via transfer (have transferredFrom field).
   * 
   * @returns {Array} List of transferred inventory batches
   */
  async getTransfers() {
    return await this.repo.find({ transferredFrom: { $exists: true } });
  }

  /**
   * Generate a picking list for order fulfillment using FIFO allocation.
   * 
   * SRS: FR-008 - Order fulfillment, batch allocation, FIFO picking
   * 
   * Process:
   *   1. Fetch the order to get line items and quantities
   *   2. For each order item:
   *      a. Find all available inventory of matching productType
   *      b. Sort by expiry date ascending (FIFO - oldest expiry first)
   *      c. Allocate quantities from batches until order requirement is met
   *      d. Track any shortfalls (unfulfilled quantity)
   *   3. Return complete picking list with allocation details
   * 
   * @param {string} orderId - Order ID to generate picking list for
   * @returns {Object} Picking list with:
   *   - orderNumber, orderDate, customer
   *   - items[]: { product, requestedQty, allocations[], fulfilled, shortfall }
   *   - allFulfilled: boolean indicating if entire order can be filled
   * @throws {Error} If order not found
   */
  async getPickingList(orderId) {
    const Order = require('../models/Order');
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');

    const inventory = await this.repo.find({ status: 'available' });
    const pickingList = {
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      customer: order.customer,
      items: [],
      status: 'pending'
    };

    // Allocate inventory for each order item using FIFO by expiry
    for (const item of order.items) {
      // Find matching available batches, sorted by earliest expiry (FIFO)
      const available = inventory.filter(i =>
        i.productType === item.productName && i.quantity > 0
      ).sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

      let remaining = item.quantity;
      const allocations = [];

      // Allocate from batches in FIFO order
      for (const batch of available) {
        if (remaining <= 0) break;
        const allocQty = Math.min(remaining, batch.quantity);
        allocations.push({
          batchNumber: batch.batchNumber,
          storageLocation: batch.storageLocation,
          quantity: allocQty,
          expiryDate: batch.expiryDate
        });
        remaining -= allocQty;
      }

      pickingList.items.push({
        product: item.productName,
        requestedQty: item.quantity,
        allocations,
        fulfilled: remaining <= 0,
        shortfall: remaining > 0 ? remaining : 0
      });
    }

    // Determine if entire order can be fulfilled
    pickingList.allFulfilled = pickingList.items.every(i => i.fulfilled);
    return pickingList;
  }

  /**
   * Generate a comprehensive inventory report with analytics.
   * 
   * SRS: FR-009 - Inventory reporting, stock valuation, expiry monitoring
   * 
   * Report sections:
   *   - totalItems: Count of all inventory records
   *   - totalValue: Sum of (quantity * pricePerUnit) across all items
   *   - totalQuantity: Sum of all quantities across all items
   *   - byStatus: Quantity breakdown grouped by status
   *   - byProductType: Quantity breakdown grouped by product type
   *   - byLocation: Quantity breakdown grouped by storage location
   *   - nearExpiry: Items expiring within 7 days (still available)
   *   - expired: Items past expiry date (still available, not yet marked expired)
   *   - turnoverRate: Percentage of inventory that has been sold
   *   - summary: Count of items in each status category
   * 
   * @returns {Object} Full inventory analytics report
   */
  async getReport() {
    const inventory = await this.repo.find();
    const report = {
      totalItems: inventory.length,
      totalValue: inventory.reduce((sum, i) => sum + (i.quantity * (i.pricePerUnit || 0)), 0),
      totalQuantity: inventory.reduce((sum, i) => sum + i.quantity, 0),
      byStatus: {}, byProductType: {}, byLocation: {},
      nearExpiry: [], expired: [],
      summary: { available: 0, reserved: 0, sold: 0, expired: 0, damaged: 0, transferred: 0 }
    };

    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    inventory.forEach(item => {
      // Aggregate by status, product type, and location
      report.byStatus[item.status] = (report.byStatus[item.status] || 0) + 1;
      report.byProductType[item.productType] = (report.byProductType[item.productType] || 0) + item.quantity;
      report.byLocation[item.storageLocation] = (report.byLocation[item.storageLocation] || 0) + item.quantity;
      report.summary[item.status] = (report.summary[item.status] || 0) + 1;

      // Check expiry status (only for available items)
      if (item.expiryDate <= now && item.status === 'available') {
        report.expired.push({ batchNumber: item.batchNumber, productType: item.productType, quantity: item.quantity, expiryDate: item.expiryDate });
      } else if (item.expiryDate <= weekFromNow && item.status === 'available') {
        report.nearExpiry.push({ batchNumber: item.batchNumber, productType: item.productType, quantity: item.quantity, expiryDate: item.expiryDate });
      }
    });

    // Calculate turnover rate (sold / total quantity)
    report.turnoverRate = report.totalQuantity > 0 ? (report.summary.sold / report.totalQuantity * 100).toFixed(1) : 0;
    return report;
  }

  /**
   * Count inventory items matching a query.
   * 
   * SRS: FR-009 - Inventory statistics
   * 
   * @param {Object} query - Optional query filter (defaults to all items)
   * @returns {number} Count of matching inventory items
   */
  async count(query = {}) {
    return await this.repo.count(query);
  }
}

module.exports = new InventoryService();