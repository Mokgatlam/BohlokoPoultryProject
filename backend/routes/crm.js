const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const validate = require('../middleware/validate');
const crmService = require('../services/CrmService');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/crm/profile/me
// @desc    Get current user's customer profile
// @access  Private
router.get('/profile/me', protect, async (req, res) => {
  try {
    const profile = await crmService.getMyProfile(req.user);
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/crm/profile/:id
// @desc    Get customer profile by ID
// @access  Private - Farm Manager
router.get('/profile/:id', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const profile = await crmService.getProfileById(req.params.id);
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/crm/profile/:id
// @desc    Update customer profile
// @access  Private
router.put('/profile/:id', protect, [
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('First name must be 1-50 characters'),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Last name must be 1-50 characters'),
  body('phone').optional().trim().isLength({ max: 20 }).withMessage('Phone must be 20 characters or less'),
  body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('businessName').optional().trim().isLength({ max: 100 }).withMessage('Business name must be 100 characters or less')
], validate, async (req, res) => {
  try {
    const updated = await crmService.updateProfile(req.params.id, req.body, req.user);
    res.json({ success: true, data: updated });
  } catch (error) {
    const status = error.message === 'Not authorized' ? 403 : (error.message === 'Profile not found' ? 404 : 400);
    res.status(status).json({ success: false, message: error.message });
  }
});

// @route   GET /api/crm/customers/search
// @desc    Search customers
// @access  Private - Farm Manager
router.get('/customers/search', protect, authorize('Farm Manager'), [
  query('q').optional().trim()
], validate, async (req, res) => {
  try {
    const customers = await crmService.searchCustomers(req.query.q);
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/crm/customers
// @desc    Get all customers
// @access  Private - Farm Manager
router.get('/customers', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const customers = await crmService.getAllCustomers();
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/crm/customers/segment
// @desc    Segment customers
// @access  Private - Farm Manager
router.post('/customers/segment', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const customers = await crmService.segmentCustomers(req.body);
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/crm/customers/export/csv
// @desc    Export customers to CSV
// @access  Private - Farm Manager
router.get('/customers/export/csv', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const csv = await crmService.exportCustomersCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=customers.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/crm/loyalty/enroll
// @desc    Enroll in loyalty program
// @access  Private
router.post('/loyalty/enroll', protect, async (req, res) => {
  try {
    const enrollment = await crmService.enrollLoyalty(req.user);
    res.status(201).json({ success: true, data: enrollment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @route   GET /api/crm/loyalty/rewards/available
// @desc    Get available rewards
// @access  Private
router.get('/loyalty/rewards/available', protect, async (req, res) => {
  try {
    const rewards = await crmService.getAvailableRewards(req.user);
    res.json({ success: true, data: rewards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/crm/loyalty/transactions
// @desc    Get loyalty transactions
// @access  Private
router.get('/loyalty/transactions', protect, async (req, res) => {
  try {
    const transactions = await crmService.getLoyaltyTransactions(req.user._id);
    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/crm/feedback
// @desc    Submit feedback/complaint
// @access  Private
router.post('/feedback', protect, [
  body('type').isIn(['feedback', 'complaint', 'suggestion', 'inquiry']).withMessage('Invalid feedback type'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
], validate, async (req, res) => {
  try {
    const feedback = await crmService.createFeedback(req.body, req.user);
    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @route   GET /api/crm/feedback
// @desc    Get all feedback
// @access  Private - Farm Manager
router.get('/feedback', protect, authorize('Farm Manager'), [
  query('status').optional().isIn(['Open', 'Responded', 'Resolved']),
  query('type').optional().isIn(['feedback', 'complaint', 'suggestion', 'inquiry'])
], validate, async (req, res) => {
  try {
    const feedback = await crmService.getFeedback(req.query);
    res.json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/crm/feedback/statistics
// @desc    Get feedback statistics
// @access  Private - Farm Manager
router.get('/feedback/statistics', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const stats = await crmService.getFeedbackStatistics();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/crm/feedback/:id/respond
// @desc    Respond to feedback
// @access  Private - Farm Manager
router.put('/feedback/:id/respond', protect, authorize('Farm Manager'), [
  body('response').trim().notEmpty().withMessage('Response is required')
], validate, async (req, res) => {
  try {
    const feedback = await crmService.respondToFeedback(req.params.id, req.body.response, req.user._id);
    res.json({ success: true, data: feedback });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/crm/feedback/:id/resolve
// @desc    Resolve feedback
// @access  Private - Farm Manager
router.put('/feedback/:id/resolve', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const feedback = await crmService.resolveFeedback(req.params.id);
    res.json({ success: true, data: feedback });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @route   POST /api/crm/campaigns
// @desc    Create campaign
// @access  Private - Farm Manager
router.post('/campaigns', protect, authorize('Farm Manager'), [
  body('name').trim().notEmpty().withMessage('Campaign name is required'),
  body('type').isIn(['discount', 'promotion', 'newsletter', 'announcement']).withMessage('Invalid campaign type'),
  body('channel').isIn(['email', 'sms', 'both']).withMessage('Invalid channel'),
  body('discount').optional().isFloat({ min: 0 }).withMessage('Discount must be a non-negative number')
], validate, async (req, res) => {
  try {
    const campaign = await crmService.createCampaign(req.body, req.user);
    res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @route   GET /api/crm/campaigns
// @desc    Get all campaigns
// @access  Private - Farm Manager
router.get('/campaigns', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const campaigns = await crmService.getCampaigns();
    res.json({ success: true, data: campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/crm/campaigns/:id/performance
// @desc    Get campaign performance
// @access  Private - Farm Manager
router.get('/campaigns/:id/performance', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const performance = await crmService.getCampaignPerformance(req.params.id);
    res.json({ success: true, data: performance });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/crm/campaigns/:id/activate
// @desc    Activate campaign
// @access  Private - Farm Manager
router.put('/campaigns/:id/activate', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const campaign = await crmService.activateCampaign(req.params.id);
    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/crm/campaigns/:id/pause
// @desc    Pause campaign
// @access  Private - Farm Manager
router.put('/campaigns/:id/pause', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const campaign = await crmService.pauseCampaign(req.params.id);
    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @route   GET /api/crm/dashboard/stats
// @desc    Get CRM dashboard stats
// @access  Private - Farm Manager
router.get('/dashboard/stats', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const stats = await crmService.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/crm/profile/:id/clv
// @desc    Calculate customer lifetime value
// @access  Private - Farm Manager
router.get('/profile/:id/clv', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const clv = await crmService.calculateCLV(req.params.id);
    res.json({ success: true, data: clv });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});

module.exports = router;