// Windows 8 Detection and Compatibility Utilities
export const isWindows8 = () => {
  // Check for Windows 8 specific user agent strings
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Windows 8 detection patterns
  const windows8Patterns = [
    /windows nt 6\.2/i,  // Windows 8
    /windows nt 6\.3/i,  // Windows 8.1
    /windows 8/i,
    /windows 8\.1/i
  ];
  
  // Check if any pattern matches
  const isWindows8UserAgent = windows8Patterns.some(pattern => pattern.test(userAgent));
  
  // Additional checks for Windows 8 specific features
  const isWindows8Features = 
    // Check for Windows 8 specific APIs that might not be available
    !window.CSS || 
    !window.CSS.supports || 
    !window.CSS.supports('background-image', 'linear-gradient(45deg, #000, #fff)') ||
    // Check for older browser versions commonly used on Windows 8
    (userAgent.includes('msie') && parseFloat(userAgent.match(/msie (\d+)/i)?.[1] || '0') < 11) ||
    (userAgent.includes('trident') && !userAgent.includes('edge'));
  
  return isWindows8UserAgent || isWindows8Features;
};

export const isOldBrowser = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Check for older browser versions
  const isOldIE = userAgent.includes('msie') && parseFloat(userAgent.match(/msie (\d+)/i)?.[1] || '0') < 11;
  const isOldChrome = userAgent.includes('chrome') && parseFloat(userAgent.match(/chrome\/(\d+)/i)?.[1] || '0') < 50;
  const isOldFirefox = userAgent.includes('firefox') && parseFloat(userAgent.match(/firefox\/(\d+)/i)?.[1] || '0') < 50;
  
  return isOldIE || isOldChrome || isOldFirefox;
};

export const applyWindows8Compatibility = () => {
  if (isWindows8() || isOldBrowser()) {
    // Add Windows 8 compatibility class to body
    document.body.classList.add('windows8-compatibility');
    
    // Force all buttons to use Windows 8 compatible styles
    const buttons = document.querySelectorAll('button, .btn, [role="button"], input[type="button"], input[type="submit"], input[type="reset"]');
    buttons.forEach(button => {
      button.classList.add('windows8-button-fix');
    });
    
    // Override gradient backgrounds with solid colors
    const gradientElements = document.querySelectorAll('[class*="gradient"], [class*="from-"], [class*="to-"]');
    gradientElements.forEach(element => {
      element.style.background = '#2563eb';
      element.style.backgroundImage = 'none';
    });
    
    // Add high contrast mode if needed
    if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
      document.body.classList.add('high-contrast-mode');
    }
    
    console.log('Windows 8 compatibility mode activated');
    return true;
  }
  return false;
};

export const addWindows8Styles = () => {
  // Add Windows 8 specific styles dynamically
  const style = document.createElement('style');
  style.textContent = `
    /* Windows 8 Dynamic Styles */
    .windows8-compatibility button,
    .windows8-compatibility .btn,
    .windows8-compatibility [role="button"],
    .windows8-compatibility input[type="button"],
    .windows8-compatibility input[type="submit"],
    .windows8-compatibility input[type="reset"] {
      background: #2563eb !important;
      color: #ffffff !important;
      border: 2px solid #1d4ed8 !important;
      font-weight: bold !important;
      text-shadow: 1px 1px 1px rgba(0,0,0,0.3) !important;
      min-height: 44px !important;
      min-width: 120px !important;
      padding: 12px 24px !important;
      font-size: 14px !important;
      text-transform: uppercase !important;
      letter-spacing: 0.5px !important;
      box-shadow: 2px 2px 4px rgba(0,0,0,0.3) !important;
    }
    
    .windows8-compatibility button:hover,
    .windows8-compatibility .btn:hover,
    .windows8-compatibility [role="button"]:hover,
    .windows8-compatibility input[type="button"]:hover,
    .windows8-compatibility input[type="submit"]:hover,
    .windows8-compatibility input[type="reset"]:hover {
      background: #1d4ed8 !important;
      border-color: #1e40af !important;
      box-shadow: 3px 3px 6px rgba(0,0,0,0.4) !important;
    }
    
    .high-contrast-mode button,
    .high-contrast-mode .btn,
    .high-contrast-mode [role="button"],
    .high-contrast-mode input[type="button"],
    .high-contrast-mode input[type="submit"],
    .high-contrast-mode input[type="reset"] {
      background: #000000 !important;
      color: #ffffff !important;
      border: 3px solid #ffffff !important;
      font-weight: bold !important;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.8) !important;
      box-shadow: 4px 4px 8px rgba(0,0,0,0.5) !important;
    }
  `;
  document.head.appendChild(style);
};

// Auto-apply compatibility on page load
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    applyWindows8Compatibility();
    addWindows8Styles();
  });
}
