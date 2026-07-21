import autoTable from "jspdf-autotable";

import { formatCurrency } from "./invoiceCalc";
import {
  applyPdfFont,
  createPdf,
  setPdfMetadata,
  withUnicodeTableOptions,
} from "./pdfFont";
import { drawClinicHeader } from "./pdfClinicHeader";

/**
 * Tahsilat makbuzu PDF çıktısı.
 */
export async function generatePaymentReceiptPdf(
  payment,
  settings = {},
  invoice = null
) {
  const doc = await createPdf();
  setPdfMetadata(doc, {
    title: `Tahsilat Makbuzu — ${payment.receiptNumber || ""}`,
    subject: "Tahsilat Makbuzu",
  });

  let y = drawClinicHeader(doc, settings);

  applyPdfFont(doc);
  doc.setFontSize(14);
  doc.text("TAHSİLAT MAKBUZU", 14, y);
  y += 10;

  doc.setFontSize(10);
  doc.text(`Makbuz No: ${payment.receiptNumber || "-"}`, 14, y);
  y += 6;
  doc.text(`Tarih: ${payment.date || "-"}`, 14, y);
  y += 6;
  doc.text(`Fatura No: ${payment.invoiceNumber || "-"}`, 14, y);
  y += 6;
  doc.text(`Müşteri: ${payment.ownerName || "-"}`, 14, y);
  y += 6;
  doc.text(`Hayvan: ${payment.animalName || "-"}`, 14, y);
  y += 8;

  autoTable(
    doc,
    withUnicodeTableOptions({
      startY: y,
      head: [["Ödeme Yöntemi", "Tutar", "Not"]],
      body: [
        [
          payment.method || "-",
          formatCurrency(payment.amount),
          payment.note || "-",
        ],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [5, 150, 105] },
    })
  );

  y = doc.lastAutoTable.finalY + 10;

  if (invoice) {
    applyPdfFont(doc);
    doc.setFontSize(10);
    doc.text(`Fatura Toplamı: ${formatCurrency(invoice.total)}`, 14, y);
    y += 6;
    doc.text(`Ödeme Durumu: ${invoice.paymentStatus || "-"}`, 14, y);
    y += 10;
  }

  applyPdfFont(doc);
  doc.setFontSize(9);
  doc.text(
    settings.footer || "VetSys Veteriner Klinik Yönetim Sistemi",
    14,
    y + 6
  );

  doc.save(`${payment.receiptNumber || "Makbuz"}.pdf`);
}
