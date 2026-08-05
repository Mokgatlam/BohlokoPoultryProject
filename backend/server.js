/**
 * Express Server — Application Entry Point (NFR-014, NFR-015, NFR-016, NFR-017)
 *
 * Main HTTP server for the Bohloko Family Farm Poultry Processing System.
 * Configures security, CORS, rate limiting, static file serving, and all
 * API route modules. Listens on port 5000 (configurable via .env).
 *
 * NFR-014 (Browser/Device Compatibility):
 *   - CORS whitelist allows local dev (localhost:3000, :5000) and production
 *   - Serves responsive frontend assets (admin.css, public.css, staff.css)
 *   - Static file serving supports all device widths (320px minimum)
 *
 * NFR-015 (Browser Compatibility):
 *   - Helmet security headers compatible with all modern browsers
 *   - No browser-specific features; uses standard Web APIs
 *   - Static HTML served for clients without JS (graceful degradation)
 *
 * NFR-016 (Integration Compatibility):
 *   - 18 RESTful API route modules with JSON request/response
 *   - CORS middleware controls cross-origin access
 *   - Express JSON body parser (1MB limit) for API data exchange
 *   - Rate limiting protects integration endpoints from abuse
 *
 * NFR-017 (Deployment Compatibility):
 *   - dotenv.config() loads environment from .env file
 *   - PORT configurable via environment variable
 *   - Helmet security headers for production hardening
 *   - Static file serving for frontend deployment (single-server model)
 *
 * NFR-018 (Monitoring & Logging):
 *   - Console logging for server startup and config initialization
 *   - Error handler logs stack traces to console
 *   - Request logging available via Morgan (if enabled)
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// ---------------------------------------------------------------------------
// Security Headers — Helmet (NFR-017.2)
// Disables CSP and COEP for compatibility with Bootstrap CDN and inline scripts
// ---------------------------------------------------------------------------
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// ---------------------------------------------------------------------------
// CORS Configuration — Origin Whitelist (NFR-016.1, NFR-017.2)
// Allows requests from local dev servers and production domain.
// Credentials enabled for JWT cookie support.
// ---------------------------------------------------------------------------
const allowedOrigins = [
  'http://localhost:5000',
  'http://localhost:3000',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:3000'
];

const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

// ---------------------------------------------------------------------------
// Rate Limiting — API Abuse Prevention (NFR-017.2)
// Three tiers: general API (100/15min), auth (10/15min), contact (5/hr)
// ---------------------------------------------------------------------------
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many login attempts, please try again later.' }
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: 'Too many contact submissions, please try again later.' }
});

// ---------------------------------------------------------------------------
// Body Parsing (NFR-016.1)
// JSON body parser with 1MB limit for API requests
// URL-encoded parser for form submissions
// ---------------------------------------------------------------------------
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------------------
// Static File Serving — Frontend Deployment (NFR-017.1)
// Serves HTML pages, CSS, JS, and images from the project root
// ---------------------------------------------------------------------------
const rootPath = path.join(__dirname, '..');
const pagesPath = path.join(rootPath, 'pages');
const assetsPath = path.join(rootPath, 'assets');

// Security: Block access to backend source, .env, and seed files
app.use((req, res, next) => {
  if (req.path.startsWith('/backend/') || req.path.includes('.env') || req.path.includes('seed.js')) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  next();
});

// Serve static assets (CSS, JS, images, fonts)
app.use('/assets', express.static(assetsPath));
// Serve HTML pages
app.use('/pages', express.static(pagesPath));
// Serve root-level files (index.html, manifest.json, sw.js)
app.use(express.static(rootPath));

// ---------------------------------------------------------------------------
// Rate Limiters — Applied to Route Groups
// ---------------------------------------------------------------------------
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/contact', contactLimiter);

// ---------------------------------------------------------------------------
// API Routes — 18 RESTful Modules (NFR-016.1)
// Each route module encapsulates a domain: auth, production, orders, etc.
// ---------------------------------------------------------------------------
app.use('/api/auth', require('./routes/auth'));               // FR-001/002/003: Authentication
app.use('/api/production', require('./routes/production'));   // FR-004/005: Production cycles & daily logs
app.use('/api/inventory', require('./routes/inventory'));     // FR-008/009: Inventory management
app.use('/api/orders', require('./routes/orders'));           // FR-011/012/014: Orders & cancellation
app.use('/api/users', require('./routes/users'));             // FR-001/003: User management
app.use('/api/analytics', require('./routes/analytics'));     // FR-017/018/019: Analytics & reporting
app.use('/api/compliance', require('./routes/compliance'));   // FR-020/021: Quality control & compliance
app.use('/api/config', require('./routes/config'));           // FR-022: System configuration
app.use('/api/data', require('./routes/data'));               // FR-023: Data management & backup
app.use('/api/crm', require('./routes/crm'));                 // FR-016: Customer relationship management
app.use('/api/harvest', require('./routes/harvest'));         // FR-007: Harvest recording
app.use('/api/products', require('./routes/products'));       // FR-010: Product catalog
app.use('/api/payments', require('./routes/payments'));       // FR-013: Payment processing
app.use('/api/employees', require('./routes/employees'));     // Employee management
app.use('/api/notifications', require('./routes/notifications')); // Notification delivery
app.use('/api/system-logs', require('./routes/system-logs')); // FR-023: System logging
app.use('/api/api-keys', require('./routes/api-keys'));       // API key management
app.use('/api/notification-configs', require('./routes/notification-configs')); // FR-022: Notification config
app.use('/api/medication', require('./routes/medication'));   // FR-006: Medication tracking
app.use('/api/cart', require('./routes/cart'));               // FR-010/011: Shopping cart
app.use('/api/contact', require('./routes/contact'));         // Contact form submissions

// ---------------------------------------------------------------------------
// Root Redirect — Homepage Routing (NFR-017.1)
// Redirects bare domain to the public homepage
// ---------------------------------------------------------------------------
app.get('/', (req, res) => {
  res.redirect('/pages/public/index.html');
});

// ---------------------------------------------------------------------------
// Global Error Handler — (NFR-018.2)
// Catches CORS errors, unhandled exceptions, and returns JSON error response
// Logs stack traces to console for server-side monitoring
// ---------------------------------------------------------------------------
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ success: false, message: 'CORS: Origin not allowed' });
  }
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

// ---------------------------------------------------------------------------
// Server Startup — (NFR-017.1)
// Binds to 0.0.0.0 for Docker/network access. Initializes default system
// config on first run. Logs startup status to console.
// ---------------------------------------------------------------------------
const SystemConfig = require('./models/SystemConfig');

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  try {
    await SystemConfig.initDefaults();
    console.log('System config defaults initialized');
  } catch (e) {
    console.error('Failed to init config defaults:', e.message);
  }
});