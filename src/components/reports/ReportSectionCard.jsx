import { Box, Card, CardContent, IconButton, Tooltip, Typography } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

/**
 * Reports sayfasındaki tüm analiz bölümlerinin (grafik ya da liste) ortak
 * çerçevesi: başlık + isteğe bağlı CSV/Excel indirme butonu. Beş farklı
 * bölümde tekrar eden "başlık + indirme butonu" markup'ını tekilleştirir.
 */
function ReportSectionCard({ title, onExportCsv, children }) {
  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Typography variant="h6">{title}</Typography>

          {onExportCsv && (
            <Tooltip title="CSV/Excel olarak indir">
              <IconButton size="small" onClick={onExportCsv}>
                <FileDownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {children}
      </CardContent>
    </Card>
  );
}

export default ReportSectionCard;
