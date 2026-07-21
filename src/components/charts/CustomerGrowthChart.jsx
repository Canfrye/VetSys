import { useEffect, useState } from "react";

import BarChart from "./BarChart";
import { getCustomers } from "../../services/customerService";

const MONTHS = [
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

function CustomerGrowthChart() {
  const [values, setValues] = useState(Array(12).fill(0));

  useEffect(() => {
    getCustomers().then((customers) => {
      const monthlyValues = Array(12).fill(0);

      customers.forEach((customer) => {
        if (!customer.createdAt) return;

        const month = new Date(customer.createdAt).getMonth();

        monthlyValues[month]++;
      });

      setValues(monthlyValues);
    });
  }, []);

  return (
    <BarChart
      labels={MONTHS}
      data={values}
      datasetLabel="Yeni Müşteri"
    />
  );
}

export default CustomerGrowthChart;
