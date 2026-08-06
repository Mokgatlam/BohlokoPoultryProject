// Ultra minimal test - NO dependencies, just Node built-ins
console.log('STARTING MINIMAL TEST');
console.log('Node version:', process.version);
console.log('PORT:', process.env.PORT || 'NOT SET');

const http = require('http');
const server = http.createServer((req, res) => {
  console.log('Received request');
  res.writeHead(200);
  res.end('OK');
});

const PORT = process.env.PORT || 5000;
console.log('Attempting to listen on port', PORT);

server.listen(PORT, '0.0.0.0', () => {
  console.log('SUCCESS: Server listening on', PORT);
});