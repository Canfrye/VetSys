import {
  Box,
  Card,
  CardContent,
  Divider,
  Typography,
} from "@mui/material";

import EmptyState from "../EmptyState";

function VaccineHistoryCard({ vaccines = [] }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight="bold">
          Aşı Geçmişi
        </Typography>

        <Divider sx={{ my: 2 }} />

        {vaccines.length === 0 ? (
          <EmptyState compact message="Aşı kaydı bulunmuyor." />
        ) : (
          vaccines.map((vaccine) => (
            <Box
              key={vaccine.id}
              sx={{
                p: 2,
                mb: 2,
                border: "1px solid #eee",
                borderRadius: 2,
              }}
            >
              <Typography
                fontWeight="bold"
                noWrap
                title={vaccine.vaccineName || ""}
              >
                {vaccine.vaccineName}
              </Typography>

              <Typography color="text.secondary" variant="body2">
                Uygulama: {vaccine.applicationDate || "-"}
              </Typography>

              <Typography color="text.secondary" variant="body2">
                Sonraki Doz: {vaccine.nextDoseDate || "-"}
              </Typography>
            </Box>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default VaccineHistoryCard;
