import http from 'http';

function testEndpoint(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`\n=== ${path} ===`);
        console.log(`Status: ${res.statusCode}`);
        try {
          const json = JSON.parse(data);
          console.log('Response keys:', Object.keys(json));
          if (json.worldMap) {
            console.log('worldMap keys:', Object.keys(json.worldMap));
          }
        } catch (e) {
          console.log('Response length:', data.length);
          console.log('Response preview:', data.substring(0, 200));
        }
        resolve(data);
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.end();
  });
}

async function runTests() {
  try {
    await testEndpoint('/api/world/defaultWorldStatus');
    await testEndpoint('/api/world/gameDescriptions');
    await testEndpoint('/api/world/worldState');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

runTests();