import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

function AppSnackbar({
  open,
  message,
  severity = "success",
  onClose,
}) {
  const duration = severity === "error" ? 4500 : 3000;

  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
    >
      <Alert
        severity={severity}
        variant="filled"
        elevation={6}
        onClose={onClose}
        sx={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 2,
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}

export default AppSnackbar;
