import { STORAGE_KEYS } from "../utils/storage";
import apiClient from "./apiClient";
import { todayDateOnly } from "../utils/dateRange";
import {
  normalizePrescriptionItems,
  validatePrescriptionItems,
} from "../utils/prescriptionUtils";
import {
  deductStockForPrescription,
  previewPrescriptionStockImpact,
} from "./stockService";
import { createAuditLog } from "./auditLogService";
import { AUDIT_ACTIONS, AUDIT_MODULES } from "../utils/auditLog";

const RESOURCE = STORAGE_KEYS.PRESCRIPTIONS;

const buildPrescriptionNumber = async () => {
  const prescriptions = await apiClient.getAll(RESOURCE);
  const year = new Date().getFullYear();
  const prefix = `REC-${year}-`;

  let maxSeq = 0;

  prescriptions.forEach((prescription) => {
    const number = prescription.prescriptionNumber || "";
    if (!number.startsWith(prefix)) return;

    const seq = Number(number.slice(prefix.length));
    if (!Number.isNaN(seq) && seq > maxSeq) maxSeq = seq;
  });

  return `${prefix}${String(maxSeq + 1).padStart(4, "0")}`;
};

const buildPrescriptionPayload = (prescription) => {
  const check = validatePrescriptionItems(prescription.items);
  const items = check.valid
    ? check.items
    : normalizePrescriptionItems(prescription.items);

  return {
    animalId: prescription.animalId,
    animalName: prescription.animalName || "",

    ownerId: prescription.ownerId,
    ownerName: prescription.ownerName || "",

    veterinarian: prescription.veterinarian || "",

    examinationId: prescription.examinationId || "",
    examinationDate: prescription.examinationDate || "",

    date: prescription.date || todayDateOnly(),

    diagnosis: prescription.diagnosis || "",

    notes: prescription.notes || "",

    items,
  };
};

/* -------------------- CRUD -------------------- */

export const getPrescriptions = async () => {
  const prescriptions = await apiClient.getAll(RESOURCE);

  return [...prescriptions].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
};

export const getPrescriptionById = (id) =>
  apiClient.getById(RESOURCE, id);

/**
 * @param {object} prescription
 * @param {{ forceStock?: boolean, userName?: string }} [options]
 * forceStock=false iken stok uyarısı varsa { needsConfirmation, warnings, impact } döner
 * (reçete henüz kaydedilmez). forceStock=true ile kayıt + mümkün olan düşüm yapılır.
 */
export const addPrescription = async (prescription, options = {}) => {
  const { forceStock = false, userName = "" } = options;
  const check = validatePrescriptionItems(prescription.items);

  if (!check.valid) {
    throw new Error(check.error);
  }

  const impact = await previewPrescriptionStockImpact(check.items);

  if (impact.hasWarnings && !forceStock) {
    return {
      needsConfirmation: true,
      warnings: impact.warnings,
      impact,
    };
  }

  const prescriptionNumber = await buildPrescriptionNumber();

  const created = await apiClient.create(RESOURCE, {
    prescriptionNumber,
    ...buildPrescriptionPayload({
      ...prescription,
      items: check.items,
    }),
  });

  const deduction = await deductStockForPrescription(created, { userName });

  await createAuditLog({
    module: AUDIT_MODULES.PRESCRIPTION,
    action: AUDIT_ACTIONS.CREATE,
    description: `Reçete oluşturuldu: ${created.prescriptionNumber} (${created.animalName || ""})`,
    entityId: created.id,
    animalId: created.animalId || "",
    ownerId: created.ownerId || "",
    meta: { prescriptionNumber: created.prescriptionNumber },
  });

  return {
    needsConfirmation: false,
    prescription: created,
    warnings: deduction.warnings,
    impact: deduction,
  };
};

/**
 * Yeni reçete kaydı + stok uyarı onayı akışı.
 * @param {Function} confirmFn - async (message) => boolean
 * @returns {Promise<object|null>} null = kullanıcı iptal etti
 */
export const savePrescriptionWithStockCheck = async (
  prescription,
  { userName = "", confirmFn } = {}
) => {
  const first = await addPrescription(prescription, {
    forceStock: false,
    userName,
  });

  if (!first.needsConfirmation) {
    return first;
  }

  const message = [
    "Stok uyarısı:",
    ...(first.warnings || []),
    "",
    "Yine de kaydedilsin mi? Mevcut stok kadar düşülür; negatif stok oluşmaz.",
  ].join("\n");

  const confirmed = confirmFn ? await confirmFn(message) : false;

  if (!confirmed) {
    return null;
  }

  return addPrescription(prescription, {
    forceStock: true,
    userName,
  });
};

export const updatePrescription = async (prescription) => {
  const check = validatePrescriptionItems(prescription.items);

  if (!check.valid) {
    throw new Error(check.error);
  }

  const saved = await apiClient.update(RESOURCE, prescription.id, {
    prescriptionNumber: prescription.prescriptionNumber,
    ...buildPrescriptionPayload({
      ...prescription,
      items: check.items,
    }),
  });

  if (saved) {
    await createAuditLog({
      module: AUDIT_MODULES.PRESCRIPTION,
      action: AUDIT_ACTIONS.UPDATE,
      description: `Reçete güncellendi: ${saved.prescriptionNumber || ""} (${saved.animalName || ""})`,
      entityId: saved.id,
      animalId: saved.animalId || "",
      ownerId: saved.ownerId || "",
      meta: { prescriptionNumber: saved.prescriptionNumber },
    });
  }

  return saved;
};

export const deletePrescription = async (id) => {
  const existing = await getPrescriptionById(id);
  await apiClient.remove(RESOURCE, id);

  await createAuditLog({
    module: AUDIT_MODULES.PRESCRIPTION,
    action: AUDIT_ACTIONS.DELETE,
    description: `Reçete silindi: ${existing?.prescriptionNumber || id}`,
    entityId: id,
    animalId: existing?.animalId || "",
    ownerId: existing?.ownerId || "",
    meta: { prescriptionNumber: existing?.prescriptionNumber },
  });
};

export async function logPrescriptionPdfDownload(prescription) {
  if (!prescription) return;

  await createAuditLog({
    module: AUDIT_MODULES.PRESCRIPTION,
    action: AUDIT_ACTIONS.PDF,
    description: `Reçete PDF indirildi: ${prescription.prescriptionNumber || ""}`,
    entityId: prescription.id,
    animalId: prescription.animalId || "",
    ownerId: prescription.ownerId || "",
    meta: { prescriptionNumber: prescription.prescriptionNumber },
  });
}

export const deletePrescriptionsByAnimalId = (animalId) => {
  return apiClient.removeWhere(
    RESOURCE,
    (p) => String(p.animalId) === String(animalId)
  );
};

export const deletePrescriptionsByOwnerId = (ownerId) => {
  return apiClient.removeWhere(
    RESOURCE,
    (p) => String(p.ownerId) === String(ownerId)
  );
};

export const syncOwnerName = (ownerId, ownerName) => {
  return apiClient.updateWhere(
    RESOURCE,
    (p) => String(p.ownerId) === String(ownerId),
    () => ({ ownerName })
  );
};

export const syncAnimalName = (animalId, animalName) => {
  return apiClient.updateWhere(
    RESOURCE,
    (p) => String(p.animalId) === String(animalId),
    () => ({ animalName })
  );
};

export const syncOwnerForAnimal = (animalId, ownerId, ownerName) => {
  return apiClient.updateWhere(
    RESOURCE,
    (p) => String(p.animalId) === String(animalId),
    () => ({ ownerId, ownerName })
  );
};

export const getPrescriptionsByAnimal = async (animalId) => {
  const prescriptions = await getPrescriptions();

  return prescriptions.filter(
    (p) => String(p.animalId) === String(animalId)
  );
};

export const getPrescriptionCount = async () => {
  const prescriptions = await apiClient.getAll(RESOURCE);
  return prescriptions.length;
};

export const getTodayPrescriptions = async () => {
  const today = todayDateOnly();
  const prescriptions = await getPrescriptions();

  return prescriptions.filter((p) => p.date === today);
};

export const getLatestPrescriptions = async (limit = 5) => {
  const prescriptions = await getPrescriptions();
  return prescriptions.slice(0, limit);
};
