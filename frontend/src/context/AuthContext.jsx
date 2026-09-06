import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("access_token")
  );

  const [role, setRole] = useState(
    localStorage.getItem("user_role") || ""
  );

  const [username, setUsername] = useState(
    localStorage.getItem("username") || ""
  );

  const login = (access, refresh, userRole, userName) => {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    localStorage.setItem("user_role", userRole);
    localStorage.setItem("username", userName);

    setIsAuthenticated(true);
    setRole(userRole);
    setUsername(userName);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("username");

    setIsAuthenticated(false);
    setRole("");
    setUsername("");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        role,
        username,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}