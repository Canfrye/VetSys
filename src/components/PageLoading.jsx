import { Box, CircularProgress, Typography } from "@mui/material";

/**
 * Sayfa veri yüklenirken gösterilen tutarlı yükleme durumu.
 * Boş beyaz ekran (return null) yerine kullanılır.
 */
function PageLoading({ message = "Yükleniyor..." }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        minHeight: 280,
        color: "text.secondary",
      }}
    >
      <CircularProgress size={36} />
      <Typography variant="body2">{message}</Typography>
    </Box>
  );
}

export default PageLoading;
