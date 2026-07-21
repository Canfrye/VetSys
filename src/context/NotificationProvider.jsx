import { useCallback, useState } from "react";

import AppSnackbar from "../components/AppSnackbar";
import NotificationContext from "./NotificationContext";

export function NotificationProvider({ children }) {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const notify = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleClose = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}

      <AppSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleClose}
      />
    </NotificationContext.Provider>
  );
}

export default NotificationProvider;
