import { useState, useEffect } from "react";
import { apiFetch, UNAUTHORIZED_EVENT } from "../services/api";
import { AuthContext } from "./authContext";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const clearUser = () => setUser(null);
    window.addEventListener(UNAUTHORIZED_EVENT, clearUser);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, clearUser);
  }, []);

  // Check active session on initial app load
  useEffect(() => {
    apiFetch("/auth/me")
      .then((userData) => setUser(userData))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const userData = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setUser(userData);
    return userData;
  };

  const signup = async (username, email, password) => {
    const userData = await apiFetch("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    await apiFetch("/auth/logout", { method: "DELETE" });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
