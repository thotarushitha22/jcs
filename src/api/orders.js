import api from "./axios";

// Place a new order (customer checkout)
export const createOrder = async (payload) => {
  const { data } = await api.post("/orders", payload);
  return data;
};

// Logged-in customer's own orders
export const fetchMyOrders = async () => {
  const { data } = await api.get("/orders");
  return data;
};

// One of the customer's own orders
export const fetchOrder = async (id) => {
  const { data } = await api.get(`/orders/${id}`);
  return data;
};

// Admin and merchant: every order in the store
export const fetchAllOrders = async () => {
  const { data } = await api.get("/orders/all");
  return data;
};

// Used by MerchantDashboard
export const fetchMerchantOrders = async () => {
  try {
    const { data } = await api.get("/orders/all");
    return data;
  } catch (error) {
    console.warn("API request failed, using local storage fallback.", error);
    return JSON.parse(localStorage.getItem("orders") || "[]");
  }
};

// Update an order's status (admin: any stop, merchant: up to SHIPPED)
export const updateOrderStatus = async (id, status) => {
  const { data } = await api.put(`/orders/${id}/status`, { status });
  return data;
};