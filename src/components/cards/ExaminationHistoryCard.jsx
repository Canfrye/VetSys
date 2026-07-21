import {
  Box,
  Card,
  CardContent,
  Divider,
  Typography,
} from "@mui/material";

import EmptyState from "../EmptyState";

function ExaminationHistoryCard({ examinations = [] }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight="bold">
          Muayene Geçmişi
        </Typography>

        <Divider sx={{ my: 2 }} />

        {examinations.length === 0 ? (
          <EmptyState compact message="Muayene kaydı bulunmuyor." />
        ) : (
          examinations.map((exam) => (
            <Box
              key={exam.id}
              sx={{
                p: 2,
                mb: 2,
                border: "1px solid #eee",
                borderRadius: 2,
              }}
            >
              <Typography fontWeight="bold" noWrap title={exam.diagnosis || ""}>
                {exam.diagnosis || "Tanı girilmedi"}
              </Typography>

              <Typography color="text.secondary" variant="body2">
                Tarih: {exam.examinationDate || "-"}
              </Typography>

              <Typography color="text.secondary" variant="body2" noWrap>
                Veteriner: {exam.veterinarian || "-"}
              </Typography>

              {exam.treatment && (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Tedavi: {exam.treatment}
                </Typography>
              )}
            </Box>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default ExaminationHistoryCard;
