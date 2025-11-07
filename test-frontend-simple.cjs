const http = require('http');

function testFrontend() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5177,
      path: '/',
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
          headers: res.headers,
          data: data.substring(0, 1000) // First 1000 chars
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function runTest() {
  try {
    console.log('Testing frontend at http://localhost:5177...');
    const response = await testFrontend();
    
    console.log(`Status: ${response.status}`);
    console.log('Content-Type:', response.headers['content-type']);
    console.log('Response preview:');
    console.log(response.data);
    
    if (response.data.includes('html')) {
      console.log('✅ Frontend is serving HTML');
    } else {
      console.log('❌ Frontend not serving HTML');
    }
    
  } catch (error) {
    console.error('❌ Frontend test failed:', error.message);
    console.error('Error details:', error);
    
    // Check if servers are running
    console.log('\nChecking if servers are accessible...');
    
    // Test backend
    try {
      const backendTest = await new Promise((resolve, reject) => {
        const req = http.request({
          hostname: 'localhost',
          port: 3001,
          path: '/health',
          method: 'GET',
          timeout: 2000
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({ status: res.statusCode, data }));
        });
        req.on('error', reject);
        req.on('timeout', () => reject(new Error('Backend timeout')));
        req.end();
      });
      console.log('Backend status:', backendTest.status);
    } catch (e) {
      console.log('Backend not accessible:', e.message);
    }
    
    // Test if port 5177 is open
    try {
      const net = require('net');
      const socket = new net.Socket();
      socket.setTimeout(2000);
      socket.connect(5177, 'localhost', () => {
        console.log('Port 5177 is open');
        socket.destroy();
      });
      socket.on('error', () => {
        console.log('Port 5177 is not accessible');
      });
      socket.on('timeout', () => {
        console.log('Port 5177 connection timeout');
        socket.destroy();
      });
    } catch (e) {
      console.log('Port check failed:', e.message);
    }
  }
}

runTest();