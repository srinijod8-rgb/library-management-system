import axios from 'axios';

// Calculate API base URL dynamically from environment or relative proxy
const rawBaseURL = import.meta.env.VITE_API_URL || '/api';
const trimmedBaseURL = rawBaseURL.trim().replace(/\/+$/, '');
export const API_BASE_URL =
  !trimmedBaseURL.endsWith('/api') && trimmedBaseURL.startsWith('http')
    ? `${trimmedBaseURL}/api`
    : trimmedBaseURL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('library_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if session expired (avoid infinite loops on auth endpoints)
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('library_token');
        localStorage.removeItem('library_user');
        window.location.href = '/login?expired=1';
      }
    }
    return Promise.reject(error);
  }
);

// Helper for exporting CSV reports with token and resolved API base URL
export const exportReportCsv = (type) => {
  const token = localStorage.getItem('library_token');
  const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
  const url = `${API_BASE_URL}/reports/export?type=${encodeURIComponent(type)}${tokenParam}`;
  window.open(url, '_blank');
};

export default api;
