/**
 * Authentication & Authorization Middleware - FR-002 & FR-003
 * ============================================================
 * 
 * Express middleware functions for JWT verification and role-based access control.
 * These middleware protect routes by verifying tokens and checking user permissions.
 * 
 * Architecture: Middleware chain pattern (Request -> protect -> authorize -> Route Handler)
 * 
 * FR-002 Requirements Covered:
 *   - FR-002.4: JWT token verification and management
 *   - FR-002.5: Account status validation (must be 'approved')
 *   - FR-002.6: Token blacklisting for logout
 * 
 * FR-003 Requirements Covered:
 *   - FR-003.1: Role definitions enforced via authorize middleware
 *   - FR-003.2: Permission hierarchy (role-based access control)
 *   - FR-003.3: Route protection based on user role
 * 
 * Design Principles:
 *   - Separation of Concerns: Auth logic isolated from route handlers
 *   - Reusable: Same middleware applied across all protected routes
 *   - Fail-Safe: Denied by default; explicit authorization required
 *   - Stateless: JWT verification without session storage
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * In-memory token blacklist for logged-out tokens.
 * 
 * FR-002: Tokens are added to this Set on logout.
 * In production, use Redis or database for persistence across server restarts.
 * 
 * Limitation: Blacklist is cleared on server restart.
 * For production, implement persistent storage (Redis recommended).
 */
const tokenBlacklist = new Set();

/**
 * Authentication middleware - Verifies JWT token and attaches user to request.
 * 
 * FR-002.4: Extracts and verifies JWT token from Authorization header
 * FR-002.5: Validates user account status is 'approved'
 * FR-002.6: Checks token against blacklist (for logged-out tokens)
 * 
 * Usage: router.get('/protected-route', protect, handler)
 * 
 * Request Flow:
 *   1. Extract token from Authorization: Bearer <token> header
 *   2. Check if token is blacklisted (logged out)
 *   3. Verify JWT signature and expiration
 *   4. Look up user by ID from token payload
 *   5. Verify user exists and has 'approved' status
 *   6. Attach user object and token to request
 *   7. Call next() to continue to route handler
 * 
 * Error Responses:
 *   - 401: "Not authorized, no token" (missing token)
 *   - 401: "Token has been revoked" (blacklisted token)
 *   - 401: "User not found" (user deleted after token issued)
 *   - 403: "Account not approved" (pending/suspended/rejected)
 *   - 401: "Not authorized, token failed" (invalid/expired token)
 */
const protect = async (req, res, next) => {
  let token;

  // Step 1: Extract token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Step 2: Reject if no token provided
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  // Step 3: Check if token has been blacklisted (FR-002.6 - logout)
  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ success: false, message: 'Token has been revoked' });
  }

  try {
    // Step 4: Verify JWT signature and extract payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Step 5: Look up user by ID from token
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Step 6: Validate account status (FR-002.5)
    if (user.status !== 'approved') {
      return res.status(403).json({ success: false, message: 'Account not approved' });
    }

    // Step 7: Attach user and token to request for downstream handlers
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    // Token verification failed (expired, invalid signature, malformed)
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

/**
 * Add a JWT token to the blacklist (for logout).
 * 
 * FR-002.6: Token is invalidated by adding to in-memory blacklist.
 * 
 * Usage: Called from POST /api/auth/logout route handler
 * 
 * @param {string} token - JWT token to blacklist
 */
const blacklistToken = (token) => {
  tokenBlacklist.add(token);
};

/**
 * Role-based authorization middleware factory.
 * 
 * FR-003.1: Enforces role-based access control
 * FR-003.2: Role hierarchy - higher roles can access lower-level routes
 * FR-003.3: Restricts access to specific modules based on user role
 * 
 * Usage: router.get('/admin-only', protect, authorize('Farm Manager'), handler)
 *         router.get('/staff', protect, authorize('Farm Manager', 'Poultry Attendant'), handler)
 * 
 * Role Hierarchy:
 *   Farm Manager > Poultry Attendant > Processing Staff > Sales Assistant > Customer
 * 
 * @param  {...string} roles - Allowed roles (variadic arguments)
 * @returns {Function} Express middleware function
 * 
 * Error Response:
 *   - 403: "Role X is not authorized to access this route"
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user's role is in the allowed roles list
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { protect, authorize, blacklistToken };
