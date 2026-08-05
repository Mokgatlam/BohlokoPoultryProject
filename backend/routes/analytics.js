/**
 * Analytics Routes
 * ================
 * 
 * SRS Reference: FR-017 (Production Analytics), FR-018 (Sales & Financial Analytics),
 *                FR-019 (Inventory Analytics)
 * 
 * REST API endpoints for production, sales, and inventory analytics. Provides
 * aggregated data for dashboards, reporting, and decision-making.
 * 
 * Endpoints Summary (6 endpoints):
 *   GET  /api/analytics/production      - Production metrics (mortality, FCR, cost)
 *   GET  /api/analytics/sales           - Sales analytics (revenue, AOV, breakdowns)
 *   GET  /api/analytics/inventory       - Inventory analytics (turnover, waste, expiry)
 *   GET  /api/analytics/profit-loss     - Profit & Loss statement (FR-018)
 *   GET  /api/analytics/inventory-aging - Inventory aging report (FR-019)
 *   GET  /api/analytics/dashboard       - Executive dashboard summary
 * 
 * Design Principles:
 *   - All endpoints are Farm Manager only (except sales which includes Sales Assistant)
 *   - Read-only endpoints (no mutations)
 *   - Service layer handles all computation (thin routes)
 *   - Consistent response format: { success, data }
 *   - No input parameters needed (aggregates all available data)
 * 
 * FR-017 Requirements Covered:
 *   1. Mortality rate calculation
 *   2. Feed conversion ratio (FCR)
 *   3. Cycle duration and completion rates
 *   4. Production cost analysis (budget vs actual)
 *   5. Performance comparison across cycles
 * 
 * FR-018 Requirements Covered:
 *   1. Revenue by product, payment method, delivery option, month
 *   2. Profit & Loss statement with COGS and operating expenses
 *   3. Average order value
 *   4. Revenue trends by month
 * 
 * FR-019 Requirements Covered:
 *   1. Inventory turnover and valuation
 *   2. Near-expiry and expired item tracking
 *   3. Holding cost estimation
 *   4. Waste percentage calculation
 *   5. Inventory aging report by time buckets
 */

const express = require('express');
const router = express.Router();
const analyticsService = require('../services/AnalyticsService');
const { protect, authorize } = require('../middleware/auth');

/**
 * GET /api/analytics/production
 * Get production performance analytics.
 * 
 * SRS: FR-017 - Production Analytics
 * Access: Farm Manager only
 * 
 * Returns:
 *   - totalCycles: Number of completed production cycles
 *   - averageCycleDuration: Average cycle length in days
 *   - mortalityRate: (totalMortality / totalBirds) * 100
 *   - feedConversionRatio: totalFeed / totalBirds
 *   - costAnalysis: { totalBudget, totalActual, variance }
 *   - performance[]: Per-cycle breakdown with completion rates
 * 
 * Metrics Calculated:
 *   - Mortality Rate: Sum of daily mortality counts / sum of daily bird counts
 *   - FCR: Total feed consumed / total bird-days
 *   - Cost Variance: Budget minus Actual (positive = under budget)
 * 
 * @returns {Object} Production analytics data
 */
router.get('/production', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const analytics = await analyticsService.getProductionAnalytics();
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/analytics/sales
 * Get sales performance analytics.
 * 
 * SRS: FR-018 - Sales & Financial Analytics
 * Access: Farm Manager, Sales Assistant
 * 
 * Returns:
 *   - totalOrders: Count of all orders
 *   - completedOrders: Count of delivered orders
 *   - totalRevenue: Sum of delivered order totals
 *   - averageOrderValue: totalRevenue / completedOrders
 *   - revenueByProduct: Revenue breakdown by product name
 *   - revenueByPaymentMethod: Revenue breakdown by payment method
 *   - revenueByDeliveryOption: Revenue breakdown by delivery option
 *   - revenueByMonth: Revenue breakdown by YYYY-MM
 *   - pendingPayments: Orders with paymentStatus='Pending'
 *   - refunds: Orders with paymentStatus='Refunded'
 * 
 * @returns {Object} Sales analytics data
 */
router.get('/sales', protect, authorize('Farm Manager', 'Sales Assistant'), async (req, res) => {
  try {
    const analytics = await analyticsService.getSalesAnalytics();
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/analytics/inventory
 * Get inventory performance analytics.
 * 
 * SRS: FR-019 - Inventory Analytics
 * Access: Farm Manager only
 * 
 * Returns:
 *   - totalItems: Count of inventory records
 *   - totalValue: Sum of (quantity * pricePerUnit)
 *   - totalQuantity: Sum of all quantities
 *   - byStatus: Quantity breakdown by status
 *   - byProductType: Quantity breakdown by product type
 *   - byLocation: Quantity breakdown by storage location
 *   - nearExpiry: Items expiring within 7 days
 *   - expired: Items past expiry date
 *   - holdingCost: Estimated storage cost (R2/kg for available items)
 *   - wastePercentage: (expired + damaged) / totalQuantity * 100
 *   - summary: Count of items in each status
 * 
 * @returns {Object} Inventory analytics data
 */
router.get('/inventory', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const analytics = await analyticsService.getInventoryAnalytics();
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/analytics/profit-loss
 * Generate a Profit & Loss (P&L) statement.
 * 
 * SRS: FR-018 - Profit and Loss Statement
 * Access: Farm Manager only
 * 
 * Returns:
 *   - revenue: { salesRevenue, otherRevenue, totalRevenue }
 *   - costOfGoodsSold: { beginningInventory, productionCosts, purchases, endingInventory, totalCOGS }
 *   - grossProfit: revenue - COGS
 *   - operatingExpenses: { labor, feed, medications, utilities, waste, holding, total }
 *   - netProfit: grossProfit - operatingExpenses
 *   - profitMargin: (netProfit / totalRevenue) * 100
 * 
 * Cost Categories:
 *   - Production costs: Feed + Medications + Labor + Utilities
 *   - Holding costs: 2% of inventory value (estimated)
 *   - Waste value: Expired + damaged inventory value
 * 
 * @returns {Object} Profit & Loss statement
 */
router.get('/profit-loss', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const pl = await analyticsService.getProfitLoss();
    res.json({ success: true, data: pl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/analytics/inventory-aging
 * Generate an inventory aging report by time buckets.
 * 
 * SRS: FR-019 - Inventory Aging Report
 * Access: Farm Manager only
 * 
 * Time Buckets (based on days since harvestDate):
 *   - 0-3 days: Fresh product
 *   - 4-7 days: Recent product
 *   - 8-14 days: Aging product
 *   - 15-30 days: Old product
 *   - 30+ days: Very old product (potential waste)
 * 
 * Each bucket contains:
 *   - count: Number of inventory batches in this age range
 *   - quantity: Total units in this age range
 *   - value: Total monetary value in this age range
 * 
 * Only includes items with status='available'
 * 
 * @returns {Object} Aging report with 5 time buckets
 */
router.get('/inventory-aging', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const aging = await analyticsService.getInventoryAging();
    res.json({ success: true, data: aging });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/analytics/dashboard
 * Get executive dashboard summary with key metrics.
 * 
 * SRS: FR-017, FR-018, FR-019 - Dashboard summary
 * Access: Farm Manager only
 * 
 * Returns:
 *   - activeCycles: Production cycles in progress
 *   - pendingOrders: Orders awaiting processing
 *   - totalInventory: Available inventory items
 *   - pendingUsers: User registrations awaiting approval
 *   - recentOrders: Last 5 orders (any status)
 *   - lowStockAlerts: Count of inventory items with quantity < 10
 *   - totalRevenue: Sum of delivered order totals
 *   - completedOrders: Count of delivered orders
 * 
 * @returns {Object} Dashboard summary data
 */
router.get('/dashboard', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const dashboard = await analyticsService.getDashboard();
    res.json({ success: true, data: dashboard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;