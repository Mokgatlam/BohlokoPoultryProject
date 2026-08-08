// Write to stderr to ensure logs appear immediately
process.stderr.write('\n=== SERVER STARTING ===\n');
process.stderr.write('Node version: ' + process.version + '\n');
process.stderr.write('Working directory: ' + process.cwd() + '\n');

// Wrap entire file in try-catch to catch any startup errors
try {

  const express = require('express');
  const cors = require('cors');
  const helmet = require('helmet');
  const rateLimit = require('express-rate-limit');
  const dotenv = require('dotenv');
  const path = require('path');

  console.log('All requires loaded successfully');

  // Load environment variables
  console.log('Loading .env from:', path.join(__dirname, '.env'));
  dotenv.config({ path: path.join(__dirname, '.env') });
  console.log('Environment loaded. NODE_ENV:', process.env.NODE_ENV);

  const app = express();

  // Trust proxy (Render uses a reverse proxy; needed for rate-limiting & IP detection)
  app.set('trust proxy', 1);

  // Security Headers
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));

  // CORS Configuration
  const allowedOrigins = [
    'http://localhost:5000',
    'http://localhost:3000',
    'http://127.0.0.1:5000',
    'http://127.0.0.1:3000'
  ];

  if (process.env.NODE_ENV === 'production' && process.env.BASE_URL) {
    let baseUrl = process.env.BASE_URL;
    // Render's fromService.host returns just the hostname (no protocol)
    // Browsers send full origin like https://bohloko-family-farm-backend.onrender.com
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = 'https://' + baseUrl;
      console.log('[CORS] BASE_URL was missing protocol, prepended https://:', baseUrl);
    }
    allowedOrigins.push(baseUrl);
    console.log('[CORS] Allowed origins:', allowedOrigins);
  }

  const corsOptions = {
    origin: function(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  };

  // Rate Limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: 'Too many requests, please try again later.' }
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Too many login attempts, please try again later.' }
  });

  const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { success: false, message: 'Too many contact submissions, please try again later.' }
  });

  // Body Parsing
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Static File Serving
  const rootPath = path.join(__dirname, '..');
  const pagesPath = path.join(rootPath, 'pages');
  const assetsPath = path.join(rootPath, 'assets');

  app.use((req, res, next) => {
    if (req.path.startsWith('/backend/') || req.path.includes('.env') || req.path.includes('seed.js')) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
  });

  app.use('/assets', express.static(assetsPath));
  app.use('/pages', express.static(pagesPath));
  app.use(express.static(rootPath));

  // Rate Limiters
  app.use('/api', apiLimiter);
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/forgot-password', authLimiter);
  app.use('/api/contact', contactLimiter);

  // Health Check
  console.log('Loading health route...');
  app.use('/api', require('./routes/health'));
  console.log('Health route loaded');

  // API Routes - Load one by one to identify which one fails
  const routes = [
    { path: '/api/auth', module: './routes/auth' },
    { path: '/api/production', module: './routes/production' },
    { path: '/api/inventory', module: './routes/inventory' },
    { path: '/api/orders', module: './routes/orders' },
    { path: '/api/users', module: './routes/users' },
    { path: '/api/analytics', module: './routes/analytics' },
    { path: '/api/compliance', module: './routes/compliance' },
    { path: '/api/config', module: './routes/config' },
    { path: '/api/data', module: './routes/data' },
    { path: '/api/crm', module: './routes/crm' },
    { path: '/api/harvest', module: './routes/harvest' },
    { path: '/api/products', module: './routes/products' },
    { path: '/api/payments', module: './routes/payments' },
    { path: '/api/payfast', module: './routes/payfast' },
    { path: '/api/employees', module: './routes/employees' },
    { path: '/api/notifications', module: './routes/notifications' },
    { path: '/api/system-logs', module: './routes/system-logs' },
    { path: '/api/api-keys', module: './routes/api-keys' },
    { path: '/api/notification-configs', module: './routes/notification-configs' },
    { path: '/api/medication', module: './routes/medication' },
    { path: '/api/cart', module: './routes/cart' },
    { path: '/api/contact', module: './routes/contact' }
  ];

  for (const route of routes) {
    try {
      console.log(`Loading route: ${route.path} from ${route.module}`);
      app.use(route.path, require(route.module));
      console.log(`✓ Route loaded: ${route.path}`);
    } catch (err) {
      console.error(`✗ Failed to load route ${route.path}:`, err.message);
      throw err;
    }
  }

  console.log('All routes loaded successfully');

  // Request Logging Middleware
  const systemLogService = require('./services/SystemLogService');
  app.use(async (req, res, next) => {
    const start = Date.now();
    res.on('finish', async () => {
      const duration = Date.now() - start;
      if (req.path.startsWith('/api') && !req.path.includes('/api/health')) {
        try {
          await systemLogService.create({
            level: res.statusCode >= 400 ? 'warn' : 'info',
            message: `${req.method} ${req.originalUrl} ${res.statusCode}`,
            category: 'system',
            action: 'http_request',
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            responseTime: duration,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
          });
        } catch (e) { /* don't let logging errors break the request */ }
      }
    });
    next();
  });

  // Root Redirect
  app.get('/', (req, res) => {
    res.redirect('/pages/public/index.html');
  });

  // Global Error Handler
  app.use((err, req, res, next) => {
    if (err.message === 'Not allowed by CORS') {
      return res.status(403).json({ success: false, message: 'CORS: Origin not allowed' });
    }
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Something went wrong!' });
  });

  // Run migrations and seed in production (replaces Render pre-deploy command)
  async function runMigrationsAndSeed() {
    if (process.env.NODE_ENV !== 'production') return;
    if (!process.env.DATABASE_URL) {
      console.error('[DB] No DATABASE_URL — skipping migrations');
      return;
    }
    try {
      console.log('[DB] Running migrations...');
      const knex = require('knex')(require('./knexfile').production);
      await knex.migrate.latest();
      console.log('[DB] Migrations complete');

      const userCount = await knex('users').count('id as count').first();
      if (parseInt(userCount.count) === 0) {
        console.log('[DB] Empty database — running seed...');
        await knex.destroy();
        const seedFn = require('./seed-pg');
        await seedFn();
      } else {
        console.log(`[DB] Database already seeded (${userCount.count} users). Skipping.`);
        await knex.destroy();
      }
    } catch (err) {
      console.error('[DB] Migration/seed error:', err.message);
      console.error('[DB] Server will start anyway — API endpoints may fail');
    }
  }

  // Server Startup
  const PORT = process.env.PORT || 5000;
  console.log(`Attempting to start server on port ${PORT}...`);

  // Log database URL status
  if (process.env.DATABASE_URL) {
    const masked = process.env.DATABASE_URL.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
    console.log('[DB] DATABASE_URL is set:', masked);
  } else {
    console.error('[DB] WARNING: DATABASE_URL is NOT set. Database operations will fail.');
  }

  function startServer() {
    try {
      const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`SUCCESS: Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log('Server is ready to accept connections');
      });

      server.on('error', (err) => {
        console.error('Server error:', err);
        process.exit(1);
      });

      process.on('SIGTERM', () => {
        console.log('SIGTERM received');
        server.close(() => process.exit(0));
      });

      console.log('Server listen initiated successfully');
    } catch (error) {
      console.error('FAILED to start server:', error);
      process.exit(1);
    }
  }

  runMigrationsAndSeed().then(() => startServer());

} catch (error) {
  console.error('FATAL: Server failed to start:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}