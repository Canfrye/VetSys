import { Typography } from "@mui/material";
import { Bar } from "react-chartjs-2";

import "./chartSetup";

/**
 * Ortak, veri-agnostik çubuk grafik component'i (bkz. PieChart.jsx'teki
 * kart sarmalayıcı olmama notu).
 */
function BarChart({
  labels = [],
  data = [],
  datasetLabel = "",
  color = "#2563eb",
  horizontal = false,
  emptyMessage = "Veri bulunamadı.",
}) {
  if (data.length === 0) {
    return <Typography color="text.secondary">{emptyMessage}</Typography>;
  }

  return (
    <Bar
      data={{
        labels,
        datasets: [
          {
            label: datasetLabel,
            data,
            backgroundColor: color,
          },
        ],
      }}
      options={{
        indexAxis: horizontal ? "y" : "x",
        plugins: {
          legend: { display: Boolean(datasetLabel) },
        },
      }}
    />
  );
}

export default BarChart;
