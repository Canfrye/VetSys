const STORAGE_KEY = "vetsys_vaccines";

/* ---------------- Helpers ---------------- */

const read = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const write = (vaccines) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vaccines));
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

/* ---------------- CRUD ---------------- */

export const getVaccines = () => {
  return read().sort(
    (a, b) =>
      new Date(a.nextDoseDate || "2999-01-01") -
      new Date(b.nextDoseDate || "2999-01-01")
  );
};

export const getVaccineById = (id) => {
  return read().find((v) => v.id === id);
};

export const addVaccine = (vaccine) => {
  const vaccines = read();

  const newVaccine = {
    id: generateId(),

    animalId: vaccine.animalId,
    animalName: vaccine.animalName,

    ownerId: vaccine.ownerId,
    ownerName: vaccine.ownerName,

    vaccineName: vaccine.vaccineName,
    brand: vaccine.brand || "",
    batchNo: vaccine.batchNo || "",

    dose: vaccine.dose || "",

    applicationDate: vaccine.applicationDate,

    nextDoseDate: vaccine.nextDoseDate || "",

    veterinarian: vaccine.veterinarian || "",

    notes: vaccine.notes || "",

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  vaccines.push(newVaccine);

  write(vaccines);

  return newVaccine;
};

export const updateVaccine = (vaccine) => {
  const vaccines = read();

  const index = vaccines.findIndex(
    (v) => v.id === vaccine.id
  );

  if (index === -1) return null;

  vaccines[index] = {
    ...vaccines[index],
    ...vaccine,
    updatedAt: new Date().toISOString(),
  };

  write(vaccines);

  return vaccines[index];
};

export const deleteVaccine = (id) => {
  write(
    read().filter((v) => v.id !== id)
  );
};

export const getVaccinesByAnimal = (animalId) => {
  return getVaccines().filter(
    (v) => String(v.animalId) === String(animalId)
  );
};

export const getUpcomingVaccines = (days = 7) => {
  const today = new Date();

  const end = new Date();
  end.setDate(end.getDate() + days);

  return getVaccines().filter((v) => {
    if (!v.nextDoseDate) return false;

    const date = new Date(v.nextDoseDate);

    return date >= today && date <= end;
  });
};

export const getTodayVaccines = () => {
  const today = new Date().toISOString().slice(0, 10);

  return getVaccines().filter(
    (v) => v.nextDoseDate === today
  );
};

export const getVaccineCount = () => {
  return read().length;
};

export const getLatestVaccines = (limit = 5) => {
  return getVaccines().slice(0, limit);
};
export const getAnimalVaccines = (animalId) => {
  return getVaccines().filter(
    (vaccine) =>
      String(vaccine.animalId) === String(animalId)
  );
};