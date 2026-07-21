import {
  Card,
  CardActionArea,
  CardContent,
  Divider,
  Grid,
  Typography,
} from "@mui/material";

/**
 * Hasta dosyası — otomatik aşı takvimi durum özeti.
 */
function VaccineScheduleStatusCard({ status, onClick }) {
  const nextLabel =
    status?.nextVaccineName && status?.nextVaccineDate
      ? `${status.nextVaccineName} · ${status.nextVaccineDate}`
      : "Yok";

  const content = (
    <CardContent>
      <Typography variant="h6" fontWeight={800} gutterBottom>
        Aşı Takvimi Durumu
      </Typography>

      <Divider sx={{ mb: 2 }} />

      {!status?.hasAutoSchedule ? (
        <Typography color="text.secondary" variant="body2">
          Bu hayvan için henüz otomatik aşı takvimi yok. &quot;Aşı Takvimi
          Oluştur&quot; ile başlatabilirsiniz.
        </Typography>
      ) : (
        <Grid container spacing={1.5}>
          <Grid size={6}>
            <Typography variant="caption" color="text.secondary">
              Toplam Planlanan
            </Typography>
            <Typography fontWeight={800} variant="h5">
              {status.totalPlanned}
            </Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant="caption" color="text.secondary">
              Tamamlanan
            </Typography>
            <Typography fontWeight={800} variant="h5" color="success.main">
              {status.completedCount}
            </Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant="caption" color="text.secondary">
              Bekleyen
            </Typography>
            <Typography fontWeight={800} variant="h5" color="warning.main">
              {status.pendingCount}
            </Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant="caption" color="text.secondary">
              Sonraki Aşı
            </Typography>
            <Typography fontWeight={700} noWrap title={nextLabel}>
              {nextLabel}
            </Typography>
          </Grid>
        </Grid>
      )}
    </CardContent>
  );

  return (
    <Card id="vaccine-schedule-status" sx={{ mb: 0 }}>
      {onClick ? (
        <CardActionArea onClick={onClick} aria-label="Aşı geçmişine git">
          {content}
        </CardActionArea>
      ) : (
        content
      )}
    </Card>
  );
}

export default VaccineScheduleStatusCard;
