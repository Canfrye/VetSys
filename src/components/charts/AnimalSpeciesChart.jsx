import { useEffect, useState } from "react";

import PieChart from "./PieChart";
import { getAnimals } from "../../services/animalService";

function AnimalSpeciesChart() {
  const [labels, setLabels] = useState([]);
  const [data, setData] = useState([]);

  useEffect(() => {
    getAnimals().then((animals) => {
      const counts = {};

      animals.forEach((animal) => {
        counts[animal.species] = (counts[animal.species] || 0) + 1;
      });

      setLabels(Object.keys(counts));
      setData(Object.values(counts));
    });
  }, []);

  return <PieChart labels={labels} data={data} />;
}

export default AnimalSpeciesChart;
