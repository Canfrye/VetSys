import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import EmptyState from "../EmptyState";
import { summarizeMedications } from "../../utils/prescriptionUtils";

function flattenUsedMedications(prescriptions = []) {
  const rows = [];

  prescriptions.forEach((prescription) => {
    (prescription.items || []).forEach((item, index) => {
      if (!item.medicationName) return;

      rows.push({
        id: `${prescription.id}-${item.id || index}`,
        medicationName: item.medicationName,
        quantity: item.quantity || 1,
        dose: item.dose || "",
        date: prescription.date || "-",
        prescriptionNumber: prescription.prescriptionNumber || "-",
      });
    });
  });

  return rows.sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
}

function PrescriptionHistoryCard({ prescriptions = [] }) {
  const usedMedications = flattenUsedMedications(prescriptions);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight="bold">
          Reçete Geçmişi
        </Typography>

        <Divider sx={{ my: 2 }} />

        {prescriptions.length === 0 ? (
          <EmptyState compact message="Reçete kaydı bulunmuyor." />
        ) : (
          prescriptions.map((prescription) => (
            <Box
              key={prescription.id}
              sx={{
                p: 2,
                mb: 2,
                border: "1px solid #eee",
                borderRadius: 2,
                minWidth: 0,
              }}
            >
              <Typography fontWeight="bold" noWrap>
                {prescription.prescriptionNumber}
              </Typography>

              <Typography color="text.secondary" variant="body2">
                Tarih: {prescription.date || "-"}
              </Typography>

              <Typography variant="body2" noWrap>
                Tanı: {prescription.diagnosis || "-"}
              </Typography>

              <Typography variant="body2" noWrap>
                İlaçlar: {summarizeMedications(prescription.items)}
              </Typography>

              <Typography variant="caption" color="text.secondary">
                Veteriner: {prescription.veterinarian || "-"}
              </Typography>
            </Box>
          ))
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" fontWeight={700} mb={1}>
          Kullanılan İlaçlar
        </Typography>

        {usedMedications.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            Reçetede kullanılan ilaç kaydı yok.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {usedMedications.map((row) => (
              <Box
                key={row.id}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 1,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <Box minWidth={0}>
                  <Typography fontWeight={600} noWrap>
                    {row.medicationName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {row.date} · {row.prescriptionNumber}
                    {row.dose ? ` · ${row.dose}` : ""}
                  </Typography>
                </Box>
                <Chip label={`${row.quantity} adet`} size="small" />
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

export default PrescriptionHistoryCard;
