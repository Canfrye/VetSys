import {
  Card,
  CardContent,
  Typography,
} from "@mui/material";

function ExaminationHistoryCard() {
  return (
    <Card>
      <CardContent>

        <Typography
          variant="h6"
          fontWeight="bold"
        >
          Muayene Geçmişi
        </Typography>

        <Typography sx={{ mt: 2 }}>
          Henüz muayene kaydı bulunmuyor.
        </Typography>

      </CardContent>
    </Card>
  );
}

export default ExaminationHistoryCard;