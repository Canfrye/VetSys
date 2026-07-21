/**
 * Ortak PDF Unicode font altyapısı.
 *
 * Noto Sans (Regular + Bold) projeye gömülüdür; kullanıcının sistem
 * fontlarına bağımlı değildir. Tüm PDF yardımcıları createPdf / applyPdfFont
 * üzerinden bu fontu kullanmalıdır.
 */

import jsPDF from "jspdf";

import notoSansRegularUrl from "../assets/fonts/NotoSans-Regular.ttf?url";
import notoSansBoldUrl from "../assets/fonts/NotoSans-Bold.ttf?url";

export const PDF_FONT_FAMILY = "NotoSans";

const VFS_REGULAR = "NotoSans-Regular.ttf";
const VFS_BOLD = "NotoSans-Bold.ttf";

/** @type {Promise<{ regular: string, bold: string }> | null} */
let fontDataPromise = null;

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }

  return btoa(binary);
}

async function loadFontData() {
  if (!fontDataPromise) {
    fontDataPromise = Promise.all([
      fetch(notoSansRegularUrl).then((res) => {
        if (!res.ok) {
          throw new Error("Noto Sans Regular yüklenemedi");
        }
        return res.arrayBuffer();
      }),
      fetch(notoSansBoldUrl).then((res) => {
        if (!res.ok) {
          throw new Error("Noto Sans Bold yüklenemedi");
        }
        return res.arrayBuffer();
      }),
    ]).then(([regularBuf, boldBuf]) => ({
      regular: arrayBufferToBase64(regularBuf),
      bold: arrayBufferToBase64(boldBuf),
    }));
  }

  return fontDataPromise;
}

/**
 * Fontları doc örneğine kaydeder ve varsayılan fontu ayarlar.
 */
export async function registerPdfFonts(doc) {
  const fonts = await loadFontData();

  doc.addFileToVFS(VFS_REGULAR, fonts.regular);
  doc.addFont(VFS_REGULAR, PDF_FONT_FAMILY, "normal");

  doc.addFileToVFS(VFS_BOLD, fonts.bold);
  doc.addFont(VFS_BOLD, PDF_FONT_FAMILY, "bold");

  applyPdfFont(doc);
  return doc;
}

export function applyPdfFont(doc, style = "normal") {
  doc.setFont(PDF_FONT_FAMILY, style);
  return doc;
}

/**
 * Unicode destekli jsPDF örneği oluşturur.
 */
export async function createPdf(options = {}) {
  const doc = new jsPDF(options);
  await registerPdfFonts(doc);
  return doc;
}

/**
 * autoTable stillerine Noto Sans ekler (çağıranın stillerini korur).
 */
export function withUnicodeTableOptions(options = {}) {
  const { styles = {}, headStyles = {}, bodyStyles = {}, footStyles = {}, ...rest } =
    options;

  return {
    ...rest,
    styles: {
      ...styles,
      font: PDF_FONT_FAMILY,
      fontStyle: styles.fontStyle || "normal",
    },
    headStyles: {
      ...headStyles,
      font: PDF_FONT_FAMILY,
      fontStyle: headStyles.fontStyle || "bold",
    },
    bodyStyles: {
      ...bodyStyles,
      font: PDF_FONT_FAMILY,
    },
    footStyles: {
      ...footStyles,
      font: PDF_FONT_FAMILY,
      fontStyle: footStyles.fontStyle || "bold",
    },
  };
}

/**
 * PDF belge meta verileri (Title / Author / Subject / Creator).
 */
export function setPdfMetadata(
  doc,
  { title, subject, author = "VetSys Software", creator = "VetSys" } = {}
) {
  doc.setProperties({
    title: title || "VetSys",
    subject: subject || "Veteriner Klinik Yönetim Sistemi",
    author,
    creator,
  });
  return doc;
}
