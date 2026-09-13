// services/api.js — Central Axios instance
// Seamlessly connects to local backend (http://localhost:5000) or cloud deployment.

import axios from 'axios';

// Resolve API base URL:
// 1. If explicitly configured via VITE_API_URL, use it (custom cloud API or custom port)
// 2. In browser on localhost / 127.0.0.1: use 'http://localhost:5000/api' or proxied '/api'
// 3. On cloud hosting (Vercel / domain): default to '/api'
let baseURL = import.meta.env.VITE_API_URL;

if (!baseURL) {
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    baseURL = isLocalhost ? 'http://localhost:5000/api' : '/api';
  } else {
    baseURL = '/api';
  }
}

const api = axios.create({
  baseURL,
  timeout: 30000,
});

// Attach JWT to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('crddms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If token expired → redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('crddms_token');
      localStorage.removeItem('crddms_user');
      const baseUrl = import.meta.env.BASE_URL || '/';
      const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      window.location.href = `${cleanBase}/login`;
    }
    return Promise.reject(err);
  }
);

export default api;
