// frontend/src/services/api.js
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: true,           // Send httpOnly cookies
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Attach access token to every request ─
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Auto-refresh on 401 ──────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isTokenExpired =
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry;

    if (!isTokenExpired) return Promise.reject(error);

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(
        `${API_BASE}/api/auth/refresh`,
        {},
        { withCredentials: true }
      );
      const newToken = data.accessToken;
      localStorage.setItem('accessToken', newToken);
      processQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ─── Auth endpoints ───────────────────────
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login:  (data) => api.post('/auth/login', data),
  logout: ()     => api.post('/auth/logout'),
};

// ─── Content generation ───────────────────
export const contentAPI = {
  generate: (contentType, listing) =>
    api.post('/generate-content', { contentType, listing }),
  getHistory: (page = 1, limit = 20) =>
    api.get('/content/history', { params: { page, limit } }),
  getById: (id) => api.get(`/content/${id}`),
};

// ─── User endpoints ───────────────────────
export const userAPI = {
  getProfile:      () => api.get('/user/profile'),
  getSubscription: () => api.get('/user/subscription'),
  getUsage:        () => api.get('/user/usage'),
};

// ─── Payment endpoints ────────────────────
export const paymentAPI = {
  createOrder:  (plan) => api.post('/payments/create-order', { plan }),
  verifyPayment: (data) => api.post('/payments/verify', data),
  getHistory:   () => api.get('/payments/history'),
};

export default api;
