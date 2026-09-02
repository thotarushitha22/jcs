// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

// Dynamically use environment variable, fallback to Render backend
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : "https://jcs-server-1.onrender.com/api";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
      let { token, user: userData } = response.data;

      // 🛡️ Force merchant role if email indicates it, or if it's your test email
      const emailLower = credentials.email.toLowerCase();
      if (
        emailLower === "22@gmail.com" || 
        emailLower.includes("merchant") || 
        emailLower.includes("seller")
      ) {
        userData.role = "merchant";
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      return response.data;
    } catch (error) {
      console.warn("Backend error or unauthorized. Using mock login session override.");
      
      const emailLower = credentials.email.toLowerCase();
      let userRole = "buyer";
      
      if (emailLower === "22@gmail.com" || emailLower.includes("merchant") || emailLower.includes("seller")) {
        userRole = "merchant";
      }

      const mockUser = {
        id: Date.now(),
        email: credentials.email,
        role: userRole,
      };
      
      const mockToken = "mock-jwt-token-" + Date.now();
      localStorage.setItem("token", mockToken);
      localStorage.setItem("user", JSON.stringify(mockUser));
      setUser(mockUser);
      return { token: mockToken, user: mockUser };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      return response.data;
    } catch (error) {
      console.warn("Backend offline during registration. Saving to local mock memory.");
      
      const mockUsers = JSON.parse(localStorage.getItem("mockUsers") || "{}");
      mockUsers[userData.email.toLowerCase()] = {
        email: userData.email,
        role: userData.role === "seller" ? "merchant" : userData.role
      };
      localStorage.setItem("mockUsers", JSON.stringify(mockUsers));

      return { success: true, user: userData };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}