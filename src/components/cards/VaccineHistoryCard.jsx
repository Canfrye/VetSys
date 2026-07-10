import {
  Card,
  CardContent,
  Typography,
} from "@mui/material";

function VaccineHistoryCard() {
  return (
    <Card>
      <CardContent>

        <Typography
          variant="h6"
          fontWeight="bold"
        >
          Aşı Geçmişi
        </Typography>

        <Typography sx={{ mt: 2 }}>
          Henüz aşı kaydı bulunmuyor.
        </Typography>

      </CardContent>
    </Card>
  );
}

export default VaccineHistoryCard;