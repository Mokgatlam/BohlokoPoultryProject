/**
 * User Management Routes - FR-001 & FR-003
 * ==========================================
 * 
 * Admin-only routes for managing user accounts and roles.
 * All routes require Farm Manager authentication and authorization.
 * 
 * Architecture: Express Router with protect + authorize middleware chain
 * Pattern: Request -> Auth Check -> Role Check -> Validation -> Service -> Response
 * 
 * FR-001 Requirements Covered (Admin-side):
 *   - FR-001.5: Approve/reject pending user registrations
 *   - FR-001.9: Staff Members created internally (not via public registration)
 * 
 * FR-003 Requirements Covered:
 *   - FR-003.1: Role definitions enforced - Farm Manager, Poultry Attendant, Processing Staff, Sales Assistant, Customer
 *   - FR-003.3: All routes restricted to Farm Manager role via authorize middleware
 *   - FR-003.4: Farm Manager can modify user roles via PUT /:id/role
 * 
 * Security Principles:
 *   - Principle of Least Privilege: Only Farm Manager can access these routes
 *   - Defense in Depth: Both protect (JWT) and authorize (role) middleware applied
 *   - Input Validation: express-validator on all write operations
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const validate = require('../middleware/validate');
const userService = require('../services/UserService');
const { protect, authorize } = require('../middleware/auth');

/**
 * GET /api/users
 * ---------------
 * Retrieve all users with optional filtering.
 * 
 * FR-003.3: Restricted to Farm Manager role only.
 * Supports query params: status, userType, role, search
 * 
 * Response: 200 { success, data: [users] }
 */
router.get('/', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const users = await userService.getAll(req.query);
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * GET /api/users/pending
 * -----------------------
 * Retrieve all users with "pending" status awaiting approval.
 * 
 * FR-001.5: New accounts start with status "pending"
 * FR-003.3: Restricted to Farm Manager role only.
 * 
 * Response: 200 { success, data: [pendingUsers] }
 */
router.get('/pending', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const users = await userService.getPending();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * GET /api/users/stats
 * ---------------------
 * Get user statistics for dashboard display.
 * 
 * Returns counts by status (total, pending, approved, suspended, rejected)
 * and breakdowns by userType and role.
 * 
 * Response: 200 { success, data: { total, pending, approved, suspended, rejected, byType, byRole } }
 */
router.get('/stats', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const stats = await userService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * PUT /api/users/bulk/status
 * ---------------------------
 * Bulk update user statuses (approve, suspend, or reject multiple users).
 * 
 * FR-001.5: Enables batch approval of pending registrations
 * FR-003.3: Restricted to Farm Manager role only.
 * 
 * Request Body:
 *   { ids: [userId, ...], status: 'approved'|'suspended'|'rejected' }
 * 
 * Response: 200 { success, message: "X users updated to Y" }
 */
router.put('/bulk/status', protect, authorize('Farm Manager'), [
  body('ids').isArray().withMessage('IDs must be an array'),
  body('status').isIn(['approved', 'suspended', 'rejected'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const result = await userService.bulkUpdateStatus(req.body.ids, req.body.status);
    res.json({ success: true, message: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * GET /api/users/:id
 * -------------------
 * Retrieve a single user by ID.
 * 
 * FR-003.3: Restricted to Farm Manager role only.
 * 
 * Response: 200 { success, data: user }
 * Error: 404 { success, message: "User not found" }
 */
router.get('/:id', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const user = await userService.getById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * POST /api/users
 * ----------------
 * Create a new user account (admin-only, for Staff Members).
 * 
 * FR-001.9: Staff Members are created internally by Farm Manager,
 *           not through public registration.
 * FR-001.7: Password complexity enforced (same as registration)
 * FR-003.1: Role must be one of: Farm Manager, Poultry Attendant, Processing Staff, Sales Assistant, Customer
 * FR-003.3: Restricted to Farm Manager role only.
 * 
 * Note: Created accounts are automatically approved (status: 'approved')
 *       since they are created by an authorized administrator.
 * 
 * Request Body:
 *   { firstName, lastName, email, password, userType, role }
 * 
 * Response: 201 { success, data: user }
 */
router.post('/', protect, authorize('Farm Manager'), [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number')
    .matches(/[@$!%*?&]/).withMessage('Password must contain a special character'),
  body('userType').isIn(['Consumer', 'Restaurant', 'Retailer', 'Distributor', 'Farm Gate', 'Institution', 'Staff']),
  body('role').isIn(['Farm Manager', 'Poultry Attendant', 'Processing Staff', 'Sales Assistant', 'Customer'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const user = await userService.create(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

/**
 * PUT /api/users/:id/status
 * --------------------------
 * Update a single user's account status.
 * 
 * FR-001.5: Enables approval/rejection of pending registrations
 * FR-003.3: Restricted to Farm Manager role only.
 * 
 * Request Body:
 *   { status: 'approved'|'suspended'|'rejected' }
 * 
 * Response: 200 { success, data: user }
 */
router.put('/:id/status', protect, authorize('Farm Manager'), [
  body('status').isIn(['approved', 'suspended', 'rejected'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const user = await userService.updateStatus(req.params.id, req.body.status);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: { ...user, status: req.body.status } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * PUT /api/users/:id/role
 * ------------------------
 * Update a user's role within the system.
 * 
 * FR-003.1: Role must be one of the defined system roles
 * FR-003.4: Farm Manager can modify user roles and permissions
 * FR-003.5: Role changes should be logged (TODO: audit logging)
 * FR-003.3: Restricted to Farm Manager role only.
 * 
 * Request Body:
 *   { role: 'Farm Manager'|'Poultry Attendant'|'Processing Staff'|'Sales Assistant'|'Customer' }
 * 
 * Response: 200 { success, data: user }
 */
router.put('/:id/role', protect, authorize('Farm Manager'), [
  body('role').isIn(['Farm Manager', 'Poultry Attendant', 'Processing Staff', 'Sales Assistant', 'Customer'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const user = await userService.updateRole(req.params.id, req.body.role);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: { ...user, role: req.body.role } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * PUT /api/users/:id/profile
 * ---------------------------
 * Update user profile information.
 * 
 * Authorization: Users can update their own profile.
 *                Farm Manager can update any user's profile.
 * 
 * Allowed fields: firstName, lastName, phone, address, businessName
 * 
 * Response: 200 { success, data: user }
 * Error: 403 { success, message: "Not authorized" }
 */
router.put('/:id/profile', protect, [
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('First name must be 1-50 characters'),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Last name must be 1-50 characters'),
  body('phone').optional().trim().isLength({ max: 20 }).withMessage('Phone must be 20 characters or less'),
  body('businessName').optional().trim().isLength({ max: 100 }).withMessage('Business name must be 100 characters or less')
], validate, async (req, res) => {
  try {
    const user = await userService.updateProfile(req.params.id, req.body, req.user);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: { ...user, ...req.body } });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message || 'Not authorized' });
  }
});

/**
 * DELETE /api/users/:id
 * ----------------------
 * Soft-delete a user account (set status to 'deleted').
 * 
 * Cannot delete Farm Manager accounts (safety constraint).
 * Uses soft-delete to preserve data integrity and audit trail.
 * 
 * FR-003.3: Restricted to Farm Manager role only.
 * 
 * Response: 200 { success, message: "User deleted" }
 * Error: 500 { success, message: "Cannot delete Farm Manager" }
 */
router.delete('/:id', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const result = await userService.softDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

module.exports = router;
