import { createContext, useContext, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("jcs_user");
    return saved ? JSON.parse(saved) : null;
  });

  const persist = (u, token) => {
    localStorage.setItem("jcs_user", JSON.stringify(u));
    if (token) localStorage.setItem("jcs_token", token);
    setUser(u);
  };

  const login = async ({ email, password }) => {
    const { data } = await api.post("/auth/login", { email, password });
    persist(data.user, data.token);
    return data.user;
  };

  const register = async ({ name, email, password, role, gstNumber }) => {
    const { data } = await api.post("/auth/register", { name, email, password, role, gstNumber });
    persist(data.user, data.token);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("jcs_user");
    localStorage.removeItem("jcs_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);