import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",

  withCredentials: true,
});

// Attach authentication token to every request
api.interceptors.request.use(
  (config) => {
    // Support both token names
    const token =
      localStorage.getItem("jcs_token") ||
      localStorage.getItem("token");

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle unauthorized requests
api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      console.error(
        "Authentication failed:",
        error.response?.data
      );
    }

    return Promise.reject(error);
  }
);

export default api;