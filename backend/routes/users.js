const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const validate = require('../middleware/validate');
const userService = require('../services/UserService');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const users = await userService.getAll(req.query);
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/pending', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const users = await userService.getPending();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/stats', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const stats = await userService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

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

router.get('/:id', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const user = await userService.getById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

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

router.delete('/:id', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const result = await userService.softDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

module.exports = router;
