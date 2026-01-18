import axios from 'axios';
import { store } from '../store';
import { selectToken, clearCredentials } from '../features/auth/authSlice.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = selectToken(store.getState());
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      store.dispatch(clearCredentials());
      window.location.assign('/login');
    }
    return Promise.reject(err);
  }
);

export default api;
