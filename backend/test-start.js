console.log('=== TEST START SCRIPT ===');
console.log('Node version:', process.version);
console.log('Working directory:', process.cwd());

const express = require('express');
console.log('Express loaded successfully');

// Create a simple server
const app = express();
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('Test server is running!');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Test server is running' });
});

console.log(`Starting test server on port ${PORT}...`);

try {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`SUCCESS: Test server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
  
  server.on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });
  
  console.log('Server listen initiated');
} catch (error) {
  console.error('FAILED to start server:', error);
  process.exit(1);
}