const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

const allowedOrigins = [
  'http://localhost:5000',
  'http://localhost:3000',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:3000'
];

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

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

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

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/contact', contactLimiter);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/production', require('./routes/production'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/compliance', require('./routes/compliance'));
app.use('/api/config', require('./routes/config'));
app.use('/api/data', require('./routes/data'));
app.use('/api/crm', require('./routes/crm'));
app.use('/api/harvest', require('./routes/harvest'));
app.use('/api/products', require('./routes/products'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/system-logs', require('./routes/system-logs'));
app.use('/api/api-keys', require('./routes/api-keys'));
app.use('/api/notification-configs', require('./routes/notification-configs'));
app.use('/api/medication', require('./routes/medication'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/contact', require('./routes/contact'));

app.get('/', (req, res) => {
  res.redirect('/pages/public/index.html');
});

app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ success: false, message: 'CORS: Origin not allowed' });
  }
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

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
