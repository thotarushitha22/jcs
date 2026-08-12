import axios from "axios";

// Point this at the Express API once it's running (Step: backend build guide).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("jcs_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;