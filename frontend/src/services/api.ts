import axios from 'axios';

// The backend port is 8000 in local docker/development setup
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('predictwise_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle auth failures
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('predictwise_token');
      localStorage.removeItem('predictwise_user');
      // If we are in the browser, trigger a reload or redirect
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth_logout'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
