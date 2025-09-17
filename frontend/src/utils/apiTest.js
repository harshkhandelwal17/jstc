// API Test utility to debug authentication issues

import axiosInstance from './axios';
import { getCookie } from './cookies';

export const testAPIs = async (studentId = null) => {
  console.log('🔧 API TEST: Starting comprehensive API test...');
  
  // Test 1: Check token availability
  console.log('🔧 API TEST 1: Checking token availability');
  const localToken = localStorage.getItem('token');
  const cookieToken = getCookie('token');
  
  console.log('🔧 API TEST: LocalStorage token:', localToken ? 'Present' : 'Not found');
  console.log('🔧 API TEST: Cookie token:', cookieToken ? 'Present' : 'Not found');
  
  if (!localToken && !cookieToken) {
    console.error('🔧 API TEST: No token found - user needs to login');
    return;
  }
  
  // Test 2: Test back subjects API
  console.log('🔧 API TEST 2: Testing back subjects API');
  try {
    const backSubjectsResponse = await axiosInstance.get('/reports/back-subjects');
    console.log('🔧 API TEST: Back subjects API success:', backSubjectsResponse.data);
  } catch (error) {
    console.error('🔧 API TEST: Back subjects API failed:', error.response?.data || error.message);
  }
  
  // Test 3: Test payment status API (if studentId provided)
  if (studentId) {
    console.log('🔧 API TEST 3: Testing payment status API for student:', studentId);
    try {
      const paymentResponse = await axiosInstance.get(`/students/${studentId}/payment-status`);
      console.log('🔧 API TEST: Payment status API success:', paymentResponse.data);
    } catch (error) {
      console.error('🔧 API TEST: Payment status API failed:', error.response?.data || error.message);
    }
    
    // Test 4: Test back subjects pending API
    console.log('🔧 API TEST 4: Testing back subjects pending API for student:', studentId);
    try {
      const backSubjectsPendingResponse = await axiosInstance.get(`/students/${studentId}/back-subjects/pending`);
      console.log('🔧 API TEST: Back subjects pending API success:', backSubjectsPendingResponse.data);
    } catch (error) {
      console.error('🔧 API TEST: Back subjects pending API failed:', error.response?.data || error.message);
    }
  }
  
  console.log('🔧 API TEST: Test completed');
};

// Auto-test when imported (with delay to allow app to load)
setTimeout(() => {
  console.log('🔧 API TEST: Auto-testing APIs...');
  testAPIs();
}, 3000);

