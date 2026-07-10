import {
  Card,
  CardContent,
  Typography,
  Divider,
  Stack,
} from "@mui/material";

function CustomerInfoCard({ customer }) {
  return (
    <Card>
      <CardContent>

        <Typography
          variant="h5"
          fontWeight="bold"
          gutterBottom
        >
          {customer.ad} {customer.soyad}
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <Stack spacing={2}>

          <div>
            <Typography color="text.secondary">
              Telefon
            </Typography>

            <Typography>
              {customer.telefon || "-"}
            </Typography>
          </div>

          <div>
            <Typography color="text.secondary">
              E-Posta
            </Typography>

            <Typography>
              {customer.email || "-"}
            </Typography>
          </div>

          <div>
            <Typography color="text.secondary">
              Adres
            </Typography>

            <Typography>
              {customer.adres || "-"}
            </Typography>
          </div>

          <div>
            <Typography color="text.secondary">
              Not
            </Typography>

            <Typography>
              {customer.not || "-"}
            </Typography>
          </div>

        </Stack>

      </CardContent>
    </Card>
  );
}

export default CustomerInfoCard;