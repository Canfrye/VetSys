import { useContext } from "react";

import AuthContext from "../context/AuthContext";

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth, AuthProvider icinde kullanilmalidir."
    );
  }

  return context;
}

export default useAuth;
