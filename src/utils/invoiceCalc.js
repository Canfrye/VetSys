/**
 * Fatura hesaplama yardımcıları — hem InvoiceForm (canlı önizleme) hem de
 * invoiceService (kalıcı kayıt) tarafından kullanılır, tek doğruluk kaynağı
 * olması için hesaplama mantığı burada tekilleştirilmiştir.
 */

import { isDateInRange } from "./dateRange";
import { isInvoiceCancelled } from "./paymentUtils";

export const DISCOUNT_TYPES = [
  { value: "none", label: "İndirim Yok" },
  { value: "amount", label: "Tutar (₺)" },
  { value: "percent", label: "Yüzde (%)" },
];

export const VAT_RATE_OPTIONS = [1, 8, 10, 20];

const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export function calculateItemSubtotal(item) {
  const unitPrice = Number(item.unitPrice) || 0;
  const quantity = Number(item.quantity) || 0;

  return round2(unitPrice * quantity);
}

export function calculateInvoiceTotals({
  items = [],
  discountType = "none",
  discountValue = 0,
  vatEnabled = false,
  vatRate = 0,
}) {
  const subtotal = round2(
    items.reduce((sum, item) => sum + calculateItemSubtotal(item), 0)
  );

  let discountAmount = 0;

  if (discountType === "percent") {
    discountAmount = subtotal * ((Number(discountValue) || 0) / 100);
  } else if (discountType === "amount") {
    discountAmount = Number(discountValue) || 0;
  }

  discountAmount = round2(Math.min(Math.max(discountAmount, 0), subtotal));

  const taxableAmount = subtotal - discountAmount;

  const vatAmount = vatEnabled
    ? round2(taxableAmount * ((Number(vatRate) || 0) / 100))
    : 0;

  const total = round2(taxableAmount + vatAmount);

  return {
    subtotal,
    discountAmount,
    vatAmount,
    total,
  };
}

/**
 * Verilen fatura listesinden, tarih aralığındaki (iptal hariç) faturaların
 * toplam cirosunu hesaplar. invoiceService (Dashboard'ın günlük/aylık ciro
 * kartları) ve analyticsService (Reports'un esnek tarih aralığı analizi)
 * bu tek fonksiyonu paylaşır — ciro hesaplama mantığı tek yerde durur.
 */
export function sumInvoiceRevenueInRange(invoices = [], { startDate, endDate } = {}) {
  const total = invoices
    .filter(
      (invoice) =>
        !isInvoiceCancelled(invoice) &&
        isDateInRange(invoice.date, startDate, endDate)
    )
    .reduce((sum, invoice) => sum + (Number(invoice.total) || 0), 0);

  return round2(total);
}

export function formatCurrency(value) {
  return `${(Number(value) || 0).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ₺`;
}
