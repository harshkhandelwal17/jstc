// Utility functions for consistent error handling across the application

/**
 * Check if an error is a genuine authentication error that should trigger logout
 * @param {Object} error - The error object
 * @returns {boolean} - True if it's an auth error requiring logout
 */
export const isAuthenticationError = (error) => {
  const status = error.response?.status || error.status;
  const message = error.response?.data?.message || error.message || '';
  
  if (status !== 401) {
    return false;
  }
  
  // Specific token-related error messages that should trigger logout
  const tokenErrors = [
    'Access token required',
    'Invalid token',
    'Token expired',
    'Authentication error',
    'Account deactivated',
    'jwt expired',
    'invalid signature',
    'jwt malformed',
    'unauthorized'
  ];
  
  return tokenErrors.some(tokenError => 
    message.toLowerCase().includes(tokenError.toLowerCase())
  );
};

/**
 * Handle API errors consistently
 * @param {Object} error - The error object
 * @param {string} context - Context of where the error occurred (for logging)
 * @param {boolean} showToast - Whether to show a toast notification
 */
export const handleApiError = (error, context = '', showToast = true) => {
  const status = error.response?.status || error.status;
  const message = error.response?.data?.message || error.message || 'An error occurred';
  
  console.error(`API Error in ${context}:`, {
    status,
    message,
    url: error.config?.url || error.url,
    error
  });
  
  // Handle authentication errors - TEMPORARILY DISABLED
  if (isAuthenticationError(error)) {
    console.warn('ERROR HANDLER: Auth error detected but not redirecting (temporarily disabled)');
    // localStorage.removeItem('token');
    // window.location.href = '/login';
    // return;
  }
  
  // For non-auth errors, let the component handle them
  if (showToast && window.toast) {
    if (status >= 500) {
      window.toast.error('Server error. Please try again later.');
    } else if (status >= 400) {
      window.toast.error(message || 'Request failed. Please check your input.');
    } else {
      window.toast.error('Network error. Please check your connection.');
    }
  }
  
  return {
    status,
    message,
    isAuthError: false,
    isServerError: status >= 500,
    isClientError: status >= 400 && status < 500
  };
};

/**
 * Handle fetch API errors consistently
 * @param {Response} response - The fetch response object
 * @param {string} context - Context of where the error occurred
 */
export const handleFetchError = async (response, context = '') => {
  let errorData = {};
  try {
    errorData = await response.json();
  } catch (e) {
    // Response doesn't have JSON body
  }
  
  const error = {
    response: {
      status: response.status,
      data: errorData
    },
    message: errorData.message || `HTTP ${response.status}`,
    config: { url: response.url }
  };
  
  return handleApiError(error, context);
};

/**
 * Wrapper for API calls with consistent error handling
 * @param {Function} apiCall - The API call function
 * @param {string} context - Context for error logging
 * @param {Object} options - Options for error handling
 */
export const withErrorHandling = async (apiCall, context = '', options = {}) => {
  const { showToast = true, fallbackValue = null } = options;
  
  try {
    return await apiCall();
  } catch (error) {
    const errorInfo = handleApiError(error, context, showToast);
    
    if (errorInfo.isAuthError) {
      throw error; // Re-throw auth errors
    }
    
    return fallbackValue;
  }
};
