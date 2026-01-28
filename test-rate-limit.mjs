// Test script for rate limiting
// Run with: node test-rate-limit.mjs

const BASE_URL = 'http://localhost:3001';

async function testLoginRateLimit() {
  console.log('\n🔐 Testing Login Rate Limit (5 attempts per 15 min)...\n');
  
  for (let i = 1; i <= 6; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'wrongpassword' })
      });
      
      const data = await response.json();
      const retryAfter = response.headers.get('Retry-After');
      
      console.log(`Request ${i}: Status ${response.status}`);
      if (response.status === 429) {
        console.log(`  ✅ Rate limited! Retry-After: ${retryAfter} seconds`);
        console.log(`  Message: ${data.error}`);
      } else {
        console.log(`  ⚪ ${data.error || 'OK'}`);
      }
    } catch (error) {
      console.log(`Request ${i}: ❌ Error - ${error.message}`);
    }
  }
}

async function testPasswordResetRateLimit() {
  console.log('\n🔑 Testing Password Reset Rate Limit (3 attempts per 15 min)...\n');
  
  for (let i = 1; i <= 4; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/password/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' })
      });
      
      const data = await response.json();
      const retryAfter = response.headers.get('Retry-After');
      
      console.log(`Request ${i}: Status ${response.status}`);
      if (response.status === 429) {
        console.log(`  ✅ Rate limited! Retry-After: ${retryAfter} seconds`);
        console.log(`  Message: ${data.error}`);
      } else {
        console.log(`  ⚪ ${data.ok ? 'OK' : data.error}`);
      }
    } catch (error) {
      console.log(`Request ${i}: ❌ Error - ${error.message}`);
    }
  }
}

async function testSearchRateLimit() {
  console.log('\n🔍 Testing Search Rate Limit (30 attempts per min)...\n');
  
  // Test with 31 requests
  for (let i = 1; i <= 31; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/search-simple?q=test&location=Alger`);
      
      const retryAfter = response.headers.get('Retry-After');
      
      if (response.status === 429) {
        const data = await response.json();
        console.log(`Request ${i}: Status ${response.status}`);
        console.log(`  ✅ Rate limited! Retry-After: ${retryAfter} seconds`);
        console.log(`  Message: ${data.error}`);
        break; // Stop after hitting the limit
      } else if (i === 1 || i === 30 || i === 31) {
        // Only log first, 30th, and 31st request to avoid spam
        console.log(`Request ${i}: Status ${response.status} ⚪`);
      }
    } catch (error) {
      console.log(`Request ${i}: ❌ Error - ${error.message}`);
    }
  }
}

async function runTests() {
  console.log('🚀 Starting Rate Limit Tests...');
  console.log('================================\n');
  
  await testLoginRateLimit();
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
  
  await testPasswordResetRateLimit();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testSearchRateLimit();
  
  console.log('\n================================');
  console.log('✨ All tests completed!\n');
}

runTests();
