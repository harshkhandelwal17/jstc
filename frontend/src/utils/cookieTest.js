// Simple cookie test script
import { getCookie, setCookie, getAllCookies } from './cookies';

// Test cookie functionality
export const testCookies = () => {
  console.log('🍪 COOKIE TEST: Starting cookie functionality test...');
  
  // Test 1: Set a test cookie
  setCookie('test-cookie', 'test-value', 1);
  
  // Test 2: Read the test cookie
  const testValue = getCookie('test-cookie');
  console.log('🍪 COOKIE TEST: Test cookie value:', testValue);
  
  // Test 3: Check all cookies
  const allCookies = getAllCookies();
  console.log('🍪 COOKIE TEST: All cookies:', allCookies);
  
  // Test 4: Check for token cookie specifically
  const tokenCookie = getCookie('token');
  console.log('🍪 COOKIE TEST: Token cookie:', tokenCookie ? 'Present' : 'Not found');
  
  console.log('🍪 COOKIE TEST: Test completed');
};

// Auto-run test when imported
setTimeout(testCookies, 1000);

