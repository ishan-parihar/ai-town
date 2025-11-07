import http from 'http';

const req = http.get('http://localhost:3001/api/world/defaultWorldStatus', (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Body length:', data.length);
    console.log('Body:', data.substring(0, 500));
  });
});

req.on('error', (e) => {
  console.error('Problem with request:', e.message);
});

req.setTimeout(5000, () => {
  console.error('Request timed out');
  req.destroy();
});