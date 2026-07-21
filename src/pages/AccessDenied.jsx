import { useNavigate } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";

function AccessDenied() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        textAlign: "center",
        py: 10,
        px: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <BlockOutlinedIcon sx={{ fontSize: 64, color: "error.main" }} />

      <Typography variant="h4" fontWeight="bold" sx={{ mt: 2 }}>
        Erişim Reddedildi
      </Typography>

      <Typography sx={{ mt: 1, mb: 3 }} color="text.secondary">
        Bu sayfayı görüntülemek için yetkiniz bulunmuyor.
      </Typography>

      <Button variant="contained" onClick={() => navigate("/")}>
        Panele Dön
      </Button>
    </Box>
  );
}

export default AccessDenied;
