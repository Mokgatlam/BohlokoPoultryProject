const express = require('express');
const router = express.Router();
const analyticsService = require('../services/AnalyticsService');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/analytics/production
// @desc    Get production analytics
// @access  Private - Farm Manager
router.get('/production', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const analytics = await analyticsService.getProductionAnalytics();
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/analytics/sales
// @desc    Get sales analytics
// @access  Private - Farm Manager, Sales Assistant
router.get('/sales', protect, authorize('Farm Manager', 'Sales Assistant'), async (req, res) => {
  try {
    const analytics = await analyticsService.getSalesAnalytics();
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/analytics/inventory
// @desc    Get inventory analytics
// @access  Private - Farm Manager
router.get('/inventory', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const analytics = await analyticsService.getInventoryAnalytics();
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/analytics/profit-loss
// @desc    FR-018: Profit & Loss Statement
// @access  Private - Farm Manager
router.get('/profit-loss', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const pl = await analyticsService.getProfitLoss();
    res.json({ success: true, data: pl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/analytics/inventory-aging
// @desc    FR-019: Inventory Aging Report
// @access  Private - Farm Manager
router.get('/inventory-aging', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const aging = await analyticsService.getInventoryAging();
    res.json({ success: true, data: aging });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard summary
// @access  Private - Farm Manager
router.get('/dashboard', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const dashboard = await analyticsService.getDashboard();
    res.json({ success: true, data: dashboard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;