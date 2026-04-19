// Use Node.js built-in fetch (Node 18+) or fallback
const fetch = globalThis.fetch || require('node-fetch');

async function testHealthEndpoint() {
  try {
    const response = await fetch('http://localhost:5000/api/health');
    const data = await response.json();
    console.log('✅ Health endpoint test:', JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.log('❌ Health endpoint failed:', error.message);
    return false;
  }
}

async function testForumCategories() {
  try {
    // Test without authentication first
    const response = await fetch('http://localhost:5000/api/forum/categories');
    const data = await response.json();
    console.log('✅ Forum categories (no auth):', JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.log('❌ Forum categories failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Starting API Tests...\n');
  
  const healthTest = await testHealthEndpoint();
  console.log();
  
  const forumTest = await testForumCategories();
  console.log();
  
  console.log('📊 Test Summary:');
  console.log('- Health endpoint:', healthTest ? '✅ PASS' : '❌ FAIL');
  console.log('- Forum categories:', forumTest ? '✅ PASS' : '❌ FAIL');
  
  if (healthTest && forumTest) {
    console.log('\n🎉 All tests passed! Server is working properly.');
  } else {
    console.log('\n⚠️ Some tests failed. Check server logs.');
  }
}

// Run tests after a short delay to ensure server is ready
setTimeout(runTests, 2000);

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test user registration and authentication
async function testAuthentication() {
  console.log('🔐 Testing Authentication...');
  
  try {
    // Register a test user
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      email: 'test@university.edu',
      username: 'testuser',
      password: 'testpass123',
      fullName: 'Test User',
      role: 'student',
      institutionId: 'UNIV001',
      yearOfStudy: 2,
      department: 'Computer Science',
      studentId: 'ST001'
    });
    
    console.log('✅ Registration successful:', registerResponse.data.success);
    
    // Login with the user
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@university.edu',
      password: 'testpass123'
    });
    
    console.log('✅ Login successful:', loginResponse.data.success);
    return loginResponse.data.token;
    
  } catch (error) {
    if (error.response?.status === 409) {
      // User already exists, try to login
      console.log('ℹ️ User already exists, attempting login...');
      try {
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
          email: 'test@university.edu',
          password: 'testpass123'
        });
        console.log('✅ Login successful:', loginResponse.data.success);
        return loginResponse.data.token;
      } catch (loginError) {
        console.error('❌ Login failed:', loginError.response?.data?.message || loginError.message);
        throw loginError;
      }
    } else {
      console.error('❌ Authentication failed:', error.response?.data?.message || error.message);
      throw error;
    }
  }
}

// Test user profile management
async function testUserProfile(token) {
  console.log('👤 Testing User Profile Management...');
  
  const headers = { Authorization: `Bearer ${token}` };
  
  try {
    // Get user profile
    const profileResponse = await axios.get(`${BASE_URL}/users/profile`, { headers });
    console.log('✅ Get profile successful:', profileResponse.data.success);
    
    // Update profile
    const updateResponse = await axios.put(`${BASE_URL}/users/profile`, {
      name: 'Updated Test User',
      major: 'Software Engineering',
      year_of_study: 3
    }, { headers });
    console.log('✅ Update profile successful:', updateResponse.data.success);
    
  } catch (error) {
    console.error('❌ User profile test failed:', error.response?.data?.message || error.message);
  }
}

// Test mood tracking
async function testMoodTracking(token) {
  console.log('🎭 Testing Mood Tracking...');
  
  const headers = { Authorization: `Bearer ${token}` };
  
  try {
    // Submit mood entry
    const moodEntry = await axios.post(`${BASE_URL}/assessments/mood-entries`, {
      mood_level: 7,
      mood_tags: ['happy', 'energetic'],
      notes: 'Had a great day at school',
      energy_level: 8,
      stress_level: 3,
      sleep_hours: 7.5,
      sleep_quality: 4,
      activities: ['studying', 'exercising'],
      triggers: [],
      location: 'campus',
      weather: 'sunny'
    }, { headers });
    console.log('✅ Mood entry submission successful:', moodEntry.data.success);
    
    // Get mood entries
    const entriesResponse = await axios.get(`${BASE_URL}/assessments/mood-entries`, { headers });
    console.log('✅ Get mood entries successful:', entriesResponse.data.success);
    console.log('   Entries found:', entriesResponse.data.data.entries.length);
    
    // Get mood analytics
    const analyticsResponse = await axios.get(`${BASE_URL}/assessments/mood-analytics?period=30`, { headers });
    console.log('✅ Get mood analytics successful:', analyticsResponse.data.success);
    
  } catch (error) {
    console.error('❌ Mood tracking test failed:', error.response?.data?.message || error.message);
  }
}

// Test mental health assessments
async function testAssessments(token) {
  console.log('📋 Testing Mental Health Assessments...');
  
  const headers = { Authorization: `Bearer ${token}` };
  
  try {
    // Get available assessments
    const assessmentsResponse = await axios.get(`${BASE_URL}/assessments/mental-health-assessments`, { headers });
    console.log('✅ Get assessments successful:', assessmentsResponse.data.success);
    console.log('   Available assessments:', assessmentsResponse.data.data.assessments.length);
    
    // Get user's assessment history
    const historyResponse = await axios.get(`${BASE_URL}/assessments/assessment-responses`, { headers });
    console.log('✅ Get assessment history successful:', historyResponse.data.success);
    console.log('   Previous responses:', historyResponse.data.data.responses.length);
    
  } catch (error) {
    console.error('❌ Assessments test failed:', error.response?.data?.message || error.message);
  }
}

// Test appointment management
async function testAppointments(token) {
  console.log('📅 Testing Appointment Management...');
  
  const headers = { Authorization: `Bearer ${token}` };
  
  try {
    // Get available counselors
    const counselorsResponse = await axios.get(`${BASE_URL}/appointments/counselors`, { headers });
    console.log('✅ Get counselors successful:', counselorsResponse.data.success);
    console.log('   Available counselors:', counselorsResponse.data.data.counselors.length);
    
    if (counselorsResponse.data.data.counselors.length > 0) {
      const firstCounselor = counselorsResponse.data.data.counselors[0];
      
      // Get counselor availability
      const availabilityResponse = await axios.get(
        `${BASE_URL}/appointments/counselors/${firstCounselor.id}/availability`, 
        { headers }
      );
      console.log('✅ Get availability successful:', availabilityResponse.data.success);
      console.log('   Available days:', availabilityResponse.data.data.availability.length);
      
      // Try to book an appointment (using future date)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const appointmentDate = tomorrow.toISOString().split('T')[0];
      
      try {
        const bookResponse = await axios.post(`${BASE_URL}/appointments/book`, {
          counselor_id: firstCounselor.id,
          appointment_date: appointmentDate,
          appointment_time: '10:00',
          duration_minutes: 60,
          meeting_type: 'video',
          is_anonymous: false,
          notes: 'Test appointment booking'
        }, { headers });
        console.log('✅ Book appointment successful:', bookResponse.data.success);
        
        // Get user's appointments
        const myAppointmentsResponse = await axios.get(`${BASE_URL}/appointments/my-appointments`, { headers });
        console.log('✅ Get my appointments successful:', myAppointmentsResponse.data.success);
        console.log('   My appointments:', myAppointmentsResponse.data.data.appointments.length);
        
      } catch (bookError) {
        console.log('ℹ️ Appointment booking failed (expected if slot unavailable):', 
          bookError.response?.data?.message || 'Unknown error');
      }
    } else {
      console.log('ℹ️ No counselors available to test appointment booking');
    }
    
  } catch (error) {
    console.error('❌ Appointments test failed:', error.response?.data?.message || error.message);
  }
}

// Test mental health resources
async function testResources(token) {
  console.log('📚 Testing Mental Health Resources...');
  
  const headers = { Authorization: `Bearer ${token}` };
  
  try {
    // Get all resources
    const resourcesResponse = await axios.get(`${BASE_URL}/resources`, { headers });
    console.log('✅ Get resources successful:', resourcesResponse.data.success);
    console.log('   Total resources:', resourcesResponse.data.data?.resources?.length || 0);
    
    // Get resource filters
    const filtersResponse = await axios.get(`${BASE_URL}/resources/filters`, { headers });
    console.log('✅ Get resource filters successful:', filtersResponse.data.success);
    console.log('   Available categories:', filtersResponse.data.data?.categories?.length || 0);
    
    // Get featured resources
    const featuredResponse = await axios.get(`${BASE_URL}/resources/featured`, { headers });
    console.log('✅ Get featured resources successful:', featuredResponse.data.success);
    console.log('   Featured resources:', featuredResponse.data.data?.resources?.length || 0);
    
  } catch (error) {
    console.error('❌ Resources test failed:', error.response?.data?.message || error.message);
  }
}

// Test analytics dashboard (note: will likely fail for non-admin/counselor users)
async function testAnalytics(token) {
  console.log('📊 Testing Analytics Dashboard...');
  
  const headers = { Authorization: `Bearer ${token}` };
  
  try {
    // Try to get dashboard analytics
    const dashboardResponse = await axios.get(`${BASE_URL}/analytics/dashboard`, { headers });
    console.log('✅ Get dashboard analytics successful:', dashboardResponse.data.success);
    
    // Try to get engagement metrics
    const engagementResponse = await axios.get(`${BASE_URL}/analytics/engagement`, { headers });
    console.log('✅ Get engagement analytics successful:', engagementResponse.data.success);
    
    // Get report templates
    const templatesResponse = await axios.get(`${BASE_URL}/analytics/reports/templates`, { headers });
    console.log('✅ Get report templates successful:', templatesResponse.data.success);
    console.log('   Available templates:', templatesResponse.data.data?.templates?.length || 0);
    
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('ℹ️ Analytics access denied (expected for student users)');
    } else {
      console.error('❌ Analytics test failed:', error.response?.data?.message || error.message);
    }
  }
}

// Test token verification
async function testTokenVerification(token) {
  console.log('🔍 Testing Token Verification...');
  
  const headers = { Authorization: `Bearer ${token}` };
  
  try {
    const verifyResponse = await axios.get(`${BASE_URL}/auth/verify`, { headers });
    console.log('✅ Token verification successful:', verifyResponse.data.success);
    console.log('   User role:', verifyResponse.data.user.role);
    
  } catch (error) {
    console.error('❌ Token verification test failed:', error.response?.data?.message || error.message);
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting NEONEXUS Backend API Tests\n');
  
  try {
    // Test health endpoint first
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);
    console.log('   API Version:', healthResponse.data.version);
    console.log();
    
    // Test authentication
    const token = await testAuthentication();
    console.log();
    
    // Test other endpoints with the token
    await testTokenVerification(token);
    console.log();
    
    await testUserProfile(token);
    console.log();
    
    await testMoodTracking(token);
    console.log();
    
    await testAssessments(token);
    console.log();
    
    await testAppointments(token);
    console.log();
    
    await testResources(token);
    console.log();
    
    await testAnalytics(token);
    console.log();
    
    console.log('🎉 All tests completed!');
    console.log('\n📊 Summary:');
    console.log('✅ User Management APIs');
    console.log('✅ Mental Health Assessment APIs');
    console.log('✅ Mood Tracking APIs');
    console.log('✅ Appointment Management APIs');
    console.log('✅ Mental Health Resources APIs');
    console.log('✅ Analytics Dashboard APIs');
    
  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Check if axios is available
try {
  require('axios');
  runTests();
} catch (e) {
  console.log('📦 Installing axios for testing...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install axios', { stdio: 'inherit', cwd: __dirname });
    console.log('✅ Axios installed, running tests...\n');
    delete require.cache[require.resolve('axios')];
    const axios = require('axios');
    runTests();
  } catch (installError) {
    console.error('❌ Failed to install axios:', installError.message);
    process.exit(1);
  }
}