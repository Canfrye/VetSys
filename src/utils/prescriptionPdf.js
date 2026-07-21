import autoTable from "jspdf-autotable";

import {
  applyPdfFont,
  createPdf,
  setPdfMetadata,
  withUnicodeTableOptions,
} from "./pdfFont";
import { drawClinicHeader } from "./pdfClinicHeader";

/**
 * Profesyonel reçete PDF çıktısı.
 */
export async function generatePrescriptionPdf(prescription, settings = {}) {
  const doc = await createPdf();
  setPdfMetadata(doc, {
    title: `Reçete — ${prescription.prescriptionNumber || ""}`,
    subject: "Reçete",
  });

  let y = drawClinicHeader(doc, settings);

  applyPdfFont(doc);
  doc.setFontSize(14);
  doc.text("REÇETE", 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.text(`Reçete No: ${prescription.prescriptionNumber || "-"}`, 14, y);
  y += 6;
  doc.text(`Tarih: ${prescription.date || "-"}`, 14, y);
  y += 6;
  doc.text(`Veteriner: ${prescription.veterinarian || "-"}`, 14, y);
  y += 8;

  doc.text(`Hayvan: ${prescription.animalName || "-"}`, 14, y);
  y += 6;
  doc.text(`Sahip: ${prescription.ownerName || "-"}`, 14, y);
  y += 6;
  doc.text(`Tanı: ${prescription.diagnosis || "-"}`, 14, y);
  y += 6;

  if (prescription.examinationDate) {
    doc.text(
      `Bağlı Muayene Tarihi: ${prescription.examinationDate}`,
      14,
      y
    );
    y += 6;
  }

  y += 4;

  autoTable(
    doc,
    withUnicodeTableOptions({
      startY: y,
      head: [["İlaç", "Doz", "Sıklık", "Süre", "Açıklama"]],
      body: (prescription.items || []).map((item) => [
        item.medicationName || "-",
        item.dose || "-",
        item.frequency || "-",
        item.duration || "-",
        item.instructions || "-",
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
    })
  );

  y = doc.lastAutoTable.finalY + 10;

  if (prescription.notes) {
    applyPdfFont(doc);
    doc.setFontSize(10);
    doc.text("Genel Not:", 14, y);
    y += 6;
    const noteLines = doc.splitTextToSize(prescription.notes, 180);
    doc.text(noteLines, 14, y);
    y += noteLines.length * 5 + 6;
  }

  applyPdfFont(doc);
  doc.setFontSize(9);
  doc.text(
    settings.footer || "VetSys Veteriner Klinik Yönetim Sistemi",
    14,
    Math.max(y, doc.lastAutoTable.finalY + 20)
  );

  doc.save(`${prescription.prescriptionNumber || "Recete"}.pdf`);
}
