import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://jcs-server-1.onrender.com/api";

export const fetchAllUsers = async (token) => {
  try {
    const authToken = token || localStorage.getItem("token");
    const response = await axios.get(`${API_BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 25000
    });
    return response.data;
  } catch (error) {
    console.warn("Backend offline. Fetching users from localStorage (`jcs_users`).");
    const allUsers = JSON.parse(localStorage.getItem("jcs_users") || "[]");
    return allUsers.filter(u => u.role !== "merchant" && u.role !== "seller");
  }
};

export const fetchAllMerchants = async (token) => {
  try {
    const authToken = token || localStorage.getItem("token");
    const response = await axios.get(`${API_BASE_URL}/admin/merchants`, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 25000
    });
    return response.data;
  } catch (error) {
    console.warn("Backend offline. Fetching merchants from localStorage (`jcs_users`).");
    const allUsers = JSON.parse(localStorage.getItem("jcs_users") || "[]");
    return allUsers.filter(u => u.role === "merchant" || u.role === "seller");
  }
};

export const deleteUser = async (id, token) => {
  try {
    const authToken = token || localStorage.getItem("token");
    const response = await axios.delete(`${API_BASE_URL}/admin/users/${id}`, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 25000
    });
    return response.data;
  } catch (error) {
    console.warn("Backend offline. Deleting user locally.");
    let allUsers = JSON.parse(localStorage.getItem("jcs_users") || "[]");
    allUsers = allUsers.filter(u => u.email !== id && String(u.id) !== String(id));
    localStorage.setItem("jcs_users", JSON.stringify(allUsers));
    return { success: true };
  }
};

export const deleteMerchant = async (id, token) => {
  try {
    const authToken = token || localStorage.getItem("token");
    const response = await axios.delete(`${API_BASE_URL}/admin/merchants/${id}`, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 25000
    });
    return response.data;
  } catch (error) {
    console.warn("Backend offline. Deleting merchant locally.");
    let allUsers = JSON.parse(localStorage.getItem("jcs_users") || "[]");
    allUsers = allUsers.filter(u => u.email !== id && String(u.id) !== String(id));
    localStorage.setItem("jcs_users", JSON.stringify(allUsers));
    return { success: true };
  }
};

export const fetchAdminOrders = async (token) => {
  try {
    const authToken = token || localStorage.getItem("token");
    
    let userEmail = 'thotarushitha22@gmail.com';
    try {
      const userObj = JSON.parse(localStorage.getItem("user") || "{}");
      if (userObj.email) userEmail = userObj.email;
    } catch (e) {}

    const response = await axios.get(`${API_BASE_URL}/admin/orders`, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'user-email': userEmail 
      },
      timeout: 25000
    });
    return response.data;
  } catch (error) {
    console.warn("Backend offline or order access restricted. Fetching orders from localStorage (`orders`).");
    return JSON.parse(localStorage.getItem("orders") || "[]");
  }
};