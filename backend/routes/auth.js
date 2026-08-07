/**
 * Authentication Routes - FR-001 & FR-002
 * ==========================================
 * 
 * Implements user registration (FR-001) and authentication (FR-002)
 * for the Bohloko Family Farm Poultry Processing System.
 * 
 * Architecture: Express Router with express-validator middleware
 * Pattern: Route -> Validation -> Service -> Response
 * 
 * FR-001 Requirements Covered:
 *   - FR-001.1: Multiple user types (Consumer, Restaurant, Retailer, Distributor, Farm Gate, Institution)
 *   - FR-001.3: Email uniqueness and format validation
 *   - FR-001.4: Secure password storage (bcrypt hashing)
 *   - FR-001.5: Account status set to "pending" for all new users
 *   - FR-001.7: Password requirements (min 8 chars, uppercase, lowercase, number, special char)
 * 
 * FR-002 Requirements Covered:
 *   - FR-002.1: Credential validation against bcrypt hash
 *   - FR-002.2: Account lockout after 5 failed attempts (30-min duration)
 *   - FR-002.3: Password reset via email token
 *   - FR-002.5: Account status validation (approved, pending, suspended, rejected)
 *   - FR-002.6: Last login time tracking
 *   - FR-002.7: Specific error messages for each failure type
 *   - FR-002.9: Forgot Password link on login page
 * 
 * Design Principles:
 *   - Single Responsibility: Each route handles one specific auth operation
 *   - Fail-Fast: Validation occurs before service calls
 *   - Security: Passwords never returned in responses; tokens blacklisted on logout
 *   - Separation of Concerns: Routes handle HTTP, Services handle business logic
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const userService = require('../services/UserService');
const PasswordReset = require('../models/PasswordReset');
const { protect, blacklistToken } = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');
const systemLogService = require('../services/SystemLogService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * POST /api/auth/register
 * ------------------------
 * Register a new user account.
 * 
 * FR-001.1: Supports user types - Consumer, Restaurant, Retailer, Distributor, Farm Gate, Institution
 * FR-001.3: Validates email format and uniqueness via UserService
 * FR-001.4: Password hashed with bcrypt (salt rounds: 12) in UserService
 * FR-001.5: All accounts created with status "pending" - requires Farm Manager approval
 * FR-001.7: Password validated for complexity:
 *   - Minimum 8 characters
 *   - At least one uppercase letter [A-Z]
 *   - At least one lowercase letter [a-z]
 *   - At least one digit [0-9]
 *   - At least one special character [@$!%*?&]
 * 
 * FR-001.9: Business registration number validated if provided (alphanumeric, hyphens, slashes; 5-30 chars)
 * FR-001.10: Tax ID validated if provided (alphanumeric, hyphens; 5-20 chars)
 * 
 * Note: Self-registration restricts role to 'Customer' only.
 *       Staff Members are created internally via admin panel (POST /api/users).
 * 
 * Request Body:
 *   { firstName, lastName, email, password, userType, phone?, businessName? }
 * 
 * Response: 201 { success, message, data: { user } }
 * Error: 400 { success, errors: [{ msg }] }
 */
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
    // Validate request body against rules above
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    // Delegate registration logic to UserService (FR-001.3, FR-001.4, FR-001.5)
    const result = await userService.register(req.body);
    try {
      await systemLogService.create({
        level: 'info',
        message: `User registered: ${req.body.email}`,
        category: 'auth',
        userId: result.user._id || result.user.id,
        userName: `${req.body.firstName} ${req.body.lastName}`,
        action: 'register',
        resource: 'user',
        resourceId: result.user._id || result.user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        method: req.method,
        path: req.originalUrl
      });
    } catch (e) { /* logging failure should not break the request */ }
    res.status(201).json({
      success: true,
      message: 'Registration successful. Your account is pending approval.',
      data: result
    });
  } catch (error) {
    try {
      await systemLogService.create({
        level: 'error',
        message: `Registration failed: ${error.message}`,
        category: 'auth',
        action: 'register',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        method: req.method,
        path: req.originalUrl,
        error: error.message
      });
    } catch (e) { /* logging failure should not break the request */ }
    res.status(400).json({ success: false, message: error.message || 'Server error' });
  }
});

/**
 * POST /api/auth/google
 * ----------------------
 * Authenticate or register a user via Google OAuth.
 * 
 * Accepts a Google ID token, verifies it against Google's servers,
 * then finds or creates the user. Google users are automatically
 * assigned as Consumer/Customer type.
 * 
 * Request Body:
 *   { credential } - Google ID token from Google Identity Services
 * 
 * Response: 200 { success, data: { user, token } }
 * Error: 400/401 { success, message }
 */
router.post('/google', [
  body('credential').notEmpty().withMessage('Google credential is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: req.body.credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const googleEmail = payload.email;
    const googleName = payload.name || '';
    const googlePicture = payload.picture || '';
    const firstName = payload.given_name || googleName.split(' ')[0] || 'Google';
    const lastName = payload.family_name || googleName.split(' ').slice(1).join('') || 'User';

    // Find existing user by email
    let user = await userService.getByEmail(googleEmail);

    if (user) {
      // User exists — generate JWT and return
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { id: user._id || user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
      );

      // Update last login
      try { await userService.updateLastLogin(user._id || user.id); } catch (e) { /* ignore */ }
      try {
        await systemLogService.create({
          level: 'info',
          message: `User logged in via Google: ${googleEmail}`,
          category: 'auth',
          userId: user._id || user.id,
          userName: `${user.firstName} ${user.lastName}`,
          action: 'login_google',
          resource: 'user',
          resourceId: user._id || user.id,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          method: req.method,
          path: req.originalUrl
        });
      } catch (e) { /* logging failure should not break the request */ }

      const { password, failedLoginAttempts, lockUntil, ...userWithoutPassword } = user;
      return res.json({
        success: true,
        message: 'Logged in with Google successfully',
        data: { user: userWithoutPassword, token }
      });
    }

    // New user — create account as Consumer/Customer
    // Generate a random secure password (Google users won't use it)
    const crypto = require('crypto');
    const randomPassword = crypto.randomBytes(16).toString('hex') + '@Aa1';

    const newUser = await userService.register({
      firstName,
      lastName,
      email: googleEmail,
      password: randomPassword,
      userType: 'Consumer',
      role: 'Customer',
      phone: '',
      authProvider: 'google',
      status: 'approved' // Google-verified emails are auto-approved
    });

    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: newUser.user._id || newUser.user.id, email: newUser.user.email, role: newUser.user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    const { password, failedLoginAttempts, lockUntil, ...userWithoutPassword } = newUser.user;
    try {
      await systemLogService.create({
        level: 'info',
        message: `New user registered via Google: ${googleEmail}`,
        category: 'auth',
        userId: newUser.user._id || newUser.user.id,
        userName: `${firstName} ${lastName}`,
        action: 'register_google',
        resource: 'user',
        resourceId: newUser.user._id || newUser.user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        method: req.method,
        path: req.originalUrl
      });
    } catch (e) { /* logging failure should not break the request */ }
    res.status(201).json({
      success: true,
      message: 'Account created with Google successfully',
      data: { user: userWithoutPassword, token }
    });
  } catch (error) {
    console.error('[AUTH] Google auth error:', error.message);
    res.status(401).json({ success: false, message: 'Invalid Google credentials. Please try again.' });
  }
});

/**
 * POST /api/auth/login
 * ---------------------
 * Authenticate user and issue JWT access token.
 * 
 * FR-002.1: Validates credentials against stored bcrypt hash
 * FR-002.2: Account locked after 5 failed attempts for 30 minutes
 * FR-002.5: Checks account status before allowing login
 * FR-002.6: Updates lastLogin timestamp on successful login
 * FR-002.7: Returns specific error messages:
 *   - 401: "Invalid email or password" (wrong credentials)
 *   - 403: "Your account is pending approval" / "suspended" / "rejected"
 *   - 423: "Account is temporarily locked due to multiple failed login attempts"
 * 
 * Request Body:
 *   { email, password }
 * 
 * Response: 200 { success, data: { user, token } }
 * Error: 401/403/423 { success, message }
 */
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    // UserService.login handles: credential check, lockout, status validation, lastLogin update
    const result = await userService.login(req.body.email, req.body.password);
    try {
      await systemLogService.create({
        level: 'info',
        message: `User logged in: ${req.body.email}`,
        category: 'auth',
        userId: result.user._id || result.user.id,
        userName: `${result.user.firstName} ${result.user.lastName}`,
        action: 'login',
        resource: 'user',
        resourceId: result.user._id || result.user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        method: req.method,
        path: req.originalUrl
      });
    } catch (e) { /* logging failure should not break the request */ }
    res.json({ success: true, data: result });
  } catch (error) {
    const statusCode = error.message.includes('locked') ? 423 :
                       error.message.includes('pending') || error.message.includes('suspended') || error.message.includes('rejected') ? 403 : 401;
    try {
      await systemLogService.create({
        level: statusCode === 401 ? 'warn' : 'info',
        message: `Login failed: ${error.message}`,
        category: 'auth',
        action: 'login_failed',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        method: req.method,
        path: req.originalUrl,
        statusCode,
        error: error.message
      });
    } catch (e) { /* logging failure should not break the request */ }
    res.status(statusCode).json({ success: false, message: error.message || 'Server error' });
  }
});

/**
 * GET /api/auth/me
 * -----------------
 * Get current authenticated user's profile.
 * 
 * Uses protect middleware to verify JWT token and attach user to req.
 * Strips sensitive fields (password, failedLoginAttempts, lockUntil) from response.
 * 
 * Response: 200 { success, data: { user } }
 */
router.get('/me', protect, async (req, res) => {
  const { password, failedLoginAttempts, lockUntil, lastLogin, ...userWithoutPassword } = req.user;
  res.json({ success: true, data: { user: userWithoutPassword } });
});

/**
 * POST /api/auth/logout
 * ----------------------
 * Invalidate current JWT token (token blacklisting).
 * 
 * FR-002: Token is added to in-memory blacklist Set.
 * Subsequent requests with this token will be rejected by protect middleware.
 * 
 * Response: 200 { success, message }
 */
router.post('/logout', protect, async (req, res) => {
  try {
    blacklistToken(req.token);
    try {
      await systemLogService.create({
        level: 'info',
        message: `User logged out: ${req.user.email}`,
        category: 'auth',
        userId: req.user._id || req.user.id,
        userName: `${req.user.firstName} ${req.user.lastName}`,
        action: 'logout',
        resource: 'user',
        resourceId: req.user._id || req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        method: req.method,
        path: req.originalUrl
      });
    } catch (e) { /* logging failure should not break the request */ }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * POST /api/auth/forgot-password
 * -------------------------------
 * Initiate password reset flow (FR-002.3).
 * 
 * Generates a cryptographically secure token (32 bytes random hex)
 * and stores it with 1-hour expiry. Token is single-use.
 * 
 * Security: Always returns success message regardless of whether email exists
 *           to prevent user enumeration attacks.
 * 
 * TODO: FR-002.3 requires sending token via email - currently not implemented.
 *       Token is logged to console for development purposes.
 * 
 * Request Body:
 *   { email }
 * 
 * Response: 200 { success, message }
 */
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
      // Always return same message to prevent user enumeration
      return res.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
    }
    // Invalidate any previous tokens for this user, then create new one
    const { token } = await PasswordReset.createToken(user._id);
    try {
      await systemLogService.create({
        level: 'info',
        message: `Password reset requested for: ${req.body.email}`,
        category: 'auth',
        userId: user._id || user.id,
        userName: `${user.firstName} ${user.lastName}`,
        action: 'forgot_password',
        resource: 'user',
        resourceId: user._id || user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        method: req.method,
        path: req.originalUrl
      });
    } catch (e) { /* logging failure should not break the request */ }
    // TODO: Send token via email — never return it in the response
    res.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * POST /api/auth/reset-password
 * ------------------------------
 * Complete password reset using token (FR-002.3).
 * 
 * Validates token existence, expiry, and single-use constraint.
 * Password must meet same complexity requirements as registration.
 * 
 * Request Body:
 *   { token, password }
 * 
 * Response: 200 { success, message }
 * Error: 400 { success, message } (invalid/expired token)
 */
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
    // Verify token exists and hasn't been used
    const resetRecord = await PasswordReset.findByToken(req.body.token);
    if (!resetRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }
    // Check token expiry (1-hour window)
    if (new Date(resetRecord.expiresAt) < new Date()) {
      return res.status(400).json({ success: false, message: 'Reset token has expired' });
    }
    // Hash new password and update user record
    await userService.resetPassword(resetRecord.userId, req.body.password);
    await PasswordReset.markUsed(req.body.token);
    try {
      await systemLogService.create({
        level: 'info',
        message: `Password reset completed for user ID: ${resetRecord.userId}`,
        category: 'auth',
        userId: resetRecord.userId,
        action: 'reset_password',
        resource: 'user',
        resourceId: resetRecord.userId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        method: req.method,
        path: req.originalUrl
      });
    } catch (e) { /* logging failure should not break the request */ }
    res.json({ success: true, message: 'Password reset successful. You can now login.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
