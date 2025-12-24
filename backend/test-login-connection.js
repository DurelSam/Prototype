const mongoose = require('mongoose');
const User = require('./src/models/User');
const Tenant = require('./src/models/Tenant');
const bcrypt = require('bcryptjs');
const axios = require('axios');
require('dotenv').config();

const TEST_EMAIL = 'test_connection_check@example.com';
const TEST_PASSWORD = 'password123';
const API_URL = 'http://localhost:5000/api/auth/login';

async function runTest() {
  console.log('🚀 Starting Login Connection Test...');

  try {
    // 1. Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/prototypedb');
    console.log('✅ MongoDB Connected');

    // 2. Cleanup previous test data
    await User.deleteOne({ email: TEST_EMAIL });
    await Tenant.deleteOne({ companyName: 'Test Connection Tenant' });

    // 3. Create Test Tenant
    const tenant = await Tenant.create({
      companyName: 'Test Connection Tenant',
    });

    // 4. Create Test User
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 12);
    const user = await User.create({
      tenant_id: tenant._id,
      email: TEST_EMAIL,
      password: hashedPassword,
      role: 'UpperAdmin', // Using UpperAdmin to check verification logic
      firstName: 'Test',
      lastName: 'User',
      emailVerified: true, // Force verified to allow login
      isActive: true
    });
    
    console.log(`👤 Test User Created: ${TEST_EMAIL}`);

    // 5. Attempt Login via API
    console.log(`🔐 Attempting Login via API (${API_URL})...`);
    
    try {
      const response = await axios.post(API_URL, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      });

      if (response.data.success) {
        console.log('✅ LOGIN SUCCESSFUL!');
        console.log('🔑 Token received:', response.data.token ? 'Yes' : 'No');
        console.log('👤 User data:', response.data.user.email);
      } else {
        console.log('❌ Login Failed (Logical):', response.data);
      }
    } catch (apiError) {
      console.error('❌ Login API Failed:', apiError.message);
      if (apiError.response) {
        console.error('   Status:', apiError.response.status);
        console.error('   Data:', apiError.response.data);
      } else if (apiError.request) {
        console.error('   No response received (Network Error)');
      }
    }

    // 6. Cleanup
    console.log('🧹 Cleaning up...');
    await User.deleteOne({ _id: user._id });
    await Tenant.deleteOne({ _id: tenant._id });
    console.log('✅ Cleanup complete');

  } catch (error) {
    console.error('💥 Critical Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Test Finished');
  }
}

runTest();
