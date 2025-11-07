import http from 'http';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'OK', message: 'Test server working' }));
});

server.listen(3002, '0.0.0.0', () => {
  console.log('Test server running on port 3002');
});

// Keep process alive
setInterval(() => {}, 60000);