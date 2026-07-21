import { Typography } from "@mui/material";
import { Line } from "react-chartjs-2";

import "./chartSetup";

/**
 * Ortak, veri-agnostik çizgi grafik component'i (bkz. PieChart.jsx'teki
 * kart sarmalayıcı olmama notu).
 */
function LineChart({
  labels = [],
  data = [],
  datasetLabel = "",
  color = "#059669",
  emptyMessage = "Seçilen tarih aralığında veri bulunamadı.",
}) {
  if (data.length === 0) {
    return <Typography color="text.secondary">{emptyMessage}</Typography>;
  }

  return (
    <Line
      data={{
        labels,
        datasets: [
          {
            label: datasetLabel,
            data,
            borderColor: color,
            backgroundColor: color,
            tension: 0.3,
          },
        ],
      }}
      options={{
        plugins: {
          legend: { display: Boolean(datasetLabel) },
        },
      }}
    />
  );
}

export default LineChart;
