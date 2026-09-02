import axios from "axios";

// Directly defaults to your Render backend URL instead of localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://your-backend-name.onrender.com";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach authorization token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});