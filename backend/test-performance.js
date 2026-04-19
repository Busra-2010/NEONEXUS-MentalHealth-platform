#!/usr/bin/env node

// NEONEXUS Backend Performance Testing Script
// This script tests API endpoints and database performance

const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');

const config = {
  baseUrl: process.env.TEST_URL || 'http://localhost:5000',
  concurrent: parseInt(process.env.CONCURRENT_REQUESTS) || 10,
  iterations: parseInt(process.env.ITERATIONS) || 100,
  timeout: parseInt(process.env.TIMEOUT) || 5000
};

class PerformanceTester {
  constructor() {
    this.results = {
      total: 0,
      success: 0,
      failed: 0,
      avgResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      responseTimes: []
    };
  }

  async makeRequest(path, method = 'GET', data = null, headers = {}) {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const url = new URL(`${config.baseUrl}${path}`);
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        timeout: config.timeout
      };

      const client = url.protocol === 'https:' ? https : http;
      const req = client.request(options, (res) => {
        let responseData = '';
        
        res.on('data', chunk => {
          responseData += chunk;
        });

        res.on('end', () => {
          const endTime = performance.now();
          const responseTime = endTime - startTime;
          
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 400,
            statusCode: res.statusCode,
            responseTime,
            data: responseData
          });
        });
      });

      req.on('error', (err) => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        resolve({
          success: false,
          error: err.message,
          responseTime
        });
      });

      req.on('timeout', () => {
        req.destroy();
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        resolve({
          success: false,
          error: 'Request timeout',
          responseTime
        });
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  async testEndpoint(name, path, method = 'GET', data = null, headers = {}) {
    console.log(`\n🧪 Testing ${name}...`);
    console.log(`   Endpoint: ${method} ${path}`);
    console.log(`   Concurrent: ${config.concurrent}, Iterations: ${config.iterations}`);

    const results = {
      name,
      total: 0,
      success: 0,
      failed: 0,
      responseTimes: [],
      errors: {}
    };

    const startTime = performance.now();

    // Run concurrent batches
    for (let batch = 0; batch < config.iterations; batch += config.concurrent) {
      const batchSize = Math.min(config.concurrent, config.iterations - batch);
      const promises = [];

      for (let i = 0; i < batchSize; i++) {
        promises.push(this.makeRequest(path, method, data, headers));
      }

      const batchResults = await Promise.all(promises);
      
      for (const result of batchResults) {
        results.total++;
        results.responseTimes.push(result.responseTime);

        if (result.success) {
          results.success++;
        } else {
          results.failed++;
          const errorKey = result.error || `HTTP ${result.statusCode}`;
          results.errors[errorKey] = (results.errors[errorKey] || 0) + 1;
        }
      }

      // Progress indicator
      const progress = Math.round((batch + batchSize) / config.iterations * 100);
      process.stdout.write(`\r   Progress: ${progress}%`);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    // Calculate statistics
    results.responseTimes.sort((a, b) => a - b);
    results.avgResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;
    results.minResponseTime = results.responseTimes[0] || 0;
    results.maxResponseTime = results.responseTimes[results.responseTimes.length - 1] || 0;
    results.p95ResponseTime = results.responseTimes[Math.floor(results.responseTimes.length * 0.95)] || 0;
    results.throughput = results.total / (totalTime / 1000);

    // Display results
    console.log('\n');
    console.log(`   ✅ Success: ${results.success}/${results.total} (${(results.success/results.total*100).toFixed(1)}%)`);
    console.log(`   ❌ Failed: ${results.failed}/${results.total} (${(results.failed/results.total*100).toFixed(1)}%)`);
    console.log(`   ⏱️  Avg Response: ${results.avgResponseTime.toFixed(2)}ms`);
    console.log(`   🚀 Min Response: ${results.minResponseTime.toFixed(2)}ms`);
    console.log(`   🐌 Max Response: ${results.maxResponseTime.toFixed(2)}ms`);
    console.log(`   📊 95th Percentile: ${results.p95ResponseTime.toFixed(2)}ms`);
    console.log(`   🔄 Throughput: ${results.throughput.toFixed(2)} req/s`);

    if (Object.keys(results.errors).length > 0) {
      console.log('   🚨 Errors:');
      for (const [error, count] of Object.entries(results.errors)) {
        console.log(`      ${error}: ${count}`);
      }
    }

    return results;
  }

  async runHealthCheck() {
    console.log('🔍 Running initial health check...');
    
    const result = await this.makeRequest('/api/health');
    
    if (result.success) {
      try {
        const data = JSON.parse(result.data);
        console.log(`✅ Server is healthy: ${data.message}`);
        return true;
      } catch (e) {
        console.log('✅ Server responded but data is not JSON');
        return true;
      }
    } else {
      console.log(`❌ Health check failed: ${result.error || `HTTP ${result.statusCode}`}`);
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 NEONEXUS Backend Performance Testing');
    console.log(`📊 Configuration: ${config.concurrent} concurrent, ${config.iterations} total requests`);
    console.log(`🌐 Target: ${config.baseUrl}`);

    // Health check first
    const isHealthy = await this.runHealthCheck();
    if (!isHealthy) {
      console.log('\n❌ Server health check failed. Cannot proceed with performance tests.');
      process.exit(1);
    }

    const allResults = [];

    // Test endpoints
    const tests = [
      { name: 'Health Check', path: '/api/health' },
      { name: 'Forum Categories', path: '/api/forum/categories' },
      // Add more endpoints as needed based on your API
    ];

    for (const test of tests) {
      try {
        const result = await this.testEndpoint(test.name, test.path, test.method, test.data, test.headers);
        allResults.push(result);
      } catch (error) {
        console.log(`\n❌ Test "${test.name}" failed: ${error.message}`);
      }
    }

    // Overall summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 PERFORMANCE TEST SUMMARY');
    console.log('='.repeat(60));

    let totalRequests = 0;
    let totalSuccess = 0;
    let totalFailed = 0;
    let overallAvgResponseTime = 0;

    for (const result of allResults) {
      totalRequests += result.total;
      totalSuccess += result.success;
      totalFailed += result.failed;
      overallAvgResponseTime += result.avgResponseTime;

      console.log(`${result.name}:`);
      console.log(`  Success Rate: ${(result.success/result.total*100).toFixed(1)}%`);
      console.log(`  Avg Response: ${result.avgResponseTime.toFixed(2)}ms`);
      console.log(`  Throughput: ${result.throughput.toFixed(2)} req/s`);
    }

    overallAvgResponseTime = overallAvgResponseTime / allResults.length;

    console.log('\nOverall:');
    console.log(`  Total Requests: ${totalRequests}`);
    console.log(`  Success Rate: ${(totalSuccess/totalRequests*100).toFixed(1)}%`);
    console.log(`  Failed Requests: ${totalFailed}`);
    console.log(`  Average Response Time: ${overallAvgResponseTime.toFixed(2)}ms`);

    // Performance recommendations
    console.log('\n💡 Recommendations:');
    
    if (overallAvgResponseTime > 1000) {
      console.log('  ⚠️  High response times detected. Consider optimizing database queries.');
    }
    
    const overallSuccessRate = totalSuccess / totalRequests * 100;
    if (overallSuccessRate < 95) {
      console.log('  ⚠️  Low success rate. Check error logs and server stability.');
    }
    
    if (overallSuccessRate >= 95 && overallAvgResponseTime < 500) {
      console.log('  🎉 Excellent performance! API is ready for production.');
    }

    console.log('\n✅ Performance testing completed!');
  }
}

// Run the performance tests
if (require.main === module) {
  const tester = new PerformanceTester();
  tester.runAllTests().catch(console.error);
}

module.exports = PerformanceTester;