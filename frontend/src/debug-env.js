// Debug Environment Variable
// This file helps verify VITE_API_URL is correctly set

const API_URL = import.meta.env.VITE_API_URL;

console.log('🔍 Environment Check:');
console.log('VITE_API_URL:', API_URL);
console.log('Type:', typeof API_URL);
console.log('Is undefined?', API_URL === undefined);
console.log('Fallback would be used:', API_URL || 'http://localhost:8000/api');

if (!API_URL) {
  console.warn('⚠️ WARNING: VITE_API_URL is not defined!');
  console.warn('The app will fallback to http://localhost:8000/api');
  console.warn('For production, set VITE_API_URL in Render Dashboard');
} else {
  console.log('✅ VITE_API_URL is set to:', API_URL);
}

export { API_URL };
