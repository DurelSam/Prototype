import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("authToken");

    if (token) {
      try {
        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error("Erreur auth check:", error);
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        setUser(null);
      }
    }
    // C'est ici qu'on libère l'application
    setLoading(false);
  }, [API_URL]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem("authToken", token);
        localStorage.setItem("userData", JSON.stringify(user));
        setUser(user);
        return { success: true, user };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Erreur connexion";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await axios.post(`${API_URL}/auth/register`, userData);

      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem("authToken", token);
        localStorage.setItem("userData", JSON.stringify(user));
        setUser(user);
        return { success: true, user };
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Erreur inscription";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (token) {
        await axios.post(
          `${API_URL}/auth/logout`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }
    } catch (error) {
      console.error("Erreur déconnexion:", error);
    } finally {
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "Admin",
    isManager: user?.role === "Manager" || user?.role === "Admin",
    isEmployee: user?.role === "Employee",
  };

  // --- CORRECTION MAJEURE ICI ---
  // On n'affiche RIEN (ou un spinner) tant qu'on ne sait pas si l'user est connecté.
  // Cela empêche la redirection intempestive vers /login au rechargement de page.

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#f8f9fa",
        }}
      >
        <div style={{ fontSize: "1.2rem", color: "#666" }}>
          Chargement de la session...
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
