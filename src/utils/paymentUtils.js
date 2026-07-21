/**
 * Ödeme / tahsilat yardımcıları.
 *
 * Tek doğruluk kaynağı: payment ledger.
 * invoice.paymentStatus yalnızca "İptal" için saklanır; Bekliyor/Kısmi/Ödendi
 * her zaman ödemelerden hesaplanır (elle tutulmaz).
 */

export const PAYMENT_METHODS = [
  "Nakit",
  "Kredi Kartı",
  "Banka Havalesi",
  "EFT",
  "Diğer",
];

/** Tahsilat formu seçenekleri (Havale/EFT tek seçenek). */
export const PAYMENT_METHOD_OPTIONS = [
  { value: "Nakit", label: "Nakit" },
  { value: "Kredi Kartı", label: "Kredi Kartı" },
  { value: "Banka Havalesi", label: "Havale/EFT" },
  { value: "Diğer", label: "Diğer" },
];

export function formatPaymentMethodLabel(method) {
  if (method === "Banka Havalesi" || method === "EFT") return "Havale/EFT";
  return method || "Diğer";
}

/** Otomatik / hesaplanan ödeme durumları. */
export const PAYMENT_STATUSES = ["Bekliyor", "Kısmi", "Ödendi", "İptal"];

const LEGACY_STATUS_MAP = {
  Ödenmedi: "Bekliyor",
  "Kısmi Ödendi": "Kısmi",
  Ödendi: "Ödendi",
  İptal: "İptal",
  Bekliyor: "Bekliyor",
  Kısmi: "Kısmi",
};

const round2 = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export function normalizePaymentStatus(status) {
  if (!status) return "Bekliyor";
  return LEGACY_STATUS_MAP[status] || status;
}

/** Fatura iptal mi? (saklanan tek manuel durum) */
export function isInvoiceCancelled(invoice) {
  if (!invoice) return false;
  if (invoice.cancelled === true) return true;
  return normalizePaymentStatus(invoice.paymentStatus) === "İptal";
}

export function getPaymentStatusColor(status) {
  switch (normalizePaymentStatus(status)) {
    case "Ödendi":
      return "success";
    case "Kısmi":
      return "warning";
    case "İptal":
      return "error";
    case "Bekliyor":
    default:
      return "default";
  }
}

export function sumPayments(payments = []) {
  return round2(
    payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  );
}

export function groupPaymentsByInvoiceId(payments = []) {
  const map = {};

  payments.forEach((payment) => {
    const key = String(payment.invoiceId);
    if (!map[key]) map[key] = [];
    map[key].push(payment);
  });

  return map;
}

/**
 * Ledger'dan ödeme durumu — saklanan paymentStatus (İptal hariç) yok sayılır.
 */
export function computePaymentStatusFromLedger(
  invoiceTotal,
  payments = [],
  invoice = null
) {
  if (isInvoiceCancelled(invoice)) return "İptal";

  const paid = sumPayments(payments);
  const total = round2(Number(invoiceTotal) || 0);

  if (paid <= 0) return "Bekliyor";
  if (paid + 0.001 < total) return "Kısmi";
  return "Ödendi";
}

/**
 * Fatura bakiyesi — senkron; payments zaten yüklüyse kullanın.
 * Ekranlar için paymentService.calculateInvoiceBalance(invoiceId) tercih edilir.
 */
export function computeInvoiceBalance(invoice, payments = []) {
  const total = round2(Number(invoice?.total) || 0);
  const paid = sumPayments(payments);
  const status = computePaymentStatusFromLedger(total, payments, invoice);
  const remaining =
    status === "İptal" ? 0 : round2(Math.max(0, total - paid));

  return {
    total,
    paid,
    remaining,
    status,
    isUnpaid: status === "Bekliyor" || status === "Kısmi",
  };
}

/**
 * Faturalara ledger'dan hesaplanan paymentStatus ekler (görüntüleme için).
 * Saklanan eski Ödendi/Kısmi/Bekliyor değerleri üzerine yazılır.
 */
export function attachInvoiceBalances(invoices = [], payments = []) {
  const byInvoice = groupPaymentsByInvoiceId(payments);

  return invoices.map((invoice) => {
    const balance = computeInvoiceBalance(
      invoice,
      byInvoice[String(invoice.id)] || []
    );

    return {
      ...invoice,
      paymentStatus: balance.status,
      paidAmount: balance.paid,
      remainingAmount: balance.remaining,
    };
  });
}

/** @deprecated computeInvoiceBalance kullanın */
export function getInvoiceBalance(invoice, payments = []) {
  return computeInvoiceBalance(invoice, payments);
}

/** @deprecated computePaymentStatusFromLedger kullanın */
export function calculatePaymentStatus(
  invoiceTotal,
  payments = [],
  currentStatus
) {
  return computePaymentStatusFromLedger(invoiceTotal, payments, {
    paymentStatus: currentStatus,
  });
}

export function groupPaymentsByMethod(payments = []) {
  const groups = {};

  PAYMENT_METHODS.forEach((method) => {
    groups[method] = 0;
  });

  payments.forEach((payment) => {
    const method = payment.method || "Diğer";
    groups[method] = round2(
      (groups[method] || 0) + (Number(payment.amount) || 0)
    );
  });

  return groups;
}

export function sumPaymentsInRange(payments = [], { startDate, endDate } = {}) {
  return round2(
    payments
      .filter((p) => {
        if (!p.date) return false;
        if (startDate && p.date < startDate) return false;
        if (endDate && p.date > endDate) return false;
        return true;
      })
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  );
}

export function buildDailyCollectionSeries(payments = [], days = 30) {
  const end = new Date();
  end.setHours(12, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));

  const byDay = {};

  for (let i = 0; i < days; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    byDay[iso] = 0;
  }

  payments.forEach((payment) => {
    if (
      payment.date &&
      Object.prototype.hasOwnProperty.call(byDay, payment.date)
    ) {
      byDay[payment.date] = round2(
        byDay[payment.date] + (Number(payment.amount) || 0)
      );
    }
  });

  return Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date, amount }));
}
