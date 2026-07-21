import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";

function StatChip({ label, value }) {
  return (
    <Box
      sx={{
        p: 1.25,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "grey.50",
        minWidth: 0,
      }}
    >
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography fontWeight={800} variant="h6">
        {value}
      </Typography>
    </Box>
  );
}

/**
 * Aşı takvimi önizleme / onay diyaloğu.
 */
function VaccineScheduleDialog({
  open,
  proposal,
  creating = false,
  onConfirm,
  onCancel,
  title = "Aşı Takvimi Oluştur",
  confirmLabel = "Takvimi Oluştur",
}) {
  if (!proposal) return null;

  const toCreate = proposal.vaccines || [];
  const skipped = proposal.skippedVaccines || [];
  const stats = proposal.stats || {
    templateTotal:
      proposal.templateVaccineCount ?? toCreate.length + skipped.length,
    toCreate: toCreate.length,
    alreadyExist: skipped.length,
    completed: 0,
    appointmentsToCreate: toCreate.length,
  };

  return (
    <Dialog
      open={open}
      onClose={creating ? undefined : onCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={1.25} sx={{ mb: 2 }}>
          <Typography>
            <strong>Hayvan:</strong> {proposal.animalName}
          </Typography>
          <Typography>
            <strong>Tür:</strong> {proposal.species}
          </Typography>
          <Typography>
            <strong>Yaş / Protokol:</strong> {proposal.ageLabel} (
            {proposal.ageGroup})
          </Typography>
          {proposal.veterinarian ? (
            <Typography>
              <strong>Veteriner:</strong> {proposal.veterinarian}
            </Typography>
          ) : null}
        </Stack>

        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid size={4}>
            <StatChip label="Toplam Şablon" value={stats.templateTotal} />
          </Grid>
          <Grid size={4}>
            <StatChip label="Oluşturulacak" value={stats.toCreate} />
          </Grid>
          <Grid size={4}>
            <StatChip label="Zaten Var" value={stats.alreadyExist} />
          </Grid>
          <Grid size={4}>
            <StatChip label="Tamamlanmış" value={stats.completed} />
          </Grid>
          <Grid size={4}>
            <StatChip
              label="Oluşturulacak Randevu"
              value={stats.appointmentsToCreate}
            />
          </Grid>
        </Grid>

        {proposal.ageGroup === "Yetişkin" && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Hayvan yetişkin protokolünde. Yavru aşıları (Karma 1, Karma 2 vb.)
            oluşturulmaz.
          </Alert>
        )}

        {skipped.length > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {skipped.length} aşı zaten kayıtlı (aynı ad / tarih / doz) —
            tekrar oluşturulmayacak.
          </Alert>
        )}

        <Divider sx={{ mb: 1.5 }} />

        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
          Oluşturulacak aşılar ve randevu saatleri
        </Typography>

        {toCreate.length === 0 ? (
          <Typography color="text.secondary">
            Eklenecek yeni aşı yok. Tüm şablon aşıları zaten kayıtlı.
          </Typography>
        ) : (
          <List dense disablePadding>
            {toCreate.map((item, index) => (
              <ListItem
                key={`${item.vaccineName}-${item.applicationDate}-${index}`}
                sx={{
                  px: 0,
                  borderBottom:
                    index < toCreate.length - 1 ? "1px solid #eee" : "none",
                }}
              >
                <ListItemText
                  primary={item.vaccineName}
                  secondary={[
                    item.applicationDate,
                    item.appointmentTime || proposal.appointmentTime,
                    proposal.veterinarian
                      ? `Veteriner: ${proposal.veterinarian}`
                      : null,
                    "Durum: Bekliyor",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                />
              </ListItem>
            ))}
          </List>
        )}

        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Onaylandığında eksik aşı kayıtları ve randevular birlikte
            oluşturulur. Manuel ve tamamlanmış kayıtlar etkilenmez.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onCancel} disabled={creating} color="inherit">
          Vazgeç
        </Button>
        <Button
          onClick={onConfirm}
          disabled={creating || toCreate.length === 0}
          variant="contained"
          color="success"
          autoFocus
        >
          {creating ? "Oluşturuluyor..." : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default VaccineScheduleDialog;
