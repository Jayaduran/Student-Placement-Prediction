import axios from 'axios';

const isLocalBrowser = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
const configuredApiUrl = import.meta.env.VITE_API_URL || (isLocalBrowser ? 'http://localhost:5000' : 'https://placement-prediction-1irb.onrender.com');
const trimmedApiUrl = configuredApiUrl.replace(/\/$/, '');
const apiBaseUrl = trimmedApiUrl.endsWith('/api') ? trimmedApiUrl : `${trimmedApiUrl}/api`;

export const BACKEND_ORIGIN = apiBaseUrl.replace(/\/api$/, '');

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
