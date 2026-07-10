import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

function AppSnackbar({
    open,
    message,
    severity = "success",
    onClose,
}) {
    return (
        <Snackbar
            open={open}
            autoHideDuration={3000}
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
                    borderRadius: 2,
                }}
            >
                {message}
            </Alert>
        </Snackbar>
    );
}

export default AppSnackbar;