import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";

import { Bar } from "react-chartjs-2";

import { getCustomers } from "../../services/customerService";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip
);

function CustomerGrowthChart() {

  const months = [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
  ];

  const values = Array(12).fill(0);

  getCustomers().forEach((customer) => {

    if (!customer.createdAt) return;

    const month = new Date(
      customer.createdAt
    ).getMonth();

    values[month]++;

  });

  return (
    <Bar
      data={{
        labels: months,

        datasets: [
          {
            label: "Yeni Müşteri",

            data: values,
          },
        ],
      }}
    />
  );
}

export default CustomerGrowthChart;