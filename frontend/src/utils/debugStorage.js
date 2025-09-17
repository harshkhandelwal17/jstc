// Debug wrapper for localStorage to track token removal
const originalRemoveItem = localStorage.removeItem;

localStorage.removeItem = function(key) {
  if (key === 'token') {
    console.log('🚨 TOKEN REMOVAL DETECTED!');
    console.trace('Token removal call stack:');
    console.log('Current token value:', localStorage.getItem('token'));
  }
  return originalRemoveItem.call(this, key);
};

const originalSetItem = localStorage.setItem;

localStorage.setItem = function(key, value) {
  if (key === 'token') {
    console.log('✅ TOKEN SET:', value ? 'Token stored' : 'Empty token');
  }
  return originalSetItem.call(this, key, value);
};

console.log('🔍 localStorage debug wrapper installed');

