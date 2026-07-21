import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Typography,
} from "@mui/material";

import { formatCurrency } from "../../utils/invoiceCalc";

function SummaryItem({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography fontWeight={700} noWrap title={String(value)}>
        {value}
      </Typography>
    </Box>
  );
}

function AnimalSummaryCard({ animal, summary }) {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h5" fontWeight={800} gutterBottom>
          {animal.name}
        </Typography>
        <Typography color="text.secondary" mb={2}>
          {animal.species}
          {animal.breed ? ` · ${animal.breed}` : ""}
          {animal.gender ? ` · ${animal.gender}` : ""}
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={6} sm={4} md={3}>
            <SummaryItem label="Yaş" value={summary.ageLabel} />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <SummaryItem label="Cins / Irk" value={summary.breed} />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <SummaryItem label="Kilo" value={`${summary.weight} kg`} />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <SummaryItem label="Son muayene" value={summary.lastExamination} />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <SummaryItem label="Son aşı" value={summary.lastVaccine} />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <SummaryItem
              label="Sonraki aşı"
              value={
                summary.nextVaccineName
                  ? `${summary.nextVaccine} (${summary.nextVaccineName})`
                  : summary.nextVaccine
              }
            />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <SummaryItem label="Sonraki kontrol" value={summary.nextControl} />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <SummaryItem label="Toplam ziyaret" value={summary.visitCount} />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <SummaryItem
              label="Toplam fatura"
              value={`${summary.invoiceCount} · ${formatCurrency(summary.invoiceTotal)}`}
            />
          </Grid>
        </Grid>

        {summary.clinicalNotes.length > 0 && (
          <Box mt={2} display="flex" gap={1} flexWrap="wrap">
            {summary.clinicalNotes.map((note) => (
              <Chip key={note} label={note} color="warning" size="small" />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default AnimalSummaryCard;
