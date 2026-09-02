import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://jcs-server-1.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore login session
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Invalid stored user:", error);

        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }

    setLoading(false);
  }, []);

  // Login
  const login = async (credentials) => {
    try {
      console.log(
        "Logging in to:",
        `${API_BASE_URL}/auth/login`
      );

      const response = await api.post(
        "/auth/login",
        credentials
      );

      const { token, user: userData } = response.data;

      if (!token) {
        throw new Error(
          "No authentication token received from server."
        );
      }

      if (!userData) {
        throw new Error(
          "No user information received from server."
        );
      }

      localStorage.setItem("token", token);
      localStorage.setItem(
        "user",
        JSON.stringify(userData)
      );

      setUser(userData);

      return response.data;
    } catch (error) {
      console.error(
        "Login failed:",
        error.response?.data || error.message
      );

      // Do NOT create a fake/mock token
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setUser(null);

      throw error;
    }
  };

  // Register
  const register = async (userData) => {
    try {
      console.log(
        "Registering:",
        `${API_BASE_URL}/auth/register`
      );

      const response = await api.post(
        "/auth/register",
        userData
      );

      return response.data;
    } catch (error) {
      console.error(
        "Registration failed:",
        error.response?.data || error.message
      );

      throw error;
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}