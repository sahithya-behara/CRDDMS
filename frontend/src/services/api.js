// services/api.js — Central Axios instance
// All API calls go through this file. To change the base URL, update .env only.

import axios from 'axios';

let baseURL = import.meta.env.VITE_API_URL || '/api';

if (typeof window !== 'undefined') {
  const isLocalhostUrl = baseURL.includes('localhost') || baseURL.includes('127.0.0.1');
  const isCloudHost = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  if (isLocalhostUrl || isCloudHost) {
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
