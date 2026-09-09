import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://jcs-server-1.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 25000,
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

// Products (All)
export const fetchProducts = async (category = "") => {
  const query =
    category && category.toLowerCase() !== "all"
      ? `?category=${encodeURIComponent(category)}`
      : "";

  const response = await api.get(`/products${query}`);

  return response.data;
};

/* =========================================================
   SINGLE PRODUCT
   GET /api/products/:id
========================================================= */
export const fetchProduct = async (id) => {
  try {
    const response = await api.get(`/products/${id}`);

    const data = response.data;

    // Support different backend response formats
    const product = data?.product || data?.data || data;

    if (!product) {
      throw new Error("Product not found");
    }

    // Parse images if backend returns JSON string
    let parsedImages = product.images;

    if (typeof parsedImages === "string") {
      try {
        parsedImages = JSON.parse(parsedImages);
      } catch {
        parsedImages = [parsedImages];
      }
    }

    if (!Array.isArray(parsedImages)) {
      parsedImages = [];
    }

    return {
      ...product,
      images: parsedImages.filter(Boolean),
    };
  } catch (error) {
    console.error("fetchProduct error:", error);

    if (error.response?.status === 404) {
      throw new Error("Product not found");
    }

    throw error;
  }
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