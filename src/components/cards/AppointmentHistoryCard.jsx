import {
  Box,
  Card,
  CardContent,
  Divider,
  Typography,
} from "@mui/material";

import EmptyState from "../EmptyState";

function AppointmentHistoryCard({ appointments = [] }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight="bold">
          Randevu Geçmişi
        </Typography>

        <Divider sx={{ my: 2 }} />

        {appointments.length === 0 ? (
          <EmptyState compact message="Randevu bulunmuyor." />
        ) : (
          appointments.map((appointment) => (
            <Box
              key={appointment.id}
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
                title={appointment.reason || "Randevu"}
              >
                {appointment.reason || "Randevu"}
              </Typography>

              <Typography color="text.secondary" variant="body2">
                Tarih: {appointment.date || "-"}
                {appointment.time ? ` ${appointment.time}` : ""}
              </Typography>

              <Typography color="text.secondary" variant="body2">
                Durum: {appointment.status || "-"}
              </Typography>
            </Box>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default AppointmentHistoryCard;
