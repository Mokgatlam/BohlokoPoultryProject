/**
 * Analytics Service
 * =================
 * 
 * SRS Reference: FR-017 (Production Analytics), FR-018 (Sales & Financial Analytics),
 *                FR-019 (Inventory Analytics)
 * 
 * Centralized analytics engine for the Bohloko Family Farm system. Computes
 * production metrics, sales analytics, inventory analytics, profit & loss
 * statements, and inventory aging reports.
 * 
 * Architecture:
 *   - Facade Pattern: Single service consolidates analytics across 3 domains
 *   - Read-Only: Only queries data, never modifies records
 *   - Computed Fields: All metrics calculated in real-time from raw data
 *   - No Caching: Each request re-computes from source (simple, always fresh)
 * 
 * Dependencies (reads from):
 *   - ProductionCycle, DailyLog, Medication, FeedRecord (from Production.js)
 *   - Inventory (from Inventory.js)
 *   - Order (from Order.js)
 *   - User (from User.js)
 * 
 * Metrics Formulas:
 *   - Mortality Rate: (totalMortality / totalBirds) * 100
 *   - Feed Conversion Ratio (FCR): totalFeed / totalBirds
 *   - Average Order Value: totalRevenue / completedOrders
 *   - Waste Percentage: (expired + damaged) / totalQuantity * 100
 *   - Profit Margin: (netProfit / totalRevenue) * 100
 *   - Holding Cost: quantity * R2/kg/day (estimated)
 */

const { ProductionCycle, DailyLog, Medication, FeedRecord } = require('../models/Production');
const Inventory = require('../models/Inventory');
const Order = require('../models/Order');
const User = require('../models/User');

class AnalyticsService {
  // =========================================================================
  // FR-017: PRODUCTION ANALYTICS
  // =========================================================================

  /**
   * Calculate production performance metrics across all completed cycles.
   * 
   * SRS: FR-017 - Production Analytics
   * 
   * Metrics Computed:
   *   1. totalCycles: Count of completed production cycles
   *   2. mortalityRate: (totalMortality / totalBirds) * 100
   *      - Warning: >5% indicates health issues
   *   3. feedConversionRatio (FCR): totalFeed / totalBirds
   *      - Lower is better (target: 1.8-2.2 for broilers)
   *   4. costAnalysis: Budget vs Actual with variance
   *      - Positive variance = under budget (good)
   *   5. performance[]: Per-cycle breakdown with completion rates
   *      - completionRate: (actualBirds / expectedBirds) * 100
   * 
   * Data Sources:
 *     - ProductionCycle: For cycle metadata, expected/actual birds, budget/costs
   *     - DailyLog: For mortality counts, feed consumption, bird counts
   * 
   * @returns {Object} Production analytics with metrics and per-cycle performance
   */
  async getProductionAnalytics() {
    const cycles = await ProductionCycle.find({ status: 'Completed' });
    const logs = await DailyLog.find();

    const analytics = {
      totalCycles: cycles.length,
      averageCycleDuration: 0,
      mortalityRate: 0,
      feedConversionRatio: 0,
      costAnalysis: { totalBudget: 0, totalActual: 0, variance: 0 },
      performance: cycles.map(c => ({
        name: c.cycleName,
        type: c.productionType,
        expectedBirds: c.expectedBirds,
        actualBirds: c.actualBirds,
        completionRate: c.expectedBirds > 0 ? ((c.actualBirds / c.expectedBirds) * 100).toFixed(2) : 0
      }))
    };

    // Aggregate cost data from all completed cycles
    if (cycles.length > 0) {
      analytics.costAnalysis.totalBudget = cycles.reduce((s, c) => s + (c.budget?.total || 0), 0);
      analytics.costAnalysis.totalActual = cycles.reduce((s, c) => s + (c.actualCosts?.total || 0), 0);
      analytics.costAnalysis.variance = analytics.costAnalysis.totalBudget - analytics.costAnalysis.totalActual;
    }

    // Calculate mortality rate and feed conversion ratio from daily logs
    if (logs.length > 0) {
      const totalMortality = logs.reduce((s, l) => s + (l.mortality?.count || 0), 0);
      const totalBirds = logs.reduce((s, l) => s + l.birdCount, 0);
      // Mortality Rate: deaths / total bird-days * 100
      analytics.mortalityRate = totalBirds > 0 ? ((totalMortality / totalBirds) * 100).toFixed(2) : 0;
      // FCR: total feed consumed / total bird-days
      const totalFeed = logs.reduce((s, l) => s + (l.feedConsumption || 0), 0);
      analytics.feedConversionRatio = totalFeed > 0 ? (totalFeed / totalBirds).toFixed(2) : 0;
    }

    return analytics;
  }

  // =========================================================================
  // FR-018: SALES & FINANCIAL ANALYTICS
  // =========================================================================

  /**
   * Calculate sales performance analytics across all delivered orders.
   * 
   * SRS: FR-018 - Sales & Financial Analytics
   * 
   * Metrics Computed:
   *   1. totalOrders: Count of all orders (any status)
   *   2. completedOrders: Count of delivered orders
   *   3. totalRevenue: Sum of delivered order totals
   *   4. averageOrderValue: totalRevenue / completedOrders
   *   5. revenueByProduct: Revenue grouped by product name
   *   6. revenueByPaymentMethod: Revenue grouped by payment method
   *   7. revenueByDeliveryOption: Revenue grouped by delivery option
   *   8. revenueByMonth: Revenue grouped by YYYY-MM (for trend analysis)
   *   9. pendingPayments: Orders with paymentStatus='Pending'
   *   10. refunds: Orders with paymentStatus='Refunded'
   * 
   * Data Sources:
   *   - Order: Delivered orders for revenue, all orders for counts
   * 
   * @returns {Object} Sales analytics with revenue breakdowns
   */
  async getSalesAnalytics() {
    const orders = await Order.find({ status: 'Delivered' });
    const allOrders = await Order.find();

    const analytics = {
      totalOrders: allOrders.length,
      completedOrders: orders.length,
      totalRevenue: orders.reduce((s, o) => s + o.total, 0),
      averageOrderValue: 0,
      revenueByProduct: {},
      revenueByPaymentMethod: {},
      revenueByDeliveryOption: {},
      revenueByMonth: {},
      revenueByCustomerType: {},
      pendingPayments: allOrders.filter(o => o.paymentStatus === 'Pending').length,
      refunds: allOrders.filter(o => o.paymentStatus === 'Refunded').length
    };

    // Calculate AOV and revenue breakdowns from delivered orders
    if (orders.length > 0) {
      analytics.averageOrderValue = analytics.totalRevenue / orders.length;
      orders.forEach(order => {
        // Revenue by product (from order line items)
        order.items?.forEach(item => {
          analytics.revenueByProduct[item.productName] = (analytics.revenueByProduct[item.productName] || 0) + item.total;
        });
        // Revenue by payment method
        analytics.revenueByPaymentMethod[order.paymentMethod] = (analytics.revenueByPaymentMethod[order.paymentMethod] || 0) + order.total;
        // Revenue by delivery option
        analytics.revenueByDeliveryOption[order.deliveryOption] = (analytics.revenueByDeliveryOption[order.deliveryOption] || 0) + order.total;
        // Revenue by month (for trend analysis)
        const month = new Date(order.createdAt).toISOString().slice(0, 7);
        analytics.revenueByMonth[month] = (analytics.revenueByMonth[month] || 0) + order.total;
      });
    }

    return analytics;
  }

  // =========================================================================
  // FR-018: PROFIT & LOSS STATEMENT
  // =========================================================================

  /**
   * Generate a comprehensive Profit & Loss (P&L) statement.
   * 
   * SRS: FR-018 - Profit and Loss Statement
   * 
   * P&L Structure:
   *   Revenue:
   *     - salesRevenue: Sum of delivered order totals
   *     - otherRevenue: Placeholder for non-sales income
   *     - totalRevenue: salesRevenue + otherRevenue
   * 
   *   Cost of Goods Sold (COGS):
   *     - beginningInventory: Starting inventory value
   *     - productionCosts: Feed + Medications + Labor + Utilities
   *     - purchases: External purchases
   *     - endingInventory: Current inventory value
   *     - totalCOGS: (from order items) or (productionCosts - endingInventory)
   * 
   *   Gross Profit: totalRevenue - totalCOGS
   * 
   *   Operating Expenses:
   *     - labor: From production cycle actualCosts
   *     - feed: From feed records
   *     - medications: From medication records
   *     - utilities: From production cycle actualCosts
   *     - waste: Value of expired + damaged inventory
   *     - holding: 2% of inventory value (estimated storage cost)
   *     - total: Sum of all operating expenses
   * 
   *   Net Profit: grossProfit - totalOperatingExpenses
   *   Profit Margin: (netProfit / totalRevenue) * 100
   * 
   * Data Sources:
   *   - Order: Revenue from delivered orders
   *   - ProductionCycle: Labor and utility costs
   *   - FeedRecord: Feed costs
   *   - Medication: Medication costs
   *   - Inventory: Ending inventory value, waste value
   * 
   * @returns {Object} Full P&L statement with revenue, COGS, expenses, net profit
   */
  async getProfitLoss() {
    const orders = await Order.find({ status: 'Delivered' });
    const cycles = await ProductionCycle.find();
    const inventory = await Inventory.find();
    const feedRecords = await FeedRecord.find({});
    const medications = await Medication.find({});

    // Revenue from delivered orders
    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    // COGS from order line item costs
    const totalCOGS = orders.reduce((s, o) => s + (o.items?.reduce((sum, i) => sum + (i.cost || 0), 0) || 0), 0);

    // Production cost breakdown
    const feedCost = feedRecords.reduce((s, f) => s + (f.cost || 0), 0);
    const medicationCost = medications.reduce((s, m) => s + (m.cost || 0), 0);
    const laborCost = cycles.reduce((s, c) => s + (c.actualCosts?.labor || 0), 0);
    const utilityCost = cycles.reduce((s, c) => s + (c.actualCosts?.utilities || 0), 0);
    const totalProductionCost = feedCost + medicationCost + laborCost + utilityCost;

    // Inventory valuation
    const inventoryValue = inventory.reduce((s, i) => s + (i.quantity * (i.pricePerUnit || 0)), 0);
    const wasteValue = inventory.filter(i => i.status === 'expired' || i.status === 'damaged')
      .reduce((s, i) => s + (i.quantity * (i.pricePerUnit || 0)), 0);

    // Profit calculations
    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - totalProductionCost;

    return {
      revenue: {
        salesRevenue: totalRevenue,
        otherRevenue: 0,
        totalRevenue
      },
      costOfGoodsSold: {
        beginningInventory: 0,
        productionCosts: totalProductionCost,
        purchases: 0,
        endingInventory: inventoryValue,
        totalCOGS: totalCOGS || (totalProductionCost - inventoryValue)
      },
      grossProfit,
      operatingExpenses: {
        labor: laborCost,
        feed: feedCost,
        medications: medicationCost,
        utilities: utilityCost,
        waste: wasteValue,
        holding: inventoryValue * 0.02,
        total: totalProductionCost + wasteValue + (inventoryValue * 0.02)
      },
      netProfit,
      profitMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0
    };
  }

  // =========================================================================
  // FR-019: INVENTORY ANALYTICS
  // =========================================================================

  /**
   * Calculate inventory performance analytics.
   * 
   * SRS: FR-019 - Inventory Analytics
   * 
   * Metrics Computed:
   *   1. totalItems: Count of inventory records
   *   2. totalValue: Sum of (quantity * pricePerUnit)
   *   3. totalQuantity: Sum of all quantities
   *   4. byStatus: Quantity grouped by status
   *   5. byProductType: Quantity grouped by product type
   *   6. byLocation: Quantity grouped by storage location
   *   7. nearExpiry: Items expiring within 7 days (available only)
   *   8. expired: Items past expiry date (available only)
   *   9. holdingCost: R2/kg/day * quantity (for available items)
   *   10. wastePercentage: (expired + damaged) / totalQuantity * 100
   *   11. summary: Count of items in each status
   * 
   * Holding Cost Formula: quantity * R2 (estimated daily storage cost per kg)
   * Waste Formula: (expired + damaged count) / totalQuantity * 100
   * 
   * Data Sources:
   *   - Inventory: All inventory records
   * 
   * @returns {Object} Inventory analytics with breakdowns, expiry, waste
   */
  async getInventoryAnalytics() {
    const inventory = await Inventory.find();
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const analytics = {
      totalItems: inventory.length,
      totalValue: inventory.reduce((s, i) => s + (i.quantity * (i.pricePerUnit || 0)), 0),
      totalQuantity: inventory.reduce((s, i) => s + i.quantity, 0),
      byStatus: {},
      byProductType: {},
      byLocation: {},
      nearExpiry: [],
      expired: [],
      slowMoving: [],
      turnoverRate: 0,
      holdingCost: 0,
      wastePercentage: 0,
      summary: { available: 0, reserved: 0, sold: 0, expired: 0, damaged: 0 }
    };

    // Aggregate inventory data and check expiry
    inventory.forEach(item => {
      analytics.byStatus[item.status] = (analytics.byStatus[item.status] || 0) + item.quantity;
      analytics.byProductType[item.productType] = (analytics.byProductType[item.productType] || 0) + item.quantity;
      analytics.byLocation[item.storageLocation] = (analytics.byLocation[item.storageLocation] || 0) + item.quantity;
      analytics.summary[item.status] = (analytics.summary[item.status] || 0) + 1;

      // Near-expiry: items expiring within 7 days (still available)
      if (item.expiryDate <= weekFromNow && item.status === 'available') {
        analytics.nearExpiry.push({ batchNumber: item.batchNumber, productType: item.productType, quantity: item.quantity });
      }
      // Expired: items past expiry date (still available, not yet marked)
      if (item.expiryDate < now && item.status === 'available') {
        analytics.expired.push({ batchNumber: item.batchNumber, productType: item.productType });
      }
      // Holding cost: estimated R2/kg/day for available items
      if (item.status === 'available') {
        analytics.holdingCost += item.quantity * 2;
      }
    });

    // Waste percentage: (expired + damaged) / total * 100
    analytics.wastePercentage = analytics.totalQuantity > 0
      ? ((analytics.summary.expired + analytics.summary.damaged) / analytics.totalQuantity * 100).toFixed(1)
      : 0;

    return analytics;
  }

  // =========================================================================
  // FR-019: INVENTORY AGING REPORT
  // =========================================================================

  /**
   * Generate an inventory aging report grouped by time buckets.
   * 
   * SRS: FR-019 - Inventory Aging Report
   * 
   * Aging Buckets (based on days since harvestDate):
   *   - 0-3 days: Fresh product (highest value)
   *   - 4-7 days: Recent product
   *   - 8-14 days: Aging product (approaching expiry)
   *   - 15-30 days: Old product (high waste risk)
   *   - 30+ days: Very old product (critical waste risk)
   * 
   * Each bucket tracks:
   *   - count: Number of inventory batches in this age range
   *   - quantity: Total units in this age range
   *   - value: Total monetary value (quantity * pricePerUnit)
   * 
   * Only includes items with status='available' (active inventory).
   * 
   * Use Cases:
   *   - Identify slow-moving inventory for discounting
   *   - Prioritize dispatch of older items
   *   - Forecast waste risk based on aging distribution
   * 
   * Data Sources:
   *   - Inventory: Available items with harvestDate
   * 
   * @returns {Object} Aging report with 5 time buckets
   */
  async getInventoryAging() {
    const inventory = await Inventory.find({ status: 'available' });
    const now = new Date();

    // Initialize aging buckets
    const aging = {
      '0-3 days': { count: 0, quantity: 0, value: 0 },
      '4-7 days': { count: 0, quantity: 0, value: 0 },
      '8-14 days': { count: 0, quantity: 0, value: 0 },
      '15-30 days': { count: 0, quantity: 0, value: 0 },
      '30+ days': { count: 0, quantity: 0, value: 0 }
    };

    // Categorize each item into age buckets
    inventory.forEach(item => {
      const harvestDate = new Date(item.harvestDate);
      const ageDays = Math.floor((now - harvestDate) / (1000 * 60 * 60 * 24));
      const value = item.quantity * (item.pricePerUnit || 0);

      if (ageDays <= 3) { aging['0-3 days'].count++; aging['0-3 days'].quantity += item.quantity; aging['0-3 days'].value += value; }
      else if (ageDays <= 7) { aging['4-7 days'].count++; aging['4-7 days'].quantity += item.quantity; aging['4-7 days'].value += value; }
      else if (ageDays <= 14) { aging['8-14 days'].count++; aging['8-14 days'].quantity += item.quantity; aging['8-14 days'].value += value; }
      else if (ageDays <= 30) { aging['15-30 days'].count++; aging['15-30 days'].quantity += item.quantity; aging['15-30 days'].value += value; }
      else { aging['30+ days'].count++; aging['30+ days'].quantity += item.quantity; aging['30+ days'].value += value; }
    });

    return aging;
  }

  // =========================================================================
  // EXECUTIVE DASHBOARD
  // =========================================================================

  /**
   * Get executive dashboard summary with key operational metrics.
   * 
   * SRS: FR-017, FR-018, FR-019 - Dashboard summary
   * 
   * Returns high-level metrics across all operational areas:
   *   - Production: Active cycles count
   *   - Sales: Pending orders, recent orders, total revenue, completed count
   *   - Inventory: Total available items, low stock alerts (quantity < 10)
   *   - Users: Pending registrations awaiting approval
   * 
   * Used by the admin dashboard for at-a-glance operational overview.
   * 
   * Data Sources:
   *   - ProductionCycle: Active cycle count
   *   - Order: Pending, recent, revenue data
   *   - Inventory: Available count, low stock filter
   *   - User: Pending registration count
   * 
   * @returns {Object} Dashboard summary with operational metrics
   */
  async getDashboard() {
    const activeCycles = await ProductionCycle.count({ status: 'In Progress' });
    const pendingOrders = await Order.count({ status: 'Pending' });
    const totalInventory = await Inventory.count({ status: 'available' });
    const pendingUsers = await User.count({ status: 'pending' });
    const recentOrders = (await Order.find()).slice(0, 5);
    // Low stock threshold: quantity < 10
    const lowStock = (await Inventory.find({ status: 'available' })).filter(i => i.quantity < 10);

    // Total revenue from delivered orders
    const orders = await Order.find({ status: 'Delivered' });
    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);

    return {
      activeCycles,
      pendingOrders,
      totalInventory,
      pendingUsers,
      recentOrders,
      lowStockAlerts: lowStock.length,
      totalRevenue,
      completedOrders: orders.length
    };
  }
}

module.exports = new AnalyticsService();