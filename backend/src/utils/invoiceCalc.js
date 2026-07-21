/**
 * Fatura toplam hesaplama mantığı — frontend'deki src/utils/invoiceCalc.js
 * ile kavramsal olarak birebir aynıdır. Toplamlar İSTEMCİDEN GELEN
 * DEĞERLERE GÜVENİLMEDEN sunucu tarafında yeniden hesaplanır (güvenlik:
 * bir istemci fatura toplamını manipüle edip düşük/yanlış tutar
 * gönderemez).
 */

const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

function calculateItemSubtotal(item) {
  const unitPrice = Number(item.unitPrice) || 0;
  const quantity = Number(item.quantity) || 0;

  return round2(unitPrice * quantity);
}

function calculateInvoiceTotals({
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

  return { subtotal, discountAmount, vatAmount, total };
}

module.exports = { round2, calculateItemSubtotal, calculateInvoiceTotals };
