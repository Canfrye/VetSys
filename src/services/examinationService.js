import { STORAGE_KEYS } from "../utils/storage";
import apiClient from "./apiClient";
import { todayDateOnly, toDateOnly } from "../utils/dateRange";
import { createAuditLog } from "./auditLogService";
import { AUDIT_ACTIONS, AUDIT_MODULES } from "../utils/auditLog";

const RESOURCE = STORAGE_KEYS.EXAMINATIONS;

/* ---------------- CRUD ---------------- */

export const getExaminations = async () => {
  const examinations = await apiClient.getAll(RESOURCE);

  return [...examinations].sort(
    (a, b) =>
      new Date(b.examinationDate) - new Date(a.examinationDate)
  );
};

export const getExaminationById = (id) => apiClient.getById(RESOURCE, id);

export const addExamination = async (exam) => {
  const saved = await apiClient.create(RESOURCE, {
    animalId: exam.animalId,
    animalName: exam.animalName,

    ownerId: exam.ownerId,
    ownerName: exam.ownerName,

    species: exam.species || "",

    veterinarian: exam.veterinarian || "",

    examinationDate:
      exam.examinationDate || todayDateOnly(),

    examType: exam.examType || "Genel Muayene",
    fee: exam.fee === "" || exam.fee == null ? null : Number(exam.fee),

    complaint: exam.complaint || "",

    generalCondition: exam.generalCondition || "",

    diagnosis: exam.diagnosis || "",
    findings: exam.findings || "",
    treatment: exam.treatment || "",

    temperature: exam.temperature || "",
    pulse: exam.pulse || "",
    respiration: exam.respiration || "",
    height: exam.height || "",
    weight: exam.weight || "",

    medicines: exam.medicines || "",
    procedures: exam.procedures || "",

    labResult: exam.labResult || "",

    controlDate: exam.controlDate || "",

    notes: exam.notes || "",

    // Opsiyonel ekler (Base64) — mevcut muayene kaydı üzerinde tutulur.
    attachments: Array.isArray(exam.attachments) ? exam.attachments : [],
  });

  await createAuditLog({
    module: AUDIT_MODULES.EXAMINATION,
    action: AUDIT_ACTIONS.CREATE,
    description: `Muayene oluşturuldu: ${saved.animalName || ""}`.trim(),
    entityId: saved.id,
    animalId: saved.animalId || "",
    ownerId: saved.ownerId || "",
  });

  return saved;
};

export const updateExamination = async (exam) => {
  const saved = await apiClient.update(RESOURCE, exam.id, exam);

  if (saved) {
    await createAuditLog({
      module: AUDIT_MODULES.EXAMINATION,
      action: AUDIT_ACTIONS.UPDATE,
      description: `Muayene güncellendi: ${saved.animalName || ""}`.trim(),
      entityId: saved.id,
      animalId: saved.animalId || "",
      ownerId: saved.ownerId || "",
    });
  }

  return saved;
};

export const deleteExamination = async (id) => {
  const existing = await getExaminationById(id);
  await apiClient.remove(RESOURCE, id);

  await createAuditLog({
    module: AUDIT_MODULES.EXAMINATION,
    action: AUDIT_ACTIONS.DELETE,
    description: `Muayene silindi: ${existing?.animalName || id}`,
    entityId: id,
    animalId: existing?.animalId || "",
    ownerId: existing?.ownerId || "",
  });
};

export const deleteExaminationsByAnimalId = (animalId) => {
  return apiClient.removeWhere(
    RESOURCE,
    (e) => String(e.animalId) === String(animalId)
  );
};

export const deleteExaminationsByOwnerId = (ownerId) => {
  return apiClient.removeWhere(
    RESOURCE,
    (e) => String(e.ownerId) === String(ownerId)
  );
};

export const syncOwnerName = (ownerId, ownerName) => {
  return apiClient.updateWhere(
    RESOURCE,
    (e) => String(e.ownerId) === String(ownerId),
    () => ({ ownerName })
  );
};

export const syncAnimalName = (animalId, animalName) => {
  return apiClient.updateWhere(
    RESOURCE,
    (e) => String(e.animalId) === String(animalId),
    () => ({ animalName })
  );
};

export const syncOwnerForAnimal = (animalId, ownerId, ownerName) => {
  return apiClient.updateWhere(
    RESOURCE,
    (e) => String(e.animalId) === String(animalId),
    () => ({ ownerId, ownerName })
  );
};

export const getAnimalExaminations = async (animalId) => {
  const examinations = await getExaminations();

  return examinations.filter(
    (exam) => String(exam.animalId) === String(animalId)
  );
};

export const getLatestExaminations = async (limit = 5) => {
  const examinations = await getExaminations();
  return examinations.slice(0, limit);
};

export const getExaminationCount = async () => {
  const examinations = await apiClient.getAll(RESOURCE);
  return examinations.length;
};

/* ---------------- Dashboard ---------------- */

export const getTodayExaminations = async () => {
  const today = todayDateOnly();

  const examinations = await getExaminations();

  return examinations.filter((exam) => exam.examinationDate === today);
};

export const getUpcomingControls = async (days = 7) => {
  const today = todayDateOnly();
  const end = new Date();
  end.setDate(end.getDate() + days);
  const endStr = toDateOnly(end);

  const examinations = await getExaminations();

  return examinations.filter((exam) => {
    if (!exam.controlDate) return false;
    return exam.controlDate >= today && exam.controlDate <= endStr;
  });
};

/** Bugün kontrol tarihi olan muayeneler. */
export const getTodayControls = async () => {
  const today = todayDateOnly();
  const examinations = await getExaminations();

  return examinations.filter((exam) => exam.controlDate === today);
};

/** controlDate bugünden eski olan kontroller. */
export const getOverdueControls = async () => {
  const today = todayDateOnly();
  const examinations = await getExaminations();

  return examinations.filter(
    (exam) => exam.controlDate && exam.controlDate < today
  );
};

export const getAverageWeight = async () => {
  const examinations = await getExaminations();

  const list = examinations.filter(
    (e) => e.weight && !isNaN(Number(e.weight))
  );

  if (list.length === 0) return 0;

  const total = list.reduce((sum, e) => sum + Number(e.weight), 0);

  return (total / list.length).toFixed(1);
};

export const getMostCommonDiagnosis = async () => {
  const examinations = await getExaminations();

  const counts = {};

  examinations.forEach((exam) => {
    if (!exam.diagnosis) return;

    counts[exam.diagnosis] = (counts[exam.diagnosis] || 0) + 1;
  });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return sorted.length ? sorted[0][0] : "-";
};

export const getMostExaminedSpecies = async () => {
  const examinations = await getExaminations();

  const counts = {};

  examinations.forEach((exam) => {
    const key = exam.species || "Bilinmiyor";

    counts[key] = (counts[key] || 0) + 1;
  });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return sorted.length ? sorted[0][0] : "-";
};

export const getRecentDiagnoses = async (limit = 5) => {
  const examinations = await getExaminations();

  return examinations.filter((e) => e.diagnosis).slice(0, limit);
};
