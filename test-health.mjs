import http from 'http';

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`);
  console.log(`headers:`, res.headers);
  
  res.on('data', (d) => {
    console.log('Body:', d.toString());
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.on('timeout', () => {
  console.error('Request timeout');
  req.destroy();
});

req.end();