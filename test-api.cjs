const http = require('http');

// Test defaultWorldStatus endpoint
function testEndpoint(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3001${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`\n=== ${path} ===`);
        console.log(`Status: ${res.statusCode}`);
        try {
          const json = JSON.parse(data);
          console.log('Response:', JSON.stringify(json, null, 2));
        } catch (e) {
          console.log('Response:', data);
        }
        resolve(data);
      });
    }).on('error', reject);
  });
}

async function runTests() {
  try {
    await testEndpoint('/api/world/defaultWorldStatus');
    await testEndpoint('/api/world/gameDescriptions');
    await testEndpoint('/api/world/worldState');
  } catch (error) {
    console.error('Error testing endpoints:', error.message);
  }
}

runTests();