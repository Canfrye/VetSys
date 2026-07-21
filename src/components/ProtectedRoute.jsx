import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    // Erişim Reddedildi sayfasından çıkış yapılırsa, girişten sonra
    // kullanıcıyı tekrar o sayfaya değil ana sayfaya yönlendir.
    const redirectState =
      location.pathname === "/access-denied" ? undefined : { from: location };

    return (
      <Navigate
        to="/login"
        replace
        state={redirectState}
      />
    );
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
}

export default ProtectedRoute;
