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
    allowedOrigins.push(process.env.BASE_URL);
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

  // Server Startup
  const PORT = process.env.PORT || 5000;
  console.log(`Attempting to start server on port ${PORT}...`);

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

} catch (error) {
  console.error('FATAL: Server failed to start:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}