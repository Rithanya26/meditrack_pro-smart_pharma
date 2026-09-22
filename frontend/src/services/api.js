import axios from "axios";

// Centralized Axios instance — replace mock services with real API calls later
// Uses VITE_API_BASE_URL from .env (Flask REST API)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Request interceptor — attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("meditrack_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("meditrack_token");
      localStorage.removeItem("meditrack_user");
    }
    return Promise.reject(error);
  }
);

export default api;
