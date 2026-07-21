import { Box, Typography } from "@mui/material";

/**
 * "En aktif müşteriler" / "En çok ziyaret edilen hayvanlar" gibi sıralı
 * listeler için ortak render mantığı.
 */
function RankedList({ rows = [], renderValue, emptyMessage = "Veri bulunamadı." }) {
  if (rows.length === 0) {
    return <Typography color="text.secondary">{emptyMessage}</Typography>;
  }

  return (
    <Box>
      {rows.map((row, index) => (
        <Box
          key={row.id || row.name || index}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
            py: 1,
            borderBottom:
              index < rows.length - 1 ? "1px solid #eee" : "none",
            minWidth: 0,
          }}
        >
          <Typography noWrap title={row.name} sx={{ minWidth: 0, flex: 1 }}>
            {index + 1}. {row.name}
          </Typography>

          <Typography fontWeight="bold" sx={{ flexShrink: 0 }}>
            {renderValue(row)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export default RankedList;
