import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCookie, getAllCookies } from '../utils/cookies';

const AuthContext = createContext();

// Auth Provider Component
function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://jstcapi.onrender.com/api';

  useEffect(() => {
    // Check for token in both localStorage and cookies
    console.log('AUTH: Checking authentication status...');
    
    // Check localStorage first
    const localToken = localStorage.getItem('token');
    console.log('AUTH: localStorage token:', localToken ? 'Present' : 'Not found');
    
    // Check cookies
    const cookieToken = getCookie('token');
    console.log('AUTH: Cookie token:', cookieToken ? 'Present' : 'Not found');
    
    // Show all cookies for debugging
    getAllCookies();
    
    // Use token from either source
    const token = localToken || cookieToken;
    
    if (token && token.length > 10) {
      // Token exists - assume user is authenticated
      console.log('AUTH: Token found, setting authenticated to true');
      setIsAuthenticated(true);
      
      // If we only have cookie token, also store in localStorage
      if (!localToken && cookieToken) {
        console.log('AUTH: Syncing cookie token to localStorage');
        localStorage.setItem('token', cookieToken);
      }
    } else {
      console.log('AUTH: No token found, user not authenticated');
      setIsAuthenticated(false);
    }
    setLoading(false);
  }, []);

  const checkAuthStatus = async (force = false) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return;
      }

      // If not forcing verification and user is already authenticated, skip server check
      if (!force && isAuthenticated) {
        return;
      }

      // Check if token is a valid JWT format before making API call
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          throw new Error('Invalid token format');
        }
        
        // Decode the payload to check expiration
        const payload = JSON.parse(atob(tokenParts[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (payload.exp && payload.exp < currentTime) {
          console.warn('Token expired locally');
          // Only remove token if it's significantly expired (more than 1 hour)
          const expiredFor = currentTime - payload.exp;
          if (expiredFor > 3600) { // More than 1 hour expired
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            setUser(null);
            setLoading(false);
            return;
          } else {
            // Token recently expired, but keep user logged in
            console.warn('Token recently expired, keeping user logged in for now');
            setIsAuthenticated(true);
            setLoading(false);
            return;
          }
        }
      } catch (tokenError) {
        console.warn('Invalid token format, but keeping user logged in:', tokenError.message);
        // Don't remove token on format errors - let server decide
        setIsAuthenticated(true);
        setLoading(false);
        return;
      }

      // Only verify with server if explicitly forced
      if (!force) {
        // Just assume user is authenticated if token exists and is valid
        setIsAuthenticated(true);
        setLoading(false);
        return;
      }

      // Verify token with backend with increased timeout (only when forced)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.admin) {
          setUser(data.admin);
          setIsAuthenticated(true);
        } else {
          throw new Error('Invalid response format');
        }
      } else if (response.status === 401) {
        // Check the actual error message before logging out
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || '';
        
        console.warn('Token verification returned 401:', errorMessage);
        
        // Only logout for specific authentication-related messages
        const authErrors = [
          'Access token required',
          'Invalid token',
          'Token expired',
          'Authentication error',
          'jwt expired',
          'jwt malformed',
          'invalid signature'
        ];
        
        const isRealAuthError = authErrors.some(authError => 
          errorMessage.toLowerCase().includes(authError.toLowerCase())
        );
        
        if (isRealAuthError) {
          console.warn('Genuine auth error, logging out:', errorMessage);
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setUser(null);
        } else {
          console.warn('Non-auth 401 error, keeping user logged in:', errorMessage);
          // Assume user is still authenticated if we have a token
          if (token) {
            setIsAuthenticated(true);
          }
        }
      } else {
        // For other errors (500, network issues), don't logout
        console.warn('Auth verification error (non-401):', response.status);
        // If we already had a valid token, assume user is still authenticated
        if (token) {
          setIsAuthenticated(true);
          // Keep existing user data if available
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Auth check timeout - keeping user logged in');
        // Don't logout on timeout - assume user is still authenticated if token exists
        const token = localStorage.getItem('token');
        if (token) {
          setIsAuthenticated(true);
        }
      } else {
        console.error('Auth check error:', error);
        
        // Be very conservative about logging out - only for explicit auth failures
        const errorMessage = error.message || '';
        const explicitAuthErrors = [
          'jwt expired',
          'jwt malformed', 
          'invalid signature',
          'Token expired',
          'Invalid token'
        ];
        
        const shouldLogout = explicitAuthErrors.some(authError => 
          errorMessage.toLowerCase().includes(authError.toLowerCase())
        );
        
        if (shouldLogout) {
          console.warn('Explicit auth error in catch block:', errorMessage);
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setUser(null);
        } else {
          // For all other errors (network, server, etc.), keep user logged in
          console.warn('Non-auth error, keeping user logged in:', errorMessage);
          const token = localStorage.getItem('token');
          if (token) {
            setIsAuthenticated(true);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('LOGIN: Starting login process...');
      console.log('LOGIN: API URL:', `${API_BASE_URL}/auth/login`);
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Important: Include cookies in request/response
        body: JSON.stringify({ email, password })
      });
      
      console.log('LOGIN: Response status:', response.status);
      console.log('LOGIN: Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('LOGIN: Server response:', data);

      if (!response.ok) {
        console.log('LOGIN: Login failed with response:', response.status);
        throw new Error(data.message || 'Login failed');
      }

      // Store token
      console.log('LOGIN: Storing token in localStorage');
      localStorage.setItem('token', data.token);
      
      // Check if cookie was set by server
      setTimeout(() => {
        const cookieToken = getCookie('token');
        console.log('LOGIN: Cookie check after login:', cookieToken ? 'Cookie set!' : 'Cookie NOT set');
        getAllCookies();
      }, 100);
      
      // Set user data
      console.log('LOGIN: Setting user data and authentication state');
      setUser(data.admin);
      setIsAuthenticated(true);

      console.log('LOGIN: Login successful!');
      return data;
    } catch (error) {
      console.error('LOGIN: Login error:', error);
      throw error;
    }
  };

  const register = async (formData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Important: Include cookies in request/response
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Store token
      localStorage.setItem('token', data.token);
      
      // Set user data
      setUser(data.admin);
      setIsAuthenticated(true);

      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    console.log('LOGOUT: Manual logout called');
    console.trace('LOGOUT: Call stack trace');
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  const value = {
    isAuthenticated,
    loading,
    user,
    login,
    register,
    logout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Add display name for better debugging and Fast Refresh compatibility
AuthProvider.displayName = 'AuthProvider';

// Custom hook for using auth context
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export both as named exports (Fast Refresh compatible)
export { useAuth, AuthProvider };