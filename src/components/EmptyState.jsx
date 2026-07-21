import { Box, Typography } from "@mui/material";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";

/**
 * Boş liste / boş geçmiş durumları için ortak boş ekran.
 * compact=true: kart içi (history) kullanımlarında daha az padding.
 */
function EmptyState({
  message = "Kayıt bulunamadı.",
  compact = false,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        py: compact ? 3 : 5,
        px: 2,
        textAlign: "center",
        color: "text.secondary",
      }}
    >
      <InboxOutlinedIcon
        sx={{ fontSize: compact ? 36 : 48, color: "action.disabled" }}
      />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}

export default EmptyState;
