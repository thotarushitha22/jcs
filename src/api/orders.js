import axios from "axios";

// Backend root URL
const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
  "https://jcs-server-1.onrender.com";

const getAuthHeaders = () => {
  const token =
    localStorage.getItem("token") ||
    JSON.parse(localStorage.getItem("user") || "{}")?.token;

  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
  };
};

// Fetch merchant orders
export const fetchMerchantOrders = async () => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/orders/`,
      getAuthHeaders()
    );

    return response.data;
  } catch (error) {
    console.warn(
      "API request failed, using local storage fallback.",
      error
    );

    const localOrders = JSON.parse(
      localStorage.getItem("orders") || "[]"
    );

    return localOrders;
  }
};

// Alias
export const fetchMyOrders = fetchMerchantOrders;