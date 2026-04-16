import { createContext, useContext, useState, useEffect } from "react";

const decodeJwt = (token) => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(decoded)));
  } catch (e) {
    return null;
  }
};

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) return JSON.parse(storedUser);

    const t = localStorage.getItem("token");
    if (!t) return null;

    try {
      const decoded = decodeJwt(t);
      localStorage.setItem("user", JSON.stringify(decoded));
      return decoded;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (token) {
      try {
        const decoded = decodeJwt(token);
        setUser(decoded);
        localStorage.setItem("user", JSON.stringify(decoded)); // ✅ Save user info
      } catch {
        setUser(null);
        localStorage.removeItem("user");
      }
    } else {
      setUser(null);
      localStorage.removeItem("user");
    }
  }, [token]);

  const login = (token) => {
    localStorage.setItem("token", token);
    const decoded = decodeJwt(token);
    setToken(token);
    setUser(decoded);
    localStorage.setItem("user", JSON.stringify(decoded)); // ✅ Store user in localStorage
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
    return Promise.resolve();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
