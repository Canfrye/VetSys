import { STORAGE_KEYS } from "../utils/storage";
import apiClient from "./apiClient";
import { todayDateOnly } from "../utils/dateRange";
import {
  attachInvoiceBalances,
  computeInvoiceBalance,
  groupPaymentsByMethod,
  isInvoiceCancelled,
  sumPayments,
  sumPaymentsInRange,
} from "../utils/paymentUtils";
import { getInvoiceById, getInvoices } from "./invoiceService";
import { createAuditLog } from "./auditLogService";
import { AUDIT_ACTIONS, AUDIT_MODULES } from "../utils/auditLog";

const RESOURCE = STORAGE_KEYS.PAYMENTS;

const buildReceiptNumber = async () => {
  const payments = await apiClient.getAll(RESOURCE);
  const year = new Date().getFullYear();
  const prefix = `MAK-${year}-`;

  let maxSeq = 0;

  payments.forEach((payment) => {
    const number = payment.receiptNumber || "";
    if (!number.startsWith(prefix)) return;

    const seq = Number(number.slice(prefix.length));
    if (!Number.isNaN(seq) && seq > maxSeq) maxSeq = seq;
  });

  return `${prefix}${String(maxSeq + 1).padStart(4, "0")}`;
};

const buildPaymentPayload = (payment) => ({
  invoiceId: payment.invoiceId,
  invoiceNumber: payment.invoiceNumber || "",

  animalId: payment.animalId || "",
  animalName: payment.animalName || "",

  ownerId: payment.ownerId || "",
  ownerName: payment.ownerName || "",

  amount: Number(payment.amount) || 0,
  method: payment.method || "Nakit",
  date: payment.date || todayDateOnly(),
  note: payment.note || "",
});

/* -------------------- CRUD -------------------- */

export const getPayments = async () => {
  const payments = await apiClient.getAll(RESOURCE);

  return [...payments].sort(
    (a, b) =>
      new Date(`${b.date}T00:00:00`) - new Date(`${a.date}T00:00:00`) ||
      String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
  );
};

export const getPaymentById = (id) => apiClient.getById(RESOURCE, id);

export const getPaymentsByInvoice = async (invoiceId) => {
  const payments = await getPayments();

  return payments.filter(
    (p) => String(p.invoiceId) === String(invoiceId)
  );
};

/* -------------------- Ledger SSOT -------------------- */

/**
 * Fatura bakiyesi — payment ledger tek doğruluk kaynağı.
 */
export async function calculateInvoiceBalance(invoiceId) {
  const [invoice, payments] = await Promise.all([
    getInvoiceById(invoiceId),
    getPaymentsByInvoice(invoiceId),
  ]);

  if (!invoice) {
    return {
      total: 0,
      paid: 0,
      remaining: 0,
      status: "Bekliyor",
      isUnpaid: false,
      invoice: null,
      payments: [],
    };
  }

  return {
    ...computeInvoiceBalance(invoice, payments),
    invoice,
    payments,
  };
}

/**
 * Fatura ödeme durumu — ledger'dan hesaplanır.
 */
export async function calculateInvoicePaymentStatus(invoiceId) {
  const balance = await calculateInvoiceBalance(invoiceId);
  return balance.status;
}

/**
 * Faturaları ledger bakiyeleriyle döndürür.
 * paymentStatus alanı hesaplanan değerdir (saklanan Ödendi yok sayılır).
 */
export async function getInvoicesWithBalances() {
  const [invoices, payments] = await Promise.all([
    getInvoices(),
    getPayments(),
  ]);

  return attachInvoiceBalances(invoices, payments);
}

export const addPayment = async (payment) => {
  const amount = Number(payment.amount) || 0;

  if (amount <= 0) {
    throw new Error("Ödeme tutarı 0'dan büyük olmalıdır.");
  }

  if (!payment.invoiceId) {
    throw new Error("Fatura seçilmelidir.");
  }

  const invoice = await getInvoiceById(payment.invoiceId);

  if (!invoice) {
    throw new Error("Fatura bulunamadı.");
  }

  if (isInvoiceCancelled(invoice)) {
    throw new Error("İptal faturalara ödeme eklenemez.");
  }

  const balance = await calculateInvoiceBalance(invoice.id);

  if (amount - balance.remaining > 0.001) {
    throw new Error(
      `Kalan borç ${balance.remaining.toFixed(2)} ₺. Daha fazla ödeme alınamaz.`
    );
  }

  const receiptNumber = await buildReceiptNumber();

  const saved = await apiClient.create(RESOURCE, {
    receiptNumber,
    ...buildPaymentPayload({
      ...payment,
      invoiceNumber: invoice.invoiceNumber,
      animalId: invoice.animalId,
      animalName: invoice.animalName,
      ownerId: invoice.ownerId,
      ownerName: invoice.ownerName,
      amount,
    }),
  });

  await createAuditLog({
    module: AUDIT_MODULES.PAYMENT,
    action: AUDIT_ACTIONS.PAYMENT_RECEIVED,
    description: `Ödeme alındı: ${saved.receiptNumber} · ${amount.toFixed(2)} ₺`,
    entityId: saved.id,
    animalId: saved.animalId || "",
    ownerId: saved.ownerId || "",
    meta: {
      receiptNumber: saved.receiptNumber,
      invoiceNumber: saved.invoiceNumber,
    },
  });

  return saved;
};

export const updatePayment = async (payment) => {
  const amount = Number(payment.amount) || 0;

  if (amount <= 0) {
    throw new Error("Ödeme tutarı 0'dan büyük olmalıdır.");
  }

  return apiClient.update(RESOURCE, payment.id, {
    receiptNumber: payment.receiptNumber,
    ...buildPaymentPayload({ ...payment, amount }),
  });
};

export const deletePayment = async (id) => {
  const existing = await getPaymentById(id);
  await apiClient.remove(RESOURCE, id);

  await createAuditLog({
    module: AUDIT_MODULES.PAYMENT,
    action: AUDIT_ACTIONS.PAYMENT_DELETED,
    description: `Ödeme silindi: ${existing?.receiptNumber || id}`,
    entityId: id,
    animalId: existing?.animalId || "",
    ownerId: existing?.ownerId || "",
    meta: {
      receiptNumber: existing?.receiptNumber,
      invoiceNumber: existing?.invoiceNumber,
    },
  });
};

export const deletePaymentsByInvoiceId = (invoiceId) => {
  return apiClient.removeWhere(
    RESOURCE,
    (p) => String(p.invoiceId) === String(invoiceId)
  );
};

export const deletePaymentsByAnimalId = (animalId) => {
  return apiClient.removeWhere(
    RESOURCE,
    (p) => String(p.animalId) === String(animalId)
  );
};

export const deletePaymentsByOwnerId = (ownerId) => {
  return apiClient.removeWhere(
    RESOURCE,
    (p) => String(p.ownerId) === String(ownerId)
  );
};

export const getTodayPayments = async () => {
  const today = todayDateOnly();
  const payments = await getPayments();

  return payments.filter((p) => p.date === today);
};

export const getTodayCollection = async () => {
  const todayPayments = await getTodayPayments();
  const byMethod = groupPaymentsByMethod(todayPayments);

  return {
    payments: todayPayments,
    byMethod,
    total: sumPayments(todayPayments),
    nakit: byMethod["Nakit"] || 0,
    kart: byMethod["Kredi Kartı"] || 0,
    havale: (byMethod["Banka Havalesi"] || 0) + (byMethod["EFT"] || 0),
    diger: byMethod["Diğer"] || 0,
  };
};

export const getOutstandingInvoices = async () => {
  const invoices = await getInvoicesWithBalances();

  const outstanding = invoices
    .map((invoice) => ({
      invoice,
      total: Number(invoice.total) || 0,
      paid: invoice.paidAmount ?? 0,
      remaining: invoice.remainingAmount ?? 0,
      status: invoice.paymentStatus,
      isUnpaid:
        invoice.paymentStatus === "Bekliyor" ||
        invoice.paymentStatus === "Kısmi",
    }))
    .filter((row) => row.isUnpaid);

  const totalDebt = round2(
    outstanding.reduce((sum, row) => sum + row.remaining, 0)
  );

  const ownerIds = new Set(
    outstanding.map((row) => String(row.invoice.ownerId)).filter(Boolean)
  );

  return {
    items: outstanding,
    totalDebt,
    customerCount: ownerIds.size,
    invoiceCount: outstanding.length,
  };
};

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export const getPaymentsByAnimal = async (animalId) => {
  const payments = await getPayments();

  return payments.filter(
    (p) => String(p.animalId) === String(animalId)
  );
};

export const getLatestPayments = async (limit = 5) => {
  const payments = await getPayments();
  return payments.slice(0, limit);
};

export { sumPaymentsInRange };
