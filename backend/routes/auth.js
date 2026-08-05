const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const userService = require('../services/UserService');
const PasswordReset = require('../models/PasswordReset');
const { protect, blacklistToken } = require('../middleware/auth');

router.post('/register', [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number')
    .matches(/[@$!%*?&]/).withMessage('Password must contain a special character'),
  body('userType').isIn(['Consumer', 'Restaurant', 'Retailer', 'Distributor', 'Farm Gate', 'Institution', 'Staff'])
    .withMessage('Invalid user type'),
  body('role').optional().isIn(['Customer']).withMessage('Self-registration only allows Customer role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const result = await userService.register(req.body);
    res.status(201).json({
      success: true,
      message: 'Registration successful. Your account is pending approval.',
      data: result
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Server error' });
  }
});

router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const result = await userService.login(req.body.email, req.body.password);
    res.json({ success: true, data: result });
  } catch (error) {
    const statusCode = error.message.includes('locked') ? 423 :
                       error.message.includes('pending') || error.message.includes('suspended') || error.message.includes('rejected') ? 403 : 401;
    res.status(statusCode).json({ success: false, message: error.message || 'Server error' });
  }
});

router.get('/me', protect, async (req, res) => {
  const { password, failedLoginAttempts, lockUntil, lastLogin, ...userWithoutPassword } = req.user;
  res.json({ success: true, data: { user: userWithoutPassword } });
});

router.post('/logout', protect, async (req, res) => {
  try {
    blacklistToken(req.token);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/forgot-password', [
  body('email').isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const user = await userService.getByEmail(req.body.email.toLowerCase());
    if (!user) {
      return res.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
    }
    const { token } = await PasswordReset.createToken(user._id);
    // TODO: Send token via email — never return it in the response
    res.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token is required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number')
    .matches(/[@$!%*?&]/).withMessage('Password must contain a special character')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const resetRecord = await PasswordReset.findByToken(req.body.token);
    if (!resetRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }
    if (new Date(resetRecord.expiresAt) < new Date()) {
      return res.status(400).json({ success: false, message: 'Reset token has expired' });
    }
    await userService.resetPassword(resetRecord.userId, req.body.password);
    await PasswordReset.markUsed(req.body.token);
    res.json({ success: true, message: 'Password reset successful. You can now login.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
