import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Pie } from "react-chartjs-2";

import { getAnimals } from "../../services/animalService";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

function AnimalSpeciesChart() {
  const animals = getAnimals();

  const counts = {};

  animals.forEach((animal) => {
    counts[animal.species] =
      (counts[animal.species] || 0) + 1;
  });

  const data = {
    labels: Object.keys(counts),

    datasets: [
      {
        data: Object.values(counts),
      },
    ],
  };

  return (
    <Pie data={data} />
  );
}

export default AnimalSpeciesChart;