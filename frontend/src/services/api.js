import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// 🔍 DEBUG: print what base URL is being used
console.log('🔍 API BASE URL:', API_BASE_URL);
console.log('🔍 VITE_API_URL env:', import.meta.env.VITE_API_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    // 🔍 DEBUG: print full request URL
    console.log('➡️  REQUEST:', config.method?.toUpperCase(), config.baseURL + config.url);

    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    // 🔍 DEBUG: print success
    console.log('✅ RESPONSE:', response.status, response.config.url);
    return response.data;
  },
  (error) => {
    // 🔍 DEBUG: print full error details
    console.log('❌ ERROR:', {
      url: error.config?.baseURL + error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      data: error.response?.data,
      isNetworkError: !error.response,
    });

    const message =
      error.response?.data?.message || error.message || 'Something went wrong';
    const status = error.response?.status || 500;

    if (status === 401 && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject({ message, status, original: error });
  }
);

export default api;