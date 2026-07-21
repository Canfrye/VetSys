import { useCallback, useEffect, useState } from "react";

import AuthContext from "./AuthContext";

import {
  login as loginRequest,
  logout as logoutRequest,
  restoreSession,
} from "../services/authService";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession()
      .then(setUser)
      .finally(() => setLoading(false));

    function handleBackupRestored() {
      restoreSession().then(setUser);
    }

    function handleUnauthorized() {
      setUser(null);
      if (!window.location.pathname.includes("/login")) {
        window.location.assign("/login");
      }
    }

    window.addEventListener("vetsys-backup-restored", handleBackupRestored);
    window.addEventListener("vetsys-unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener(
        "vetsys-backup-restored",
        handleBackupRestored
      );
      window.removeEventListener("vetsys-unauthorized", handleUnauthorized);
    };
  }, []);

  const login = useCallback(async (username, password) => {
    const { user: loggedInUser } = await loginRequest(username, password);

    setUser(loggedInUser);

    return loggedInUser;
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();

    setUser(null);
  }, []);

  const hasRole = useCallback(
    (allowedRoles) => {
      if (!allowedRoles || allowedRoles.length === 0) return true;

      return !!user && allowedRoles.includes(user.role);
    },
    [user]
  );

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
