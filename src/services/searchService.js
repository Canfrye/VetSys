import { getCustomers } from "./customerService";
import { getAnimals } from "./animalService";
import { getAppointments } from "./appointmentService";
import { getExaminations, getOverdueControls } from "./examinationService";
import { getPrescriptions } from "./prescriptionService";
import { getInvoices } from "./invoiceService";
import { getPayments } from "./paymentService";
import { getStock } from "./stockService";
import { getSettings } from "./settingsService";
import { getVaccines, getOverdueVaccines } from "./vaccineService";
import { getVisibleAuditLogs } from "./auditLogService";
import { ROLES } from "../utils/roles";
import { normalizeServiceFees } from "../utils/serviceCatalog";
import { buildReminderCenter } from "../utils/reminderCenter";
import { normalizeReminderStatuses } from "../utils/reminderStatus";
import { restoreSession } from "./authService";
import { apiRequest, USE_API } from "./apiClient";

/**
 * Rol bazlı arama sonuç filtreleri — Sidebar/route matrisiyle aynı ayrım.
 */
const ROLE_ALLOWED_TYPES = {
  [ROLES.ADMIN]: [
    "customer",
    "animal",
    "vaccine",
    "appointment",
    "examination",
    "prescription",
    "invoice",
    "payment",
    "stock",
    "service",
    "reminder",
    "audit",
  ],
  [ROLES.VETERINARIAN]: [
    "customer",
    "animal",
    "vaccine",
    "appointment",
    "examination",
    "prescription",
    "invoice",
    "payment",
    "stock",
    "service",
    "reminder",
    "audit",
  ],
  [ROLES.RECEPTION]: [
    "customer",
    "animal",
    "appointment",
    "prescription",
    "invoice",
    "payment",
    "service",
    "stock",
    "vaccine",
    "reminder",
    "audit",
  ],
};

export async function globalSearch(text, role = null) {
  text = text.toLowerCase().trim();

  if (!text) return [];

  if (USE_API) {
    const results = await apiRequest(
      "GET",
      `/search?q=${encodeURIComponent(text)}`
    );
    const list = Array.isArray(results) ? results : [];
    const allowed = ROLE_ALLOWED_TYPES[role];
    if (!allowed) return list;
    return list.filter((item) => allowed.includes(item.type));
  }

  const sessionUser = await restoreSession();

  const [
    customers,
    animals,
    vaccines,
    appointments,
    examinations,
    prescriptions,
    invoices,
    payments,
    stockItems,
    settings,
    overdueVaccines,
    overdueControls,
    auditLogs,
  ] = await Promise.all([
    getCustomers(),
    getAnimals(),
    getVaccines(),
    getAppointments(),
    getExaminations(),
    getPrescriptions(),
    getInvoices(),
    getPayments(),
    getStock(),
    getSettings(),
    getOverdueVaccines(),
    getOverdueControls(),
    getVisibleAuditLogs(sessionUser),
  ]);

  const results = [];

  customers.forEach((customer) => {
    if (
      `${customer.ad || ""} ${customer.soyad || ""}`
        .toLowerCase()
        .includes(text) ||
      (customer.telefon || "").toLowerCase().includes(text)
    ) {
      results.push({
        id: customer.id,
        type: "customer",
        title: `${customer.ad} ${customer.soyad}`,
        subtitle: customer.telefon,
      });
    }
  });

  animals.forEach((animal) => {
    if (
      (animal.name || "").toLowerCase().includes(text) ||
      (animal.microchipNo || "").toLowerCase().includes(text) ||
      (animal.ownerName || "").toLowerCase().includes(text) ||
      (animal.ownerType || "").toLowerCase().includes(text)
    ) {
      results.push({
        id: animal.id,
        type: "animal",
        title: animal.name,
        subtitle: animal.ownerName || animal.ownerType || "",
      });
    }
  });

  vaccines.forEach((vaccine) => {
    if ((vaccine.vaccineName || "").toLowerCase().includes(text)) {
      results.push({
        id: vaccine.id,
        type: "vaccine",
        title: vaccine.vaccineName,
        subtitle: vaccine.animalName,
      });
    }
  });

  appointments.forEach((appointment) => {
    if ((appointment.reason || "").toLowerCase().includes(text)) {
      results.push({
        id: appointment.id,
        type: "appointment",
        title: appointment.reason || "Randevu",
        subtitle: appointment.animalName,
      });
    }
  });

  examinations.forEach((exam) => {
    if (
      (exam.diagnosis || "").toLowerCase().includes(text) ||
      (exam.examType || "").toLowerCase().includes(text)
    ) {
      results.push({
        id: exam.id,
        type: "examination",
        title: exam.diagnosis || exam.examType || "Muayene",
        subtitle: exam.animalName,
      });
    }
  });

  prescriptions.forEach((prescription) => {
    const medicationText = (prescription.items || [])
      .map((item) => item.medicationName || "")
      .join(" ")
      .toLowerCase();

    const haystack = [
      prescription.prescriptionNumber,
      prescription.animalName,
      prescription.ownerName,
      prescription.veterinarian,
      prescription.diagnosis,
      medicationText,
    ]
      .join(" ")
      .toLowerCase();

    if (haystack.includes(text)) {
      results.push({
        id: prescription.id,
        type: "prescription",
        title: prescription.prescriptionNumber || "Reçete",
        subtitle: `${prescription.animalName || "-"} · ${prescription.diagnosis || "Tanı yok"}`,
      });
    }
  });

  invoices.forEach((invoice) => {
    const itemText = (invoice.items || [])
      .map((item) => `${item.description || ""} ${item.type || ""}`)
      .join(" ")
      .toLowerCase();

    const haystack = [
      invoice.invoiceNumber,
      invoice.animalName,
      invoice.ownerName,
      itemText,
    ]
      .join(" ")
      .toLowerCase();

    if (haystack.includes(text)) {
      const matchedLine = (invoice.items || []).find((item) =>
        `${item.description || ""} ${item.type || ""}`
          .toLowerCase()
          .includes(text)
      );

      results.push({
        id: invoice.id,
        type: "invoice",
        title: invoice.invoiceNumber || "Fatura",
        subtitle: matchedLine
          ? `${matchedLine.description} · ${invoice.animalName || "-"}`
          : `${invoice.ownerName || "-"} · ${invoice.animalName || "-"}`,
      });
    }
  });

  payments.forEach((payment) => {
    const haystack = [
      payment.receiptNumber,
      payment.invoiceNumber,
      payment.animalName,
      payment.ownerName,
    ]
      .join(" ")
      .toLowerCase();

    if (haystack.includes(text)) {
      results.push({
        id: payment.id,
        type: "payment",
        title: payment.receiptNumber || "Makbuz",
        subtitle: `${payment.ownerName || "-"} · ${payment.invoiceNumber || "-"}`,
      });
    }
  });

  stockItems.forEach((item) => {
    const haystack = [
      item.name,
      item.lotNo,
      item.supplierName || item.supplier,
      item.category,
    ]
      .join(" ")
      .toLowerCase();

    if (haystack.includes(text)) {
      results.push({
        id: item.id,
        type: "stock",
        title: item.name || "Stok",
        subtitle: [
          item.lotNo ? `Lot ${item.lotNo}` : null,
          item.supplierName || item.supplier || null,
          `${item.quantity ?? 0} ${item.unit || ""}`.trim(),
        ]
          .filter(Boolean)
          .join(" · "),
      });
    }
  });

  normalizeServiceFees(settings?.serviceFees).forEach((service) => {
    if ((service.name || "").toLowerCase().includes(text)) {
      results.push({
        id: service.id,
        type: "service",
        title: service.name,
        subtitle: `Hizmet · ${service.defaultPrice} ₺`,
      });
    }
  });

  const reminderCenter = buildReminderCenter({
    vaccines,
    appointments,
    controls: examinations.filter((e) => e.controlDate),
    overdueVaccines,
    overdueControls,
    customers,
    reminderStatuses: normalizeReminderStatuses(settings.reminderStatuses),
  });

  reminderCenter.all.forEach((item) => {
    const haystack = [
      item.animalName,
      item.ownerName,
      item.phone,
      item.title,
      item.kindLabel,
      item.veterinarian,
    ]
      .join(" ")
      .toLowerCase();

    if (haystack.includes(text)) {
      results.push({
        id: item.id,
        type: "reminder",
        title: `${item.kindLabel}: ${item.title}`,
        subtitle: `${item.animalName} · ${item.ownerName} · ${item.date || ""}`,
      });
    }
  });

  auditLogs.forEach((log) => {
    const haystack = [
      log.description,
      log.module,
      log.action,
      log.userName,
      log.entityId,
      log.meta?.invoiceNumber,
      log.meta?.prescriptionNumber,
      log.meta?.receiptNumber,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (haystack.includes(text)) {
      results.push({
        id: log.id,
        type: "audit",
        title: log.description || `${log.module} ${log.action}`,
        subtitle: `${log.date || ""} ${log.time || ""} · ${log.userName || ""} · ${log.module || ""}`,
      });
    }
  });

  const allowed = ROLE_ALLOWED_TYPES[role];

  if (!allowed) return results;

  return results.filter((item) => allowed.includes(item.type));
}
