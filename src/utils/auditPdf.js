import autoTable from "jspdf-autotable";

import {
  applyPdfFont,
  createPdf,
  setPdfMetadata,
  withUnicodeTableOptions,
} from "./pdfFont";
import { drawClinicHeader } from "./pdfClinicHeader";

/**
 * Aktivite geçmişi PDF dışa aktarımı.
 */
export async function generateAuditLogPdf(logs = [], settings = {}) {
  const doc = await createPdf({ orientation: "landscape" });
  setPdfMetadata(doc, {
    title: "Aktivite Geçmişi",
    subject: "Aktivite Geçmişi",
  });

  let y = drawClinicHeader(doc, settings);

  applyPdfFont(doc);
  doc.setFontSize(14);
  doc.text("AKTİVİTE GEÇMİŞİ", 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.text(`Tarih: ${new Date().toLocaleDateString("tr-TR")}`, 14, y);
  y += 6;
  doc.text(`Kayıt sayısı: ${logs.length}`, 14, y);
  y += 8;

  autoTable(
    doc,
    withUnicodeTableOptions({
      startY: y,
      head: [["Tarih", "Saat", "Kullanıcı", "Rol", "Modül", "İşlem", "Açıklama"]],
      body: logs.map((log) => [
        log.date || "-",
        log.time || "-",
        log.userName || "-",
        log.userRole || "-",
        log.module || "-",
        log.action || "-",
        log.description || "-",
      ]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [5, 150, 105] },
      columnStyles: {
        6: { cellWidth: 80 },
      },
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

  doc.save("Aktivite_Gecmisi.pdf");
}
