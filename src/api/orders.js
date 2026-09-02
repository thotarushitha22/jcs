import axios from "axios";

// Dynamically use environment variable, fallback to Render backend
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://jcs-server-1.onrender.com";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token") || JSON.parse(localStorage.getItem("user") || "{}")?.token;
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
  };
};

export const fetchMerchantOrders = async () => {
  try {
    // Updated to use the valid backend route /api/orders/ found in orderRoutes.js
    const response = await axios.get(`${API_BASE_URL}/api/orders/`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.warn("API request failed, using local storage fallback.", error);
    const localOrders = JSON.parse(localStorage.getItem("orders") || "[]");
    return localOrders;
  }
};

export const fetchMyOrders = fetchMerchantOrders;