import { STORAGE_KEYS } from "../utils/storage";
import apiClient, { generateId } from "./apiClient";
import {
  calculateInvoiceTotals,
  sumInvoiceRevenueInRange,
} from "../utils/invoiceCalc";
import { getPresetRange, todayDateOnly } from "../utils/dateRange";
import { isInvoiceCancelled } from "../utils/paymentUtils";
import { createAuditLog } from "./auditLogService";
import { AUDIT_ACTIONS, AUDIT_MODULES } from "../utils/auditLog";

const RESOURCE = STORAGE_KEYS.INVOICES;

const buildInvoiceNumber = async () => {
  const invoices = await apiClient.getAll(RESOURCE);
  const year = new Date().getFullYear();
  const prefix = `FAT-${year}-`;

  let maxSeq = 0;

  invoices.forEach((invoice) => {
    const number = invoice.invoiceNumber || "";
    if (!number.startsWith(prefix)) return;

    const seq = Number(number.slice(prefix.length));
    if (!Number.isNaN(seq) && seq > maxSeq) maxSeq = seq;
  });

  return `${prefix}${String(maxSeq + 1).padStart(4, "0")}`;
};

const normalizeItems = (items = []) => {
  return items.map((item) => ({
    id: item.id || generateId(),
    type: item.type,
    description: item.description || "",
    unitPrice: Number(item.unitPrice) || 0,
    quantity: Number(item.quantity) || 1,
    purchasePrice: Number(item.purchasePrice) || 0,
    stockId: item.stockId || "",
    priceSource: item.priceSource === "manual" ? "manual" : item.priceSource === "auto" ? "auto" : "",
    sourceRef: item.sourceRef || "",
    subtotal:
      (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1),
  }));
};

const buildInvoicePayload = (invoice) => {
  const items = normalizeItems(invoice.items);

  const totals = calculateInvoiceTotals({
    items,
    discountType: invoice.discountType || "none",
    discountValue: Number(invoice.discountValue) || 0,
    vatEnabled: Boolean(invoice.vatEnabled),
    vatRate: Number(invoice.vatRate) || 0,
  });

  return {
    animalId: invoice.animalId,
    animalName: invoice.animalName,

    ownerId: invoice.ownerId,
    ownerName: invoice.ownerName,

    date: invoice.date || todayDateOnly(),

    items,

    discountType: invoice.discountType || "none",
    discountValue: Number(invoice.discountValue) || 0,

    vatEnabled: Boolean(invoice.vatEnabled),
    vatRate: Number(invoice.vatRate) || 0,

    // Yalnızca İptal saklanır. Bekliyor/Kısmi/Ödendi ledger'dan hesaplanır.
    paymentStatus: isInvoiceCancelled(invoice) ? "İptal" : "",
    cancelled: isInvoiceCancelled(invoice),

    note: invoice.note || "",

    ...totals,
  };
};

/* -------------------- CRUD -------------------- */

export const getInvoices = async () => {
  const invoices = await apiClient.getAll(RESOURCE);

  return [...invoices].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
};

export const getInvoiceById = (id) => apiClient.getById(RESOURCE, id);

export const addInvoice = async (invoice) => {
  const invoiceNumber = await buildInvoiceNumber();

  const saved = await apiClient.create(RESOURCE, {
    invoiceNumber,
    ...buildInvoicePayload(invoice),
  });

  await createAuditLog({
    module: AUDIT_MODULES.INVOICE,
    action: AUDIT_ACTIONS.SAVE,
    description: `Fatura kaydedildi: ${saved.invoiceNumber} (${saved.animalName || ""})`,
    entityId: saved.id,
    animalId: saved.animalId || "",
    ownerId: saved.ownerId || "",
    meta: { invoiceNumber: saved.invoiceNumber },
  });

  return saved;
};

export const updateInvoice = async (invoice) => {
  const previous = await getInvoiceById(invoice.id);
  const saved = await apiClient.update(RESOURCE, invoice.id, {
    invoiceNumber: invoice.invoiceNumber,
    ...buildInvoicePayload(invoice),
  });

  if (!saved) return saved;

  const wasCancelled = previous && isInvoiceCancelled(previous);
  const nowCancelled = isInvoiceCancelled(saved);

  if (!wasCancelled && nowCancelled) {
    await createAuditLog({
      module: AUDIT_MODULES.INVOICE,
      action: AUDIT_ACTIONS.CANCEL,
      description: `Fatura iptal edildi: ${saved.invoiceNumber}`,
      entityId: saved.id,
      animalId: saved.animalId || "",
      ownerId: saved.ownerId || "",
      meta: { invoiceNumber: saved.invoiceNumber },
    });
  } else {
    await createAuditLog({
      module: AUDIT_MODULES.INVOICE,
      action: AUDIT_ACTIONS.UPDATE,
      description: `Fatura düzenlendi: ${saved.invoiceNumber}`,
      entityId: saved.id,
      animalId: saved.animalId || "",
      ownerId: saved.ownerId || "",
      meta: { invoiceNumber: saved.invoiceNumber },
    });
  }

  return saved;
};

export const deleteInvoice = async (id) => {
  const existing = await getInvoiceById(id);

  // Ödeme kaydı temizliği — paymentService import edilmez (döngüsel bağımlılık yok).
  await apiClient.removeWhere(
    STORAGE_KEYS.PAYMENTS,
    (payment) => String(payment.invoiceId) === String(id)
  );

  await apiClient.remove(RESOURCE, id);

  await createAuditLog({
    module: AUDIT_MODULES.INVOICE,
    action: AUDIT_ACTIONS.DELETE,
    description: `Fatura silindi: ${existing?.invoiceNumber || id}`,
    entityId: id,
    animalId: existing?.animalId || "",
    ownerId: existing?.ownerId || "",
    meta: { invoiceNumber: existing?.invoiceNumber },
  });
};

export async function logInvoiceDraftCreated(draft = {}) {
  await createAuditLog({
    module: AUDIT_MODULES.INVOICE,
    action: AUDIT_ACTIONS.DRAFT,
    description: `Fatura taslağı oluşturuldu: ${draft.animalName || ""}`.trim(),
    entityId: draft.id || "",
    animalId: draft.animalId || "",
    ownerId: draft.ownerId || "",
  });
}

export const deleteInvoicesByAnimalId = (animalId) => {
  return apiClient.removeWhere(
    RESOURCE,
    (invoice) => String(invoice.animalId) === String(animalId)
  );
};

export const deleteInvoicesByOwnerId = (ownerId) => {
  return apiClient.removeWhere(
    RESOURCE,
    (invoice) => String(invoice.ownerId) === String(ownerId)
  );
};

export const syncOwnerName = (ownerId, ownerName) => {
  return apiClient.updateWhere(
    RESOURCE,
    (invoice) => String(invoice.ownerId) === String(ownerId),
    () => ({ ownerName })
  );
};

export const syncAnimalName = (animalId, animalName) => {
  return apiClient.updateWhere(
    RESOURCE,
    (invoice) => String(invoice.animalId) === String(animalId),
    () => ({ animalName })
  );
};

export const syncOwnerForAnimal = (animalId, ownerId, ownerName) => {
  return apiClient.updateWhere(
    RESOURCE,
    (invoice) => String(invoice.animalId) === String(animalId),
    () => ({ ownerId, ownerName })
  );
};

export const getInvoicesByAnimal = async (animalId) => {
  const invoices = await getInvoices();

  return invoices.filter(
    (invoice) => String(invoice.animalId) === String(animalId)
  );
};

export const getInvoiceCount = async () => {
  const invoices = await apiClient.getAll(RESOURCE);
  return invoices.length;
};

/* -------------------- Ciro (Dashboard) -------------------- */

export const getTodayRevenue = async () => {
  const invoices = await apiClient.getAll(RESOURCE);

  return sumInvoiceRevenueInRange(invoices, getPresetRange("today"));
};

export const getMonthRevenue = async () => {
  const invoices = await apiClient.getAll(RESOURCE);

  return sumInvoiceRevenueInRange(invoices, getPresetRange("month"));
};
