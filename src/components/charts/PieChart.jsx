import { Typography } from "@mui/material";
import { Pie } from "react-chartjs-2";

import "./chartSetup";

const DEFAULT_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#7C3AED",
  "#0D9488",
  "#DC2626",
  "#2563EB",
];

/**
 * Ortak, veri-agnostik pasta grafik component'i. Kart/başlık gibi görsel
 * çerçeveleme çağıran sayfaya bırakılır (Dashboard'ın `.dashboard-card`
 * div'i ile Reports'un MUI Card'ı farklı stiller kullandığı için burada
 * sabit bir Card sarmalayıcı YOKTUR — mevcut sayfa tasarımları bozulmaz).
 */
function PieChart({ labels = [], data = [], emptyMessage = "Veri bulunamadı." }) {
  const isEmpty = data.length === 0 || data.every((value) => !value);

  if (isEmpty) {
    return <Typography color="text.secondary">{emptyMessage}</Typography>;
  }

  return (
    <Pie
      data={{
        labels,
        datasets: [
          {
            data,
            backgroundColor: DEFAULT_COLORS,
          },
        ],
      }}
    />
  );
}

export default PieChart;
