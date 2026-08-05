console.log('=== TEST START SCRIPT ===');
console.log('This script runs before server.js to test if Render can execute Node.js code');
console.log('Node version:', process.version);
console.log('Working directory:', process.cwd());

// Try to require a module
try {
  const express = require('express');
  console.log('Express loaded successfully');
} catch (err) {
  console.error('Failed to load express:', err.message);
  process.exit(1);
}

console.log('Test script completed successfully');
console.log('=== END TEST ===');