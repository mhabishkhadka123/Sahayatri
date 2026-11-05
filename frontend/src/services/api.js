import axios from 'axios';

// Default to backend on localhost in development so requests go to port 5000
// NEW (dynamic for local + Netlify production)
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const normalizeApiBase = (base) => {
  if (!base) return '/api';

  const trimmed = base.trim();
  if (!trimmed) return '/api';

  const normalized = trimmed.replace(/\/$/, '');

  if (normalized === '/api') return '/api';
  if (normalized === '') return '/api';

  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
  }

  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
};
const API_URL = normalizeApiBase(API_BASE_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for refresh token and error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { authToken } = response.data;
        localStorage.setItem('authToken', authToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${authToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
