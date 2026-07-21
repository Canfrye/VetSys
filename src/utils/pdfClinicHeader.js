/**
 * PDF üst bilgisi — logo + klinik kimliği (ortak).
 */

import { applyPdfFont } from "./pdfFont";

function detectImageFormat(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  if (dataUrl.startsWith("data:image/png")) return "PNG";
  if (
    dataUrl.startsWith("data:image/jpeg") ||
    dataUrl.startsWith("data:image/jpg")
  ) {
    return "JPEG";
  }
  return null;
}

/**
 * Klinik başlığını çizer; bir sonraki içerik Y konumunu döner.
 */
export function drawClinicHeader(doc, settings = {}, options = {}) {
  const marginX = options.marginX ?? 14;
  const startY = options.startY ?? 12;
  const logoSize = options.logoSize ?? 22;
  const hasLogo = Boolean(
    settings.logo && String(settings.logo).startsWith("data:image")
  );

  let textX = marginX;
  let y = startY;

  if (hasLogo) {
    const format = detectImageFormat(settings.logo);
    if (format) {
      try {
        doc.addImage(settings.logo, format, marginX, y, logoSize, logoSize);
        textX = marginX + logoSize + 6;
      } catch {
        // Logo eklenemezse metin sola yaslanır
        textX = marginX;
      }
    }
  }

  applyPdfFont(doc);
  doc.setFontSize(16);
  doc.text(settings.clinicName || "VetSys Veteriner Kliniği", textX, y + 6);

  applyPdfFont(doc);
  doc.setFontSize(9);
  const lines = [];
  if (settings.address) lines.push(settings.address);
  const cityLine = [settings.district, settings.city].filter(Boolean).join(" / ");
  if (cityLine) lines.push(cityLine);
  lines.push(
    `Tel: ${settings.phone || "-"}   E-Posta: ${settings.email || "-"}`
  );
  if (settings.website) lines.push(settings.website);

  let lineY = y + 12;
  lines.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, 180 - (textX - marginX));
    doc.text(wrapped, textX, lineY);
    lineY += wrapped.length * 4.2;
  });

  const bottomFromLogo = hasLogo ? y + logoSize + 6 : y + 8;
  const nextY = Math.max(bottomFromLogo, lineY + 4);
  return nextY;
}
