/**
 * Tarih aralığı yardımcıları — Reports ve Dashboard'daki tüm analiz
 * fonksiyonlarının ortak kullandığı tek doğruluk kaynağı.
 *
 * Uygulamadaki tüm tarih alanları "YYYY-MM-DD" formatında string olarak
 * saklanır (bkz. appointmentService, invoiceService, vaccineService),
 * bu yüzden karşılaştırmalar bilinçli olarak Date nesnesi yerine string
 * karşılaştırması ile yapılır (saat dilimi kaymalarından etkilenmez).
 *
 * ÖNEMLİ: toDateOnly yerel takvim gününü kullanır (UTC değil).
 * toISOString().slice(0,10) Türkiye (UTC+3) gibi saat dilimlerinde
 * gece ~21:00'den sonra bir sonraki günü üretir; Dashboard "bugün"
 * kartları ile takvim/form tarihleri ayrışırdı.
 */

export function toDateOnly(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/** Bugünün yerel YYYY-MM-DD değeri. */
export function todayDateOnly() {
  return toDateOnly(new Date());
}

export function isDateInRange(dateStr, startDate, endDate) {
  if (!dateStr) return false;
  if (startDate && dateStr < startDate) return false;
  if (endDate && dateStr > endDate) return false;
  return true;
}

export function getDayCount(startDate, endDate) {
  if (!startDate || !endDate) return 1;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));

  return Math.max(1, diffDays + 1);
}

export const DATE_RANGE_PRESETS = [
  { value: "today", label: "Bugün" },
  { value: "week", label: "Son 7 Gün" },
  { value: "month", label: "Bu Ay" },
  { value: "year", label: "Bu Yıl" },
];

export function getPresetRange(preset = "month") {
  const end = new Date();
  const start = new Date();

  switch (preset) {
    case "today":
      break;
    case "week":
      start.setDate(end.getDate() - 6);
      break;
    case "year":
      start.setMonth(0, 1);
      break;
    case "month":
    default:
      start.setDate(1);
      break;
  }

  return { startDate: toDateOnly(start), endDate: toDateOnly(end) };
}
