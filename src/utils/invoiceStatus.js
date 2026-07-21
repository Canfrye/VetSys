import {
  PAYMENT_STATUSES,
  getPaymentStatusColor,
  isInvoiceCancelled,
  normalizePaymentStatus,
} from "./paymentUtils";

export const INVOICE_ITEM_TYPES = ["Muayene", "Aşı", "Tedavi", "Ürün"];

/** Hesaplanan tahsilat durumları (ledger SSOT). */
export const INVOICE_PAYMENT_STATUSES = PAYMENT_STATUSES;

export function getInvoicePaymentStatusColor(status) {
  return getPaymentStatusColor(status);
}

export { normalizePaymentStatus, isInvoiceCancelled };
