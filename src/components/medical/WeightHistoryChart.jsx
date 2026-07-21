import {
  Card,
  CardContent,
  Typography,
} from "@mui/material";

import LineChart from "../charts/LineChart";
import { buildWeightSeries } from "../../utils/medicalRecord";

function WeightHistoryChart({ examinations = [] }) {
  const series = buildWeightSeries(examinations);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Ağırlık Grafiği
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Muayenelerde girilen kilolardan otomatik oluşur.
        </Typography>

        <LineChart
          labels={series.labels}
          data={series.data}
          datasetLabel="Kilo (kg)"
          color="#0D9488"
          emptyMessage="Henüz kilo kaydı olan muayene yok."
        />
      </CardContent>
    </Card>
  );
}

export default WeightHistoryChart;
