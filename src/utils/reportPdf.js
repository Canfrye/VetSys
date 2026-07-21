import autoTable from "jspdf-autotable";

import { formatCurrency } from "./invoiceCalc";
import {
  applyPdfFont,
  createPdf,
  setPdfMetadata,
  withUnicodeTableOptions,
} from "./pdfFont";
import { drawClinicHeader } from "./pdfClinicHeader";

function addSection(doc, title, headers, rows, fallbackY = 55) {
  if (!rows?.length) return;

  if (doc.lastAutoTable && doc.lastAutoTable.finalY + 12 > 260) {
    doc.addPage();
  }

  const y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : fallbackY;

  applyPdfFont(doc);
  doc.setFontSize(12);
  doc.text(title, 14, y);

  autoTable(
    doc,
    withUnicodeTableOptions({
      startY: y + 4,
      head: [headers],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [5, 150, 105] },
    })
  );
}

/**
 * Rapor sekmesine göre PDF üretir.
 */
export async function generateReportPdf(
  report,
  tab = "overview",
  settings = {}
) {
  const doc = await createPdf();
  setPdfMetadata(doc, {
    title: `VetSys Rapor — ${tabLabel(tab)}`,
    subject: "Klinik Raporu",
  });

  const range = report?.range || {};

  let y = drawClinicHeader(doc, settings);

  applyPdfFont(doc);
  doc.setFontSize(10);
  doc.text(`Veteriner: ${settings.veterinarian || "-"}`, 14, y);
  y += 6;
  doc.text(`Tarih: ${new Date().toLocaleDateString("tr-TR")}`, 14, y);
  y += 6;
  doc.text(
    `Aralık: ${range.startDate || "-"} — ${range.endDate || "-"}`,
    14,
    y
  );
  y += 8;

  autoTable(
    doc,
    withUnicodeTableOptions({
      startY: y,
      head: [["Sekme", "Değer"]],
      body: [[tabLabel(tab), ""]],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [5, 150, 105] },
    })
  );

  if (tab === "overview" || tab === "finance") {
    const f = report.finance || {};
    addSection(doc, "Finans Özeti", ["KPI", "Değer"], [
      ["Toplam Ciro", formatCurrency(f.totalRevenue)],
      ["Toplam Tahsilat", formatCurrency(f.totalCollection)],
      ["Bekleyen Tahsilat", formatCurrency(f.pendingCollection)],
      ["Net Karlılık", formatCurrency(f.netProfit)],
      ["Brüt Karlılık", formatCurrency(f.grossProfit)],
      ["Ortalama Fatura", formatCurrency(f.avgInvoice)],
      ["Ortalama Tahsilat", formatCurrency(f.avgPayment)],
      ["Toplam İndirim", formatCurrency(f.totalDiscount)],
    ]);
  }

  if (tab === "overview") {
    const o = report.overview || {};
    const p = report.patients || {};
    addSection(doc, "Genel", ["Metrik", "Değer"], [
      ["Müşteri", o.customerCount],
      ["Hayvan", o.animalCount],
      ["Muayene (aralık)", o.examinationCount],
      ["Randevu (aralık)", o.appointmentCount],
      ["Bugün Muayene", o.todayExaminations],
      ["Bugün Randevu", o.todayAppointments],
      ["Tekrar Ziyaret Oranı", `%${p.repeatVisitRate ?? 0}`],
      ["Randevu İptal Oranı", `%${p.cancelRate ?? 0}`],
    ]);
  }

  if (tab === "veterinarian") {
    addSection(
      doc,
      "Veteriner Performansı",
      [
        "Veteriner",
        "Muayene",
        "Aşı",
        "Reçete",
        "Ciro",
        "Ort. Fatura",
        "İptal %",
        "Hasta",
      ],
      (report.veterinarians || []).map((row) => [
        row.name,
        row.examinations,
        row.vaccines,
        row.prescriptions,
        formatCurrency(row.revenue),
        formatCurrency(row.avgInvoice),
        `%${row.cancelRate}`,
        row.animalCount,
      ])
    );
  }

  if (tab === "patients") {
    addSection(
      doc,
      "En Çok Gelen Türler",
      ["Tür", "Adet"],
      (report.patients?.topSpecies || []).map((r) => [r.name, r.count])
    );
    addSection(
      doc,
      "En Aktif Müşteriler",
      ["Müşteri", "Ziyaret", "İlk", "Son"],
      (report.patients?.topCustomers || []).map((r) => [
        r.name,
        r.visitCount,
        r.firstVisit,
        r.lastVisit,
      ])
    );
  }

  if (tab === "stock") {
    addSection(
      doc,
      "En Çok Tüketilen",
      ["Ürün", "Miktar"],
      (report.stock?.mostConsumed || []).map((r) => [r.name, r.quantity])
    );
    addSection(
      doc,
      "Kritik Stok",
      ["Ürün", "Miktar", "Min"],
      (report.stock?.criticalStock || []).map((r) => [
        r.name,
        r.quantity,
        r.minQuantity,
      ])
    );
  }

  if (tab === "vaccines") {
    const v = report.vaccines || {};
    addSection(doc, "Aşı Özeti", ["Metrik", "Değer"], [
      ["Toplam", v.total],
      ["Tamamlanan", v.completed],
      ["Bekleyen", v.pending],
      ["Geciken", v.overdue],
      ["İptal", v.cancelled],
      ["Tamamlama Oranı", `%${v.completionRate ?? 0}`],
    ]);
    addSection(
      doc,
      "En Çok Yapılan Aşılar",
      ["Aşı", "Adet"],
      (v.topVaccines || []).map((r) => [r.name, r.count])
    );

    const rx = report.prescriptions || {};
    addSection(doc, "Reçete Özeti", ["Metrik", "Değer"], [
      ["Toplam Reçete", rx.totalPrescriptions],
      ["Ort. İlaç Sayısı", rx.avgItemCount],
    ]);
    addSection(
      doc,
      "En Çok Yazılan İlaçlar",
      ["İlaç", "Satır", "Miktar"],
      (rx.topWritten || []).map((r) => [r.name, r.count, r.quantity])
    );
  }

  if (tab === "finance") {
    addSection(
      doc,
      "En Karlı Hizmetler",
      ["Hizmet", "Kar", "Marj %"],
      (report.profitability?.topServices || []).map((r) => [
        r.name,
        formatCurrency(r.profit),
        r.margin,
      ])
    );
    addSection(
      doc,
      "En Karlı Ürünler",
      ["Ürün", "Kar", "Marj %"],
      (report.profitability?.topProducts || []).map((r) => [
        r.name,
        formatCurrency(r.profit),
        r.margin,
      ])
    );
  }

  const footerY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 280;
  applyPdfFont(doc);
  doc.setFontSize(9);
  doc.text(
    settings.footer || "VetSys Veteriner Klinik Yönetim Sistemi",
    14,
    Math.min(footerY, 285)
  );

  doc.save(`VetSys-Rapor-${tab}.pdf`);
}

function tabLabel(tab) {
  switch (tab) {
    case "finance":
      return "Finans";
    case "veterinarian":
      return "Veteriner Performansı";
    case "patients":
      return "Hastalar";
    case "stock":
      return "Stok";
    case "vaccines":
      return "Aşılar";
    case "overview":
    default:
      return "Genel";
  }
}
