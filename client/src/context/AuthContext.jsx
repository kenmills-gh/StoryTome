import { createContext, useContext, useState, useEffect } from "react";
import { apiFetch } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check active session on initial app load
  useEffect(() => {
    apiFetch("/me")
      .then((userData) => setUser(userData))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const userData = await apiFetch("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setUser(userData);
    return userData;
  };

  const signup = async (username, email, password) => {
    const userData = await apiFetch("/signup", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    await apiFetch("/logout", { method: "DELETE" });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);