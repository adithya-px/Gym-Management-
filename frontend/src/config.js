// API base URL - uses relative path in production (same-origin), 
// falls back to localhost for local development
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default API_BASE;
