const axios = require('axios');

// Test configuration
const CRON_SERVICE_URL = process.env.CRON_SERVICE_URL || 'http://localhost:3000';
const DHANTRA_CORE_URL = process.env.DHANTRA_CORE_URL || 'https://dhantra-core-production.up.railway.app';

async function testCronService() {
  console.log('🧪 Testing Dhantra Cron Service...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing health check...');
    const healthResponse = await axios.get(`${CRON_SERVICE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    console.log('');

    // Test 2: Create a test cron job
    console.log('2️⃣ Creating test cron job...');
    const testJob = {
      name: 'Test Job - Every 2 minutes',
      schedule: '*/2 * * * *', // Every 2 minutes
      tickers: ['TQQQ'],
      strategy: 'Reversal',
      confidenceThreshold: 0.7,
      buyAmount: 1000.0,
      phoneNumbers: ['+1-5857478699']
    };

    const createResponse = await axios.post(`${CRON_SERVICE_URL}/api/cron-jobs`, testJob);
    console.log('✅ Test job created:', createResponse.data);
    const jobId = createResponse.data.job.id;
    console.log('');

    // Test 3: List cron jobs
    console.log('3️⃣ Listing cron jobs...');
    const listResponse = await axios.get(`${CRON_SERVICE_URL}/api/cron-jobs`);
    console.log('✅ Jobs listed:', listResponse.data);
    console.log('');

    // Test 4: Execute job manually
    console.log('4️⃣ Executing job manually...');
    const executeResponse = await axios.post(`${CRON_SERVICE_URL}/api/cron-jobs/${jobId}/execute`);
    console.log('✅ Job executed manually:', executeResponse.data);
    console.log('');

    // Test 5: Get execution history
    console.log('5️⃣ Getting execution history...');
    const historyResponse = await axios.get(`${CRON_SERVICE_URL}/api/execution-history`);
    console.log('✅ Execution history:', historyResponse.data);
    console.log('');

    // Test 6: Toggle job status
    console.log('6️⃣ Toggling job status...');
    const toggleResponse = await axios.patch(`${CRON_SERVICE_URL}/api/cron-jobs/${jobId}/toggle`);
    console.log('✅ Job status toggled:', toggleResponse.data);
    console.log('');

    // Test 7: Delete test job
    console.log('7️⃣ Deleting test job...');
    const deleteResponse = await axios.delete(`${CRON_SERVICE_URL}/api/cron-jobs/${jobId}`);
    console.log('✅ Test job deleted:', deleteResponse.data);
    console.log('');

    console.log('🎉 All tests passed! Cron service is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testCronService();
}

module.exports = { testCronService };
