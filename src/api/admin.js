import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

export const fetchAllUsers = async (token) => {
  const response = await axios.get(`${API_BASE_URL}/admin/users`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const fetchAllMerchants = async (token) => {
  const response = await axios.get(`${API_BASE_URL}/admin/merchants`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deleteUser = async (id, token) => {
  const response = await axios.delete(`${API_BASE_URL}/admin/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deleteMerchant = async (id, token) => {
  const response = await axios.delete(`${API_BASE_URL}/admin/merchants/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Add this function to fix the missing export error:
export const fetchAdminOrders = async (token) => {
  const response = await axios.get(`${API_BASE_URL}/admin/orders`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};