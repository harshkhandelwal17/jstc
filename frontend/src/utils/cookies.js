// Utility functions for cookie management

/**
 * Get a cookie value by name
 * @param {string} name - Cookie name
 * @returns {string|null} - Cookie value or null if not found
 */
export const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop().split(';').shift();
    console.log(`COOKIE: Found ${name} =`, cookieValue ? 'Present' : 'Empty');
    return cookieValue;
  }
  console.log(`COOKIE: ${name} not found`);
  return null;
};

/**
 * Set a cookie
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} days - Expiry in days
 */
export const setCookie = (name, value, days = 1) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  console.log(`COOKIE: Set ${name}`);
};

/**
 * Delete a cookie
 * @param {string} name - Cookie name
 */
export const deleteCookie = (name) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  console.log(`COOKIE: Deleted ${name}`);
};

/**
 * Get all cookies as an object
 * @returns {object} - Object with all cookies
 */
export const getAllCookies = () => {
  const cookies = {};
  document.cookie.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = value;
    }
  });
  console.log('COOKIE: All cookies:', cookies);
  return cookies;
};

// Debug: Log all cookies on load
console.log('COOKIE UTILS: Loaded. Current cookies:', getAllCookies());

