import autoTable from "jspdf-autotable";

import { formatCurrency } from "./invoiceCalc";
import {
  buildAnimalSummary,
  buildMedicalTimeline,
  parseClinicalNotes,
} from "./medicalRecord";
import {
  applyPdfFont,
  createPdf,
  setPdfMetadata,
  withUnicodeTableOptions,
} from "./pdfFont";
import { drawClinicHeader } from "./pdfClinicHeader";

/**
 * Hayvan hasta dosyasının PDF çıktısı.
 */
export async function generateMedicalRecordPdf({
  animal,
  owner,
  examinations = [],
  vaccines = [],
  appointments = [],
  invoices = [],
  prescriptions = [],
  settings = {},
}) {
  const doc = await createPdf();
  setPdfMetadata(doc, {
    title: `Hasta Dosyası — ${animal?.name || "Hasta"}`,
    subject: "Hasta Dosyası",
  });

  const summary = buildAnimalSummary(animal, {
    examinations,
    vaccines,
    appointments,
    invoices,
  });
  const timeline = buildMedicalTimeline({
    examinations,
    vaccines,
    appointments,
    invoices,
    prescriptions,
  });
  const notes = parseClinicalNotes(animal?.note);

  let y = drawClinicHeader(doc, settings);

  applyPdfFont(doc);
  doc.setFontSize(11);
  doc.text(`Hasta Dosyası: ${animal?.name || "-"}`, 14, y);
  y += 6;
  doc.setFontSize(10);
  doc.text(
    `Sahip: ${owner ? `${owner.ad} ${owner.soyad}` : animal?.ownerName || "-"}`,
    14,
    y
  );
  y += 6;
  doc.text(
    `Tür / Irk: ${animal?.species || "-"} / ${animal?.breed || "-"}`,
    14,
    y
  );
  y += 8;

  autoTable(
    doc,
    withUnicodeTableOptions({
      startY: y,
      head: [["Özet", "Değer"]],
      body: [
        ["Yaş", summary.ageLabel],
        ["Kilo", `${summary.weight} kg`],
        ["Son muayene", summary.lastExamination],
        ["Son aşı", summary.lastVaccine],
        ["Sonraki aşı", summary.nextVaccine],
        ["Sonraki kontrol", summary.nextControl],
        ["Toplam ziyaret", String(summary.visitCount)],
        ["Toplam fatura", formatCurrency(summary.invoiceTotal)],
      ],
      styles: { fontSize: 9 },
    })
  );

  let nextY = doc.lastAutoTable.finalY + 8;

  if (notes.length) {
    autoTable(
      doc,
      withUnicodeTableOptions({
        startY: nextY,
        head: [["Klinik Notları"]],
        body: notes.map((n) => [n]),
        styles: { fontSize: 9 },
      })
    );
    nextY = doc.lastAutoTable.finalY + 8;
  }

  autoTable(
    doc,
    withUnicodeTableOptions({
      startY: nextY,
      head: [["Tarih", "Saat", "Tip", "Açıklama", "Veteriner"]],
      body: timeline.map((item) => [
        item.date,
        item.time || "-",
        item.kindLabel,
        [item.title, item.description].filter(Boolean).join(" — ").slice(0, 80),
        item.veterinarian || "-",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    })
  );

  applyPdfFont(doc);
  doc.setFontSize(8);
  doc.text(
    settings.footer || "VetSys Veteriner Klinik Yönetim Sistemi",
    14,
    doc.lastAutoTable.finalY + 12
  );

  const safeName = (animal?.name || "hasta").replace(/[^\wçğıöşüÇĞİÖŞÜ-]+/gi, "_");
  doc.save(`Hasta_Dosyasi_${safeName}.pdf`);
}
