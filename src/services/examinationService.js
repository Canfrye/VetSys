const STORAGE_KEY = "vetsys_examinations";

/* ---------------- Helpers ---------------- */

const read = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const write = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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

export const getExaminations = () => {
  return read().sort(
    (a, b) =>
      new Date(b.examinationDate) -
      new Date(a.examinationDate)
  );
};

export const getExaminationById = (id) => {
  return read().find(
    (e) => String(e.id) === String(id)
  );
};

export const addExamination = (exam) => {
  const examinations = read();

  const newExam = {
    id: generateId(),

    animalId: exam.animalId,
    animalName: exam.animalName,

    ownerId: exam.ownerId,
    ownerName: exam.ownerName,

    species: exam.species || "",

    veterinarian: exam.veterinarian || "",

    examinationDate:
      exam.examinationDate ||
      new Date().toISOString().slice(0, 10),

    complaint: exam.complaint || "",
    diagnosis: exam.diagnosis || "",
    findings: exam.findings || "",
    treatment: exam.treatment || "",

    temperature: exam.temperature || "",
    pulse: exam.pulse || "",
    respiration: exam.respiration || "",
    weight: exam.weight || "",

    medicines: exam.medicines || "",
    procedures: exam.procedures || "",

    controlDate: exam.controlDate || "",

    notes: exam.notes || "",

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  examinations.push(newExam);

  write(examinations);

  return newExam;
};

export const updateExamination = (exam) => {
  const examinations = read();

  const index = examinations.findIndex(
    (e) => String(e.id) === String(exam.id)
  );

  if (index === -1) return null;

  examinations[index] = {
    ...examinations[index],
    ...exam,
    updatedAt: new Date().toISOString(),
  };

  write(examinations);

  return examinations[index];
};

export const deleteExamination = (id) => {
  write(
    read().filter(
      (e) => String(e.id) !== String(id)
    )
  );
};

export const getExaminationsByAnimal = (animalId) => {
  return getExaminations().filter(
    (e) =>
      String(e.animalId) === String(animalId)
  );
};

export const getAnimalExaminations = (animalId) => {
  return getExaminations().filter(
    (exam) =>
      String(exam.animalId) === String(animalId)
  );
};

export const getLatestExaminations = (limit = 5) => {
  return getExaminations().slice(0, limit);
};

export const getExaminationCount = () => {
  return read().length;
};

/* ---------------- Dashboard ---------------- */

export const getTodayExaminations = () => {
  const today = new Date().toISOString().slice(0, 10);

  return getExaminations().filter(
    (exam) => exam.examinationDate === today
  );
};

export const getUpcomingControls = (days = 7) => {
  const today = new Date();

  const endDate = new Date();
  endDate.setDate(today.getDate() + days);

  return getExaminations().filter((exam) => {
    if (!exam.controlDate) return false;

    const control = new Date(exam.controlDate);

    return control >= today && control <= endDate;
  });
};

export const getAverageWeight = () => {
  const list = getExaminations().filter(
    (e) =>
      e.weight &&
      !isNaN(Number(e.weight))
  );

  if (list.length === 0) return 0;

  const total = list.reduce(
    (sum, e) => sum + Number(e.weight),
    0
  );

  return (total / list.length).toFixed(1);
};

export const getMostCommonDiagnosis = () => {
  const counts = {};

  getExaminations().forEach((exam) => {
    if (!exam.diagnosis) return;

    counts[exam.diagnosis] =
      (counts[exam.diagnosis] || 0) + 1;
  });

  const sorted = Object.entries(counts).sort(
    (a, b) => b[1] - a[1]
  );

  return sorted.length ? sorted[0][0] : "-";
};

export const getMostExaminedSpecies = () => {
  const counts = {};

  getExaminations().forEach((exam) => {
    const key = exam.species || "Bilinmiyor";

    counts[key] = (counts[key] || 0) + 1;
  });

  const sorted = Object.entries(counts).sort(
    (a, b) => b[1] - a[1]
  );

  return sorted.length ? sorted[0][0] : "-";
};

export const getRecentDiagnoses = (limit = 5) => {
  return getExaminations()
    .filter((e) => e.diagnosis)
    .slice(0, limit);
};