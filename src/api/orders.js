import api from "./axios";

export const createOrder = async (payload) => {
  const { data } = await api.post("/orders", payload);
  return data;
};

export const fetchMyOrders = async () => {
  const { data } = await api.get("/orders");
  return data;
};

export const fetchOrder = async (id) => {
  const { data } = await api.get(`/orders/${id}`);
  return data;
};

export const fetchAllOrders = async () => {
  const { data } = await api.get("/orders/all");
  return data;
};

export const updateOrderStatus = async (id, status) => {
  const { data } = await api.put(`/orders/${id}/status`, { status });
  return data;
};