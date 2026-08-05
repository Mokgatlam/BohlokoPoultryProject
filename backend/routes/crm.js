/**
 * CRM Routes
 * ==========
 * 
 * SRS Reference: FR-016 (Customer Relationship Management)
 * 
 * Comprehensive REST API for customer relationship management, including
 * customer profiles, loyalty programs, feedback/complaints, and promotional
 * campaigns. This is the largest route file, consolidating all CRM sub-features.
 * 
 * Endpoints Summary (21 endpoints):
 * 
 *   Customer Profiles:
 *     GET    /api/crm/profile/me            - Get current user's profile (any user)
 *     GET    /api/crm/profile/:id           - Get profile by ID (Farm Manager)
 *     PUT    /api/crm/profile/:id           - Update profile (owner or admin)
 *     GET    /api/crm/customers             - List all customers (Farm Manager)
 *     GET    /api/crm/customers/search      - Search customers (Farm Manager)
 *     POST   /api/crm/customers/segment     - Segment customers by criteria (Farm Manager)
 *     GET    /api/crm/customers/export/csv  - Export customers to CSV (Farm Manager)
 *     GET    /api/crm/profile/:id/clv       - Calculate customer lifetime value (Farm Manager)
 * 
 *   Loyalty Programs:
 *     POST   /api/crm/loyalty/enroll        - Enroll in loyalty program (any user)
 *     GET    /api/crm/loyalty/rewards/available - View available rewards (any user)
 *     GET    /api/crm/loyalty/transactions  - View points history (any user)
 * 
 *   Feedback & Complaints:
 *     POST   /api/crm/feedback              - Submit feedback (any user)
 *     GET    /api/crm/feedback              - List all feedback (Farm Manager)
 *     GET    /api/crm/feedback/statistics    - Feedback statistics (Farm Manager)
 *     PUT    /api/crm/feedback/:id/respond  - Respond to feedback (Farm Manager)
 *     PUT    /api/crm/feedback/:id/resolve  - Mark feedback resolved (Farm Manager)
 * 
 *   Campaigns:
 *     POST   /api/crm/campaigns             - Create campaign (Farm Manager)
 *     GET    /api/crm/campaigns             - List all campaigns (Farm Manager)
 *     GET    /api/crm/campaigns/:id/performance - Campaign performance (Farm Manager)
 *     PUT    /api/crm/campaigns/:id/activate - Activate campaign (Farm Manager)
 *     PUT    /api/crm/campaigns/:id/pause   - Pause campaign (Farm Manager)
 * 
 *   Dashboard:
 *     GET    /api/crm/dashboard/stats       - CRM dashboard stats (Farm Manager)
 * 
 * Design Principles:
 *   - Consolidated CRM: All customer-facing features in one route file
 *   - Owner-based access: Customers see only their own profile/loyalty/feedback
 *   - Admin-only for management: Customer list, segmentation, campaigns restricted
 *   - Express-validator on all write operations
 *   - Consistent response format: { success, data }
 */

const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const validate = require('../middleware/validate');
const crmService = require('../services/CrmService');
const { protect, authorize } = require('../middleware/auth');

// =========================================================================
// CUSTOMER PROFILES
// =========================================================================

/**
 * GET /api/crm/profile/me
 * Get the current authenticated user's customer profile.
 * 
 * SRS: FR-016 - View customer profile, FR-015 - User account management
 * Access: Any authenticated user (own profile only)
 * 
 * Auto-creates profile if none exists (get-or-create pattern).
 * Profile is created from user registration data (firstName, lastName, email, etc.)
 * 
 * @returns {Object} Customer profile with stats, loyalty, lifetimeValue
 */
router.get('/profile/me', protect, async (req, res) => {
  try {
    const profile = await crmService.getMyProfile(req.user);
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/crm/profile/:id
 * Get a customer profile by ID (admin view).
 * 
 * SRS: FR-016 - Admin customer management
 * Access: Farm Manager only
 * 
 * @param {string} id - CustomerProfile ID
 * @returns {Object} Customer profile or 404
 */
router.get('/profile/:id', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const profile = await crmService.getProfileById(req.params.id);
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/crm/profile/:id
 * Update customer profile fields.
 * 
 * SRS: FR-015 - Update user profiles, FR-016 - Customer profile management
 * Access: Profile owner OR Farm Manager
 * 
 * Validates (all optional for partial update):
 *   - firstName: 1-50 chars
 *   - lastName: 1-50 chars
 *   - phone: max 20 chars
 *   - email: valid email format
 *   - businessName: max 100 chars
 * 
 * Whitelisted fields: firstName, lastName, phone, email, address, businessName, preferences
 * Prevents mass assignment attacks by filtering to allowed fields only.
 * 
 * @param {string} id - CustomerProfile ID
 * @returns {Object} Updated profile or 403/404
 */
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

/**
 * GET /api/crm/customers/search
 * Search customers by name, email, or phone.
 * 
 * SRS: FR-016 - Customer search, FR-015 - User search
 * Access: Farm Manager only
 * 
 * Query params: q (search term, matched against firstName, lastName, email, phone)
 * Uses regex for case-insensitive partial matching.
 * 
 * @returns {Array} Matching customer profiles
 */
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

/**
 * GET /api/crm/customers
 * Get all customer profiles (admin view).
 * 
 * SRS: FR-016 - Customer list management
 * Access: Farm Manager only
 * 
 * @returns {Array} All customer profiles sorted by createdAt DESC
 */
router.get('/customers', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const customers = await crmService.getAllCustomers();
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/crm/customers/segment
 * Segment customers by criteria (type, orders, spending, loyalty tier).
 * 
 * SRS: FR-016 - Customer segmentation by type and purchase volume
 * Access: Farm Manager only
 * 
 * Request body criteria:
 *   - minOrders: Minimum total orders
 *   - maxOrders: Maximum total orders
 *   - minSpent: Minimum total spent
 *   - tier: Loyalty tier (Bronze, Silver, Gold, Platinum, Diamond)
 *   - userType: Customer type (Consumer, Restaurant, etc.)
 * 
 * @returns {Array} Customer profiles matching ALL criteria (AND logic)
 */
router.post('/customers/segment', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const customers = await crmService.segmentCustomers(req.body);
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/crm/customers/export/csv
 * Export all customer data as CSV for communication/marketing.
 * 
 * SRS: FR-015 - Export user lists for communication
 * Access: Farm Manager only
 * 
 * CSV columns: Name, Email, Phone, Type, Tier, Total Orders, Total Spent, Segment
 * 
 * @returns {CSV file} Content-Type: text/csv, Content-Disposition: attachment
 */
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

// =========================================================================
// LOYALTY PROGRAMS
// =========================================================================

/**
 * POST /api/crm/loyalty/enroll
 * Enroll current user in the loyalty program.
 * 
 * SRS: FR-016 - Loyalty program enrollment
 * Access: Any authenticated user
 * 
 * Business Logic:
 *   - Checks if already enrolled (prevents duplicates)
 *   - Gets or creates default loyalty program (Bohloko Rewards)
 *   - Creates enrollment record with Bronze tier
 *   - Updates customer profile with program ID
 * 
 * @returns {Object} Enrollment record with tier, points, enrolledAt
 */
router.post('/loyalty/enroll', protect, async (req, res) => {
  try {
    const enrollment = await crmService.enrollLoyalty(req.user);
    res.status(201).json({ success: true, data: enrollment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/crm/loyalty/rewards/available
 * Get available rewards based on user's current points balance.
 * 
 * SRS: FR-016 - Loyalty rewards catalog
 * Access: Any authenticated user
 * 
 * Returns:
 *   - points: User's current points balance
 *   - rewards: Full reward catalog (5 items)
 *   - available: Rewards user can afford (points >= reward.points)
 * 
 * Reward Catalog:
 *   - 5% Discount (500 points)
 *   - 10% Discount (1000 points)
 *   - Free Delivery (300 points)
 *   - Free Chicken 1kg (2000 points)
 *   - R100 Voucher (1500 points)
 * 
 * @returns {Object} { points, rewards, available }
 */
router.get('/loyalty/rewards/available', protect, async (req, res) => {
  try {
    const rewards = await crmService.getAvailableRewards(req.user);
    res.json({ success: true, data: rewards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/crm/loyalty/transactions
 * Get loyalty points transaction history for current user.
 * 
 * SRS: FR-016 - Loyalty points tracking
 * Access: Any authenticated user (own transactions only)
 * 
 * @returns {Array} Points transactions sorted by createdAt DESC
 */
router.get('/loyalty/transactions', protect, async (req, res) => {
  try {
    const transactions = await crmService.getLoyaltyTransactions(req.user._id);
    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =========================================================================
// FEEDBACK & COMPLAINTS
// =========================================================================

/**
 * POST /api/crm/feedback
 * Submit feedback, complaint, suggestion, or inquiry.
 * 
 * SRS: FR-016 - Track customer feedback and complaints
 * Access: Any authenticated user
 * 
 * Validates:
 *   - type: One of 'feedback', 'complaint', 'suggestion', 'inquiry'
 *   - subject: Required (trimmed)
 *   - message: Required (trimmed)
 *   - rating: Optional integer 1-5
 * 
 * Auto-records: customerId, userId, customerName from authenticated user
 * 
 * @returns {Object} Created feedback record with status='Open'
 */
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

/**
 * GET /api/crm/feedback
 * Get all feedback with optional filtering.
 * 
 * SRS: FR-016 - View feedback and complaints (admin)
 * Access: Farm Manager only
 * 
 * Query params:
 *   - status: Filter by status (Open, Responded, Resolved)
 *   - type: Filter by type (feedback, complaint, suggestion, inquiry)
 * 
 * @returns {Array} Feedback records sorted by createdAt DESC
 */
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

/**
 * GET /api/crm/feedback/statistics
 * Get aggregated feedback statistics for dashboard.
 * 
 * SRS: FR-016 - Feedback analytics
 * Access: Farm Manager only
 * 
 * Returns:
 *   - total, open, responded, resolved counts
 *   - byType: Breakdown by feedback type
 *   - byPriority: Breakdown by priority level
 *   - averageRating: Average rating across all rated feedback
 * 
 * @returns {Object} Feedback statistics
 */
router.get('/feedback/statistics', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const stats = await crmService.getFeedbackStatistics();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/crm/feedback/:id/respond
 * Respond to a feedback/complaint.
 * 
 * SRS: FR-016 - Respond to customer feedback
 * Access: Farm Manager only
 * 
 * Validates: response (required, trimmed)
 * Sets status to 'Responded', records respondedBy and respondedAt
 * 
 * @param {string} id - Feedback ID
 * @param {string} response - Admin response text
 * @returns {Object} Updated feedback with response
 */
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

/**
 * PUT /api/crm/feedback/:id/resolve
 * Mark feedback as resolved.
 * 
 * SRS: FR-016 - Resolve customer complaints
 * Access: Farm Manager only
 * 
 * Sets status to 'Resolved', records resolvedAt timestamp
 * 
 * @param {string} id - Feedback ID
 * @returns {Object} Updated feedback with Resolved status
 */
router.put('/feedback/:id/resolve', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const feedback = await crmService.resolveFeedback(req.params.id);
    res.json({ success: true, data: feedback });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// =========================================================================
// CAMPAIGNS
// =========================================================================

/**
 * POST /api/crm/campaigns
 * Create a new promotional campaign.
 * 
 * SRS: FR-016 - Send promotional communications
 * Access: Farm Manager only
 * 
 * Validates:
 *   - name: Required (trimmed)
 *   - type: One of 'discount', 'promotion', 'newsletter', 'announcement'
 *   - channel: One of 'email', 'sms', 'both'
 *   - discount: Optional float >= 0
 * 
 * Auto-generates: stats (sent, opened, clicked, converted, revenue)
 * Initial status: 'Draft'
 * 
 * @returns {Object} Created campaign
 */
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

/**
 * GET /api/crm/campaigns
 * Get all promotional campaigns.
 * 
 * SRS: FR-016 - Campaign management
 * Access: Farm Manager only
 * 
 * @returns {Array} All campaigns sorted by createdAt DESC
 */
router.get('/campaigns', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const campaigns = await crmService.getCampaigns();
    res.json({ success: true, data: campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/crm/campaigns/:id/performance
 * Get performance metrics for a specific campaign.
 * 
 * SRS: FR-016 - Campaign performance tracking
 * Access: Farm Manager only
 * 
 * Returns:
 *   - sent, opened, clicked, converted, revenue (raw stats)
 *   - conversionRate: (converted / sent) * 100
 *   - roi: ((revenue - discount) / discount) * 100
 * 
 * @param {string} id - Campaign ID
 * @returns {Object} Campaign performance metrics or 404
 */
router.get('/campaigns/:id/performance', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const performance = await crmService.getCampaignPerformance(req.params.id);
    res.json({ success: true, data: performance });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/crm/campaigns/:id/activate
 * Activate a draft or paused campaign.
 * 
 * SRS: FR-016 - Campaign lifecycle management
 * Access: Farm Manager only
 * 
 * Sets status to 'Active', records startDate as current time
 * 
 * @param {string} id - Campaign ID
 * @returns {Object} Activated campaign
 */
router.put('/campaigns/:id/activate', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const campaign = await crmService.activateCampaign(req.params.id);
    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/crm/campaigns/:id/pause
 * Pause an active campaign.
 * 
 * SRS: FR-016 - Campaign lifecycle management
 * Access: Farm Manager only
 * 
 * Sets status to 'Paused'
 * 
 * @param {string} id - Campaign ID
 * @returns {Object} Paused campaign
 */
router.put('/campaigns/:id/pause', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const campaign = await crmService.pauseCampaign(req.params.id);
    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// =========================================================================
// DASHBOARD & ANALYTICS
// =========================================================================

/**
 * GET /api/crm/dashboard/stats
 * Get aggregated CRM statistics for the admin dashboard.
 * 
 * SRS: FR-016 - Customer analytics dashboard
 * Access: Farm Manager only
 * 
 * Returns:
 *   - totalCustomers: Total customer profiles
 *   - newCustomers: Profiles with segment='New'
 *   - returningCustomers: Profiles with segment='Returning'
 *   - vipCustomers: Profiles with segment='VIP'
 *   - totalRevenue: Sum of all customer totalSpent
 *   - averageLifetimeValue: Average predicted CLV
 *   - loyaltyDistribution: Count by loyalty tier (Bronze through Diamond)
 *   - feedback: Feedback statistics
 *   - campaigns: Campaign statistics
 * 
 * @returns {Object} Comprehensive CRM dashboard data
 */
router.get('/dashboard/stats', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const stats = await crmService.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/crm/profile/:id/clv
 * Calculate Customer Lifetime Value for a specific customer.
 * 
 * SRS: FR-016 - Calculate customer lifetime value
 * Access: Farm Manager only
 * 
 * CLV Formula: avgOrderValue * orderFrequency * customerLifespan (2.5 years)
 * Retention Probability: min(0.95, 0.3 + (orderFrequency * 0.05))
 * 
 * Updates the profile's lifetimeValue fields (historical, predicted, retentionProbability)
 * 
 * @param {string} id - CustomerProfile ID
 * @returns {Object} { historical, predicted, retentionProbability }
 */
router.get('/profile/:id/clv', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const clv = await crmService.calculateCLV(req.params.id);
    res.json({ success: true, data: clv });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});

module.exports = router;