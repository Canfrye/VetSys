const STORAGE_KEY = "vetsys_animals";

/* -------------------- Helpers -------------------- */

const read = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const write = (animals) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(animals));
};

const generateId = () => {
  if (window.crypto?.randomUUID) {
    return crypto.randomUUID();
  }

  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 9)
  );
};

/* -------------------- CRUD -------------------- */

export const getAnimals = () => {
  return read().sort((a, b) =>
    a.name.localeCompare(
      b.name,
      "tr",
      { sensitivity: "base" }
    )
  );
};

export const getAnimalById = (id) => {
  return read().find(
    (animal) => String(animal.id) === String(id)
  );
};

export const addAnimal = (animal) => {
  const animals = read();

  const newAnimal = {
    id: generateId(),

    ownerId: animal.ownerId,
    ownerName: animal.ownerName,

    name: animal.name.trim(),

    species: animal.species,

    breed: animal.breed || "",

    gender: animal.gender || "",

    birthDate: animal.birthDate || "",

    color: animal.color || "",

    microchipNo: animal.microchipNo || "",

    weight: animal.weight || "",

    note: animal.note || "",

    createdAt: new Date().toISOString(),

    updatedAt: new Date().toISOString(),
  };

  animals.push(newAnimal);

  write(animals);

  return newAnimal;
};

export const updateAnimal = (updatedAnimal) => {
  const animals = read();

  const index = animals.findIndex(
    (animal) => String(animal.id) === String(updatedAnimal.id)
  );

  if (index === -1) return null;

  animals[index] = {
    ...animals[index],
    ...updatedAnimal,
    updatedAt: new Date().toISOString(),
  };

  write(animals);

  return animals[index];
};

export const deleteAnimal = (id) => {
  const animals = read().filter(
    (animal) => String(animal.id) !== String(id)
  );

  write(animals);
};

export const searchAnimals = (searchText = "") => {
  const text = searchText.toLowerCase().trim();

  if (!text) return getAnimals();

  return getAnimals().filter((animal) => {
    return (
      (animal.name || "").toLowerCase().includes(text) ||
      (animal.ownerName || "").toLowerCase().includes(text) ||
      (animal.species || "").toLowerCase().includes(text) ||
      (animal.breed || "").toLowerCase().includes(text) ||
      (animal.microchipNo || "").toLowerCase().includes(text)
    );
  });
};

export const isMicrochipExists = (
  microchipNo,
  currentId = null
) => {
  if (!microchipNo) return false;

  return read().some(
    (animal) =>
      animal.microchipNo === microchipNo &&
      String(animal.id) !== String(currentId)
  );
};

export const getAnimalsByOwner = (ownerId) => {
  return getAnimals().filter(
    (animal) =>
      String(animal.ownerId) === String(ownerId)
  );
};

export const getAnimalCount = () => {
  return read().length;
};

export const getLatestAnimals = (limit = 5) => {
  return [...read()]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0) -
        new Date(a.createdAt || 0)
    )
    .slice(0, limit);
};

export const getAnimalsBySpecies = (species) => {
  return getAnimals().filter(
    (animal) =>
      animal.species?.toLowerCase() ===
      species?.toLowerCase()
  );
};

export const getSpeciesStatistics = () => {
  const animals = getAnimals();

  const stats = {};

  animals.forEach((animal) => {
    const key = animal.species || "Bilinmiyor";

    stats[key] = (stats[key] || 0) + 1;
  });

  return Object.entries(stats).map(([name, value]) => ({
    name,
    value,
  }));
};

export const getAnimalsCreatedByMonth = () => {
  const months = [
    "Oca",
    "Şub",
    "Mar",
    "Nis",
    "May",
    "Haz",
    "Tem",
    "Ağu",
    "Eyl",
    "Eki",
    "Kas",
    "Ara",
  ];

  const result = months.map((month) => ({
    month,
    count: 0,
  }));

  getAnimals().forEach((animal) => {
    if (!animal.createdAt) return;

    const date = new Date(animal.createdAt);

    result[date.getMonth()].count++;
  });

  return result;
};