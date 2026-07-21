import autoTable from "jspdf-autotable";

import { normalizeStockItem } from "./stockUtils";
import { formatCurrency } from "./invoiceCalc";
import {
  applyPdfFont,
  createPdf,
  setPdfMetadata,
  withUnicodeTableOptions,
} from "./pdfFont";
import { drawClinicHeader } from "./pdfClinicHeader";

/**
 * Stok raporu PDF — ürün, lot, SKT, fiyatlar, mevcut, minimum, tedarikçi.
 */
export async function generateStockReportPdf(stockItems = [], settings = {}) {
  const doc = await createPdf({ orientation: "landscape" });
  setPdfMetadata(doc, {
    title: "Stok Raporu",
    subject: "Stok Raporu",
  });

  const items = stockItems.map(normalizeStockItem);

  let y = drawClinicHeader(doc, settings);

  applyPdfFont(doc);
  doc.setFontSize(14);
  doc.text("STOK RAPORU", 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.text(`Tarih: ${new Date().toLocaleDateString("tr-TR")}`, 14, y);
  y += 6;
  doc.text(`Ürün sayısı: ${items.length}`, 14, y);
  y += 8;

  autoTable(
    doc,
    withUnicodeTableOptions({
      startY: y,
      head: [
        [
          "Ürün",
          "Lot",
          "SKT",
          "Mevcut",
          "Min",
          "Alış",
          "Satış",
          "Birim",
          "Tedarikçi",
        ],
      ],
      body: items.map((item) => [
        item.name || "-",
        item.lotNo || "-",
        item.expiryDate || "-",
        String(item.quantity ?? 0),
        String(item.minQuantity ?? 0),
        formatCurrency(item.purchasePrice || 0),
        formatCurrency(item.salePrice || 0),
        item.unit || "-",
        item.supplierName || item.supplier || "-",
      ]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [5, 150, 105] },
    })
  );

  y = doc.lastAutoTable.finalY + 10;

  applyPdfFont(doc);
  doc.setFontSize(9);
  doc.text(
    settings.footer || "VetSys Veteriner Klinik Yönetim Sistemi",
    14,
    y
  );

  doc.save("Stok_Raporu.pdf");
}
