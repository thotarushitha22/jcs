import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://jcs-server-1.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Login
export const loginUser = async (credentials) => {
  const response = await api.post("/auth/login", credentials);

  if (response.data.token) {
    localStorage.setItem("token", response.data.token);
  }

  if (response.data.user) {
    localStorage.setItem("user", JSON.stringify(response.data.user));
  }

  return response.data;
};

// Register
export const registerUser = async (userData) => {
  const response = await api.post("/auth/register", userData);

  if (response.data.token) {
    localStorage.setItem("token", response.data.token);
  }

  if (response.data.user) {
    localStorage.setItem("user", JSON.stringify(response.data.user));
  }

  return response.data;
};

// Products
export const fetchProducts = async (category = "") => {
  const query =
    category && category.toLowerCase() !== "all"
      ? `?category=${encodeURIComponent(category)}`
      : "";

  const response = await api.get(`/products${query}`);

  return response.data;
};

// Create product
export const createProduct = async (productData) => {
  const response = await api.post("/products", productData);
  return response.data;
};

// Admin dashboard
export const fetchAdminDashboard = async () => {
  const response = await api.get("/admin/dashboard");
  return response.data;
};

// Merchant dashboard
export const fetchMerchantDashboard = async () => {
  const response = await api.get("/merchant/dashboard");
  return response.data;
};

export default api;