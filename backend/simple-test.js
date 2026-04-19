const http = require('http');

function testEndpoint(path, description) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ ${description}:`);
        console.log(`   Status: ${res.statusCode}`);
        try {
          const json = JSON.parse(data);
          console.log(`   Response:`, JSON.stringify(json, null, 4));
        } catch (e) {
          console.log(`   Response:`, data);
        }
        console.log('');
        resolve(true);
      });
    });

    req.on('error', (err) => {
      console.log(`❌ ${description} failed:`, err.message);
      console.log('');
      resolve(false);
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing NEONEXUS API Endpoints...\n');
  
  // Test health endpoint
  await testEndpoint('/api/health', 'Health Check');
  
  console.log('🎉 Basic connectivity test completed!');
}

runTests();