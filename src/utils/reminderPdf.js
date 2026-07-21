import autoTable from "jspdf-autotable";

import {
  applyPdfFont,
  createPdf,
  setPdfMetadata,
  withUnicodeTableOptions,
} from "./pdfFont";
import { drawClinicHeader } from "./pdfClinicHeader";

/**
 * Bugünkü hatırlatma listesi PDF.
 */
export async function generateTodayRemindersPdf(items = [], settings = {}) {
  const doc = await createPdf({ orientation: "landscape" });
  setPdfMetadata(doc, {
    title: "Bugünkü Hatırlatmalar",
    subject: "Aşı Takvimi / Hatırlatmalar",
  });

  let y = drawClinicHeader(doc, settings);

  applyPdfFont(doc);
  doc.setFontSize(14);
  doc.text("BUGÜNKÜ HATIRLATMALAR", 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.text(`Tarih: ${new Date().toLocaleDateString("tr-TR")}`, 14, y);
  y += 6;
  doc.text(`Kayıt sayısı: ${items.length}`, 14, y);
  y += 8;

  autoTable(
    doc,
    withUnicodeTableOptions({
      startY: y,
      head: [
        [
          "Tür",
          "Hayvan",
          "Sahip",
          "Telefon",
          "İşlem",
          "Saat",
          "Veteriner",
          "Durum",
        ],
      ],
      body: items.map((item) => [
        item.kindLabel || "-",
        item.animalName || "-",
        item.ownerName || "-",
        item.phone || "-",
        item.title || "-",
        item.time || "-",
        item.veterinarian || "-",
        item.reminderStatus || "Gönderilmedi",
      ]),
      styles: { fontSize: 8 },
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

  doc.save("Bugunku_Hatirlatmalar.pdf");
}
