/**
 * Health Check Endpoint
 * ----------------------
 * Simple health check route for monitoring and load balancers.
 * Returns 200 OK with server status.
 *
 * Used by: Render.com health checks, uptime monitors
 */

const router = require('express').Router();

/**
 * GET /api/health
 * Health check endpoint - no authentication required
 *
 * @returns {Object} Health status
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;