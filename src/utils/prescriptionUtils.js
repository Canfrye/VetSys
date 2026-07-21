/**
 * Reçete yardımcıları — sıklık/süre seçenekleri ve satır normalizasyonu.
 * invoiceCalc / medicalRecord ile aynı "tek doğruluk kaynağı" yaklaşımı.
 */

import { generateId } from "../services/apiClient";

export const PRESCRIPTION_FREQUENCIES = [
  "Günde 1",
  "Günde 2",
  "Günde 3",
  "Sabah",
  "Akşam",
  "Sabah/Akşam",
  "Gerektiğinde",
];

export const PRESCRIPTION_DURATIONS = [
  "3 Gün",
  "5 Gün",
  "7 Gün",
  "10 Gün",
  "14 Gün",
  "21 Gün",
  "30 Gün",
];

export function createEmptyPrescriptionItem() {
  return {
    id: generateId(),
    medicationName: "",
    dose: "",
    quantity: 1,
    frequency: "Günde 2",
    duration: "7 Gün",
    instructions: "",
  };
}

export function normalizePrescriptionItems(items = []) {
  return items.map((item) => ({
    id: item.id || generateId(),
    medicationName: String(item.medicationName || "").trim(),
    dose: String(item.dose || "").trim(),
    quantity: Math.max(1, Number(item.quantity) || 1),
    frequency: item.frequency || "",
    duration: item.duration || "",
    instructions: String(item.instructions || "").trim(),
  }));
}

/**
 * @returns {{ valid: boolean, error?: string, items?: object[] }}
 */
export function validatePrescriptionItems(items = []) {
  const normalized = normalizePrescriptionItems(items);

  if (normalized.length === 0) {
    return { valid: false, error: "En az bir ilaç satırı ekleyin." };
  }

  for (let i = 0; i < normalized.length; i += 1) {
    const row = normalized[i];

    if (!row.medicationName) {
      return {
        valid: false,
        error: `${i + 1}. satırda ilaç adı boş olamaz.`,
      };
    }

    if (!row.dose) {
      return {
        valid: false,
        error: `${i + 1}. satırda doz boş olamaz.`,
      };
    }
  }

  return { valid: true, items: normalized };
}

export function summarizeMedications(items = [], limit = 3) {
  const names = normalizePrescriptionItems(items)
    .map((i) => i.medicationName)
    .filter(Boolean);

  if (names.length === 0) return "-";

  if (names.length <= limit) return names.join(", ");

  return `${names.slice(0, limit).join(", ")} +${names.length - limit}`;
}
