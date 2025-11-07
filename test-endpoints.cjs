// Test script for game API endpoints
const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

async function testEndpoints() {
  console.log('Testing game API endpoints...\n');

  const endpoints = [
    '/health',
    '/api/world/defaultWorldStatus',
    '/api/world/gameDescriptions',
    '/api/world/worldState'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint}...`);
      const response = await makeRequest(endpoint);
      console.log(`Status: ${response.status}`);
      
      if (response.status === 200) {
        try {
          const parsed = JSON.parse(response.data);
          console.log(`Response: ${JSON.stringify(parsed, null, 2).substring(0, 200)}...`);
        } catch (e) {
          console.log(`Response: ${response.data.substring(0, 200)}...`);
        }
      } else {
        console.log(`Error: ${response.data}`);
      }
      console.log('---\n');
    } catch (error) {
      console.log(`Failed to connect to ${endpoint}: ${error.message}`);
      console.log('---\n');
    }
  }
}

testEndpoints();