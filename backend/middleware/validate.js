/**
 * Validation Middleware
 * ====================
 * 
 * SRS Reference: FR-023.3 (Data Validation Rules)
 * 
 * Express middleware for request validation using express-validator.
 * Runs all validation rules and returns a 400 error if any fail.
 * 
 * Architecture:
 *   - Higher-Order Function Pattern: Takes validations array, returns middleware
 *   - Async Execution: All validations run in parallel via Promise.all()
 *   - Standardized Error Response: { success: false, errors: [...] }
 * 
 * Coding Principles:
 *   - Composition: Can be combined with route-level validation
 *   - DRY: Single validation middleware used across all routes
 *   - Fail-Fast: Returns immediately on first validation failure
 * 
 * Usage in Routes:
 *   const validate = require('../middleware/validate');
 *   router.post('/', protect, authorize('Farm Manager'), [
 *     body('name').notEmpty(),
 *     body('email').isEmail()
 *   ], validate, async (req, res) => { ... });
 * 
 * @param {Array} validations - Array of express-validator validation chains
 * @returns {Function} Express middleware function
 */
const { validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations in parallel
    await Promise.all(validations.map(v => v.run(req)));
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();
    // Return standardized error response
    return res.status(400).json({ success: false, errors: errors.array() });
  };
};

module.exports = validate;