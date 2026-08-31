import axios from "axios";

// Change this URL to match your running backend server port (e.g., 5000, 3000, etc.)
const API_URL = "http://localhost:5000/api/orders";

export const fetchMyOrders = async (token) => {
  const response = await axios.get(`${API_URL}/mine`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const fetchUserOrders = async (token) => {
  const response = await axios.get(`${API_URL}/mine`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const fetchOrder = async (id, token) => {
  const response = await axios.get(`${API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const createOrder = async (orderData, token) => {
  const response = await axios.post(API_URL, orderData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};