/**
 * Hasta dosyası (medical record) — mevcut muayene / aşı / randevu / fatura
 * kayıtlarından zaman tüneli ve özet üretir. Yeni entity yok.
 */

import { formatCurrency } from "./invoiceCalc";
import { isInvoiceCancelled } from "./paymentUtils";
import { summarizeMedications } from "./prescriptionUtils";
import {
  formatAgeLabel,
  getAgeInMonths,
} from "./vaccineTemplates";

export const TIMELINE_KIND = {
  EXAMINATION: "examination",
  VACCINE: "vaccine",
  APPOINTMENT: "appointment",
  INVOICE: "invoice",
  CONTROL: "control",
  PRESCRIPTION: "prescription",
};

export const TIMELINE_KIND_LABEL = {
  [TIMELINE_KIND.EXAMINATION]: "Muayene",
  [TIMELINE_KIND.VACCINE]: "Aşı",
  [TIMELINE_KIND.APPOINTMENT]: "Randevu",
  [TIMELINE_KIND.INVOICE]: "Fatura",
  [TIMELINE_KIND.CONTROL]: "Kontrol",
  [TIMELINE_KIND.PRESCRIPTION]: "Reçete",
};

/** animal.note satırlarını klinik not listesine çevirir. */
export function parseClinicalNotes(note) {
  if (!note || typeof note !== "string") return [];

  return note
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function serializeClinicalNotes(notes = []) {
  return notes
    .map((n) => String(n || "").trim())
    .filter(Boolean)
    .join("\n");
}

export function buildWeightSeries(examinations = []) {
  const points = examinations
    .filter((e) => e.weight != null && e.weight !== "" && !Number.isNaN(Number(e.weight)))
    .map((e) => ({
      date: e.examinationDate || "",
      weight: Number(e.weight),
      id: e.id,
    }))
    .filter((p) => p.date)
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    labels: points.map((p) => p.date),
    data: points.map((p) => p.weight),
    points,
  };
}

function sortNewestFirst(a, b) {
  const dateCmp = (b.date || "").localeCompare(a.date || "");
  if (dateCmp !== 0) return dateCmp;
  return (b.time || "").localeCompare(a.time || "");
}

/**
 * Kronolojik hasta zaman tüneli (yeniden eskiye).
 * Kontroller: muayenedeki controlDate ayrı olay olarak eklenir.
 */
export function buildMedicalTimeline({
  examinations = [],
  vaccines = [],
  appointments = [],
  invoices = [],
  prescriptions = [],
} = {}) {
  const items = [];

  examinations.forEach((exam) => {
    items.push({
      id: `exam-${exam.id}`,
      sourceId: exam.id,
      kind: TIMELINE_KIND.EXAMINATION,
      kindLabel: TIMELINE_KIND_LABEL[TIMELINE_KIND.EXAMINATION],
      date: exam.examinationDate || "",
      time: "",
      title: exam.diagnosis || exam.complaint || "Muayene",
      description: exam.treatment || exam.findings || exam.notes || "",
      veterinarian: exam.veterinarian || "",
      source: exam,
      attachmentCount: Array.isArray(exam.attachments)
        ? exam.attachments.length
        : 0,
    });

    if (exam.controlDate) {
      items.push({
        id: `control-${exam.id}`,
        sourceId: exam.id,
        kind: TIMELINE_KIND.CONTROL,
        kindLabel: TIMELINE_KIND_LABEL[TIMELINE_KIND.CONTROL],
        date: exam.controlDate,
        time: "",
        title: exam.diagnosis || "Kontrol",
        description: exam.notes || exam.treatment || "",
        veterinarian: exam.veterinarian || "",
        source: exam,
        attachmentCount: 0,
      });
    }
  });

  vaccines.forEach((vaccine) => {
    items.push({
      id: `vaccine-${vaccine.id}`,
      sourceId: vaccine.id,
      kind: TIMELINE_KIND.VACCINE,
      kindLabel: TIMELINE_KIND_LABEL[TIMELINE_KIND.VACCINE],
      date: vaccine.applicationDate || "",
      time: "",
      title: vaccine.vaccineName || "Aşı",
      description: [
        vaccine.nextDoseDate ? `Sonraki: ${vaccine.nextDoseDate}` : "",
        vaccine.notes || "",
      ]
        .filter(Boolean)
        .join(" · "),
      veterinarian: vaccine.veterinarian || "",
      source: vaccine,
      attachmentCount: 0,
    });
  });

  appointments.forEach((appointment) => {
    items.push({
      id: `appt-${appointment.id}`,
      sourceId: appointment.id,
      kind: TIMELINE_KIND.APPOINTMENT,
      kindLabel: TIMELINE_KIND_LABEL[TIMELINE_KIND.APPOINTMENT],
      date: appointment.date || "",
      time: appointment.time || "",
      title: appointment.reason || "Randevu",
      description: [
        appointment.status || "",
        appointment.note || "",
      ]
        .filter(Boolean)
        .join(" · "),
      veterinarian: appointment.veterinarian || "",
      source: appointment,
      attachmentCount: 0,
    });
  });

  invoices.forEach((invoice) => {
    items.push({
      id: `invoice-${invoice.id}`,
      sourceId: invoice.id,
      kind: TIMELINE_KIND.INVOICE,
      kindLabel: TIMELINE_KIND_LABEL[TIMELINE_KIND.INVOICE],
      date: invoice.date || "",
      time: "",
      title: invoice.invoiceNumber || "Fatura",
      description: [
        invoice.paymentStatus || "",
        formatCurrency(invoice.total || 0),
        invoice.note || "",
      ]
        .filter(Boolean)
        .join(" · "),
      veterinarian: "",
      source: invoice,
      attachmentCount: 0,
    });
  });

  prescriptions.forEach((prescription) => {
    items.push({
      id: `prescription-${prescription.id}`,
      sourceId: prescription.id,
      kind: TIMELINE_KIND.PRESCRIPTION,
      kindLabel: TIMELINE_KIND_LABEL[TIMELINE_KIND.PRESCRIPTION],
      date: prescription.date || "",
      time: "",
      title: prescription.prescriptionNumber || "Reçete",
      description: [
        prescription.diagnosis || "",
        summarizeMedications(prescription.items),
      ]
        .filter(Boolean)
        .join(" · "),
      veterinarian: prescription.veterinarian || "",
      source: prescription,
      attachmentCount: 0,
    });
  });

  return items.filter((item) => item.date).sort(sortNewestFirst);
}

export function buildAnimalSummary(
  animal,
  {
    examinations = [],
    vaccines = [],
    appointments = [],
    invoices = [],
  } = {}
) {
  const ageInMonths = getAgeInMonths(animal?.birthDate);
  const sortedExams = [...examinations].sort((a, b) =>
    (b.examinationDate || "").localeCompare(a.examinationDate || "")
  );
  const sortedVaccines = [...vaccines].sort((a, b) =>
    (b.applicationDate || "").localeCompare(a.applicationDate || "")
  );

  const nextVaccine = [...vaccines]
    .filter((v) => v.nextDoseDate)
    .sort((a, b) => a.nextDoseDate.localeCompare(b.nextDoseDate))[0];

  const nextControl = [...examinations]
    .filter((e) => e.controlDate)
    .sort((a, b) => a.controlDate.localeCompare(b.controlDate))[0];

  const latestWeightExam = sortedExams.find(
    (e) => e.weight != null && e.weight !== "" && !Number.isNaN(Number(e.weight))
  );

  const activeInvoices = invoices.filter(
    (inv) => !isInvoiceCancelled(inv)
  );

  const invoiceTotal = activeInvoices.reduce(
    (sum, inv) => sum + (Number(inv.total) || 0),
    0
  );

  const visitCount =
    examinations.length +
    appointments.filter((a) => a.status !== "İptal").length;

  return {
    ageLabel: formatAgeLabel(ageInMonths),
    breed: animal?.breed || "-",
    weight:
      animal?.weight ||
      (latestWeightExam ? String(latestWeightExam.weight) : "-"),
    lastExamination: sortedExams[0]?.examinationDate || "-",
    lastVaccine: sortedVaccines[0]?.applicationDate || "-",
    nextVaccine: nextVaccine?.nextDoseDate || "-",
    nextVaccineName: nextVaccine?.vaccineName || "",
    nextControl: nextControl?.controlDate || "-",
    visitCount,
    invoiceTotal,
    invoiceCount: activeInvoices.length,
    clinicalNotes: parseClinicalNotes(animal?.note),
  };
}

/** Dashboard uyarısı için notu olan hayvanlar. */
export function filterAnimalsWithClinicalNotes(animals = []) {
  return animals
    .map((animal) => ({
      animal,
      notes: parseClinicalNotes(animal.note),
    }))
    .filter((entry) => entry.notes.length > 0);
}

export const MAX_ATTACHMENT_BYTES = 900_000;

export function createAttachmentFromFile(file, dataUrl) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    dataUrl,
    uploadedAt: new Date().toISOString(),
  };
}
