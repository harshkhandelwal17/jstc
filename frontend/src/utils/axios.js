import axios from 'axios';
import { getCookie } from './cookies';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 60000, // Increased timeout to 60 seconds to prevent premature timeouts
  withCredentials: true, // Enable cookies and credentials
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    // Try to get token from localStorage first, then cookies
    let token = localStorage.getItem('token');
    if (!token) {
      token = getCookie('token');
      console.log('AXIOS: Using token from cookie');
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Get error details for better handling
    const status = error.response?.status;
    const errorMessage = error.response?.data?.message || '';
    const requestUrl = error.config?.url || '';
    
    // Only redirect to login on actual authentication failures
    if (status === 401) {
      // Specific token-related error messages that should trigger logout
      const tokenErrors = [
        'Access token required',
        'Invalid token',
        'Token expired',
        'Authentication error',
        'Account deactivated',
        'jwt expired',
        'invalid signature',
        'jwt malformed'
      ];
      
      // Check if this is a genuine authentication error
      const isAuthError = tokenErrors.some(tokenError => 
        errorMessage.toLowerCase().includes(tokenError.toLowerCase())
      );
      
      // TEMPORARILY DISABLED: Don't redirect to login at all
      console.warn(`API endpoint ${requestUrl} returned 401:`, errorMessage);
      console.warn('AXIOS INTERCEPTOR: Not redirecting to login (temporarily disabled)');
      
      // if (isAuthError) {
      //   console.warn('Authentication error, logging out:', errorMessage);
      //   localStorage.removeItem('token');
      //   window.location.href = '/login';
      // } else {
      //   // For API-specific 401 errors (like "Student not found", "Payment not available"), don't logout
      //   console.warn(`API endpoint ${requestUrl} returned 401 but not an auth error:`, errorMessage);
      //   // Let the component handle the error appropriately
      // }
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      // Handle timeout errors differently - don't auto-logout
      console.warn('Request timeout - retrying may help:', error.message);
    } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      // Handle network errors - don't auto-logout
      console.warn('Network error - connection issue:', error.message);
    } else if (status >= 400 && status < 500) {
      // Client errors (400-499) - log but don't redirect
      console.warn(`API error ${status} for ${requestUrl}:`, errorMessage);
    } else if (status >= 500) {
      // Server errors (500+) - log but don't redirect
      console.warn(`Server error ${status} for ${requestUrl}:`, errorMessage);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;