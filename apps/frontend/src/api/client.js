import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

const AUTH_401_EXEMPT_PATHS = ['/auth/login', '/auth/change-password'];

function isAuth401ExemptRequest(config = {}) {
  const requestUrl = config.url || '';
  return AUTH_401_EXEMPT_PATHS.some((path) => requestUrl.endsWith(path));
}

// Request interceptor: automatically attach JWT token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 by clearing auth and redirecting to login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isAuth401ExemptRequest(error.config)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
