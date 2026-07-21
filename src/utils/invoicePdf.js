import autoTable from "jspdf-autotable";

import { formatCurrency } from "./invoiceCalc";
import {
  applyPdfFont,
  createPdf,
  setPdfMetadata,
  withUnicodeTableOptions,
} from "./pdfFont";
import { drawClinicHeader } from "./pdfClinicHeader";

export async function generateInvoicePdf(invoice, settings = {}) {
  const doc = await createPdf();
  setPdfMetadata(doc, {
    title: `Fatura — ${invoice.invoiceNumber || ""}`,
    subject: "Fatura",
  });

  let y = drawClinicHeader(doc, settings);

  applyPdfFont(doc);
  doc.setFontSize(14);
  doc.text(`Fatura No: ${invoice.invoiceNumber}`, 14, y);
  y += 7;

  doc.setFontSize(10);
  doc.text(`Tarih: ${invoice.date}`, 14, y);
  y += 6;
  doc.text(`Müşteri: ${invoice.ownerName || "-"}`, 14, y);
  y += 6;
  doc.text(`Hayvan: ${invoice.animalName || "-"}`, 14, y);
  y += 6;
  doc.text(`Ödeme Durumu: ${invoice.paymentStatus || "-"}`, 14, y);
  y += 10;

  autoTable(
    doc,
    withUnicodeTableOptions({
      startY: y,
      head: [["Tür", "Açıklama", "Birim Fiyat", "Adet", "Ara Toplam"]],
      body: invoice.items.map((item) => [
        item.type,
        item.description || "-",
        formatCurrency(item.unitPrice),
        item.quantity,
        formatCurrency(item.subtotal),
      ]),
    })
  );

  const summaryRows = [["Ara Toplam", formatCurrency(invoice.subtotal)]];

  if (invoice.discountAmount > 0) {
    summaryRows.push([
      "İndirim",
      `- ${formatCurrency(invoice.discountAmount)}`,
    ]);
  }

  if (invoice.vatEnabled) {
    summaryRows.push([
      `KDV (%${invoice.vatRate})`,
      formatCurrency(invoice.vatAmount),
    ]);
  }

  summaryRows.push(["Genel Toplam", formatCurrency(invoice.total)]);

  autoTable(
    doc,
    withUnicodeTableOptions({
      startY: doc.lastAutoTable.finalY + 8,
      theme: "plain",
      body: summaryRows,
      styles: { fontSize: 11 },
      columnStyles: { 0: { fontStyle: "bold" }, 1: { halign: "right" } },
    })
  );

  if (invoice.note) {
    applyPdfFont(doc);
    doc.setFontSize(10);
    doc.text(`Not: ${invoice.note}`, 14, doc.lastAutoTable.finalY + 12);
  }

  applyPdfFont(doc);
  doc.setFontSize(9);
  doc.text(
    settings.footer || "VetSys Veteriner Klinik Yönetim Sistemi",
    14,
    doc.lastAutoTable.finalY + 24
  );

  doc.save(`${invoice.invoiceNumber || "Fatura"}.pdf`);
}
