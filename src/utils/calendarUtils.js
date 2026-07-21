import { toDateOnly } from "./dateRange";
import {
  APPOINTMENT_STATUSES,
  getAppointmentStatusColor,
} from "./appointmentStatus";

export const START_HOUR = 8;
export const END_HOUR = 20;
export const SLOT_MINUTES = 30;
export const SLOT_HEIGHT = 48;

/** Sürükle-bırak / uzatma için izin verilen süreler (dk). */
export const RESIZE_DURATIONS = [30, 60, 90, 120];

const WEEKDAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MONTH_LABELS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export function toISODate(date) {
  return toDateOnly(date);
}

export function toMinutes(time) {
  const [h, m] = (time || "0:0").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function getTotalSlots() {
  return ((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES;
}

export function getPxPerMinute() {
  return SLOT_HEIGHT / SLOT_MINUTES;
}

export function buildSlots() {
  const slots = [];

  for (
    let minutes = START_HOUR * 60;
    minutes < END_HOUR * 60;
    minutes += SLOT_MINUTES
  ) {
    slots.push({
      minutes,
      label: minutes % 60 === 0 ? minutesToTime(minutes) : "",
    });
  }

  return slots;
}

export function getBlockPosition(appointment) {
  const startMinutes = toMinutes(appointment.time);
  const gridStartMinutes = START_HOUR * 60;
  const pxPerMinute = getPxPerMinute();

  const top = Math.max(0, (startMinutes - gridStartMinutes) * pxPerMinute);
  const duration = Number(appointment.duration) || 30;
  const height = Math.max(20, duration * pxPerMinute - 2);

  return { top, height };
}

/** Y offset → gün içi dakika (08:00 tabanlı), slot'a yuvarlanmış. */
export function yToSnappedMinutes(y) {
  const raw = START_HOUR * 60 + y / getPxPerMinute();
  const snapped =
    Math.round(raw / SLOT_MINUTES) * SLOT_MINUTES;
  const min = START_HOUR * 60;
  const max = END_HOUR * 60 - SLOT_MINUTES;
  return Math.min(max, Math.max(min, snapped));
}

/** Süreyi 30/60/90/120 dk seçeneklerine yuvarlar. */
export function snapDuration(minutes) {
  const value = Number(minutes) || 30;
  let best = RESIZE_DURATIONS[0];
  let bestDiff = Math.abs(value - best);

  RESIZE_DURATIONS.forEach((option) => {
    const diff = Math.abs(value - option);
    if (diff < bestDiff) {
      best = option;
      bestDiff = diff;
    }
  });

  const maxForDay = (END_HOUR - START_HOUR) * 60;
  return Math.min(best, maxForDay);
}

/**
 * Şu anki saat çizgisinin px konumu.
 * Takvim dışıysa null.
 */
export function getNowLineOffset(now = new Date()) {
  const minutes = now.getHours() * 60 + now.getMinutes();
  const start = START_HOUR * 60;
  const end = END_HOUR * 60;

  if (minutes < start || minutes > end) return null;

  return (minutes - start) * getPxPerMinute();
}

export function isSlotInPast(slotMinutes, dayIso, now = new Date()) {
  const todayIso = toISODate(now);

  if (dayIso < todayIso) return true;
  if (dayIso > todayIso) return false;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return slotMinutes + SLOT_MINUTES <= nowMinutes;
}

export function formatDayHeader(date) {
  const label = WEEKDAY_LABELS[(date.getDay() + 6) % 7];
  return `${label} ${date.getDate()}`;
}

export function formatMonthTitle(date) {
  return `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`;
}

export function getVeterinarianOptions(appointments = []) {
  const names = new Set();

  appointments.forEach((a) => {
    const vet = (a.veterinarian || "").trim();
    if (vet) names.add(vet);
  });

  return [...names].sort((a, b) => a.localeCompare(b, "tr"));
}

/**
 * Günlük doluluk: 08:00–20:00 arası 30 dk slotlar.
 * İptal randevular sayılmaz.
 */
export function calculateDayOccupancy(appointments = [], dateStr) {
  const totalSlots = getTotalSlots();
  const dayAppointments = appointments.filter(
    (a) => a.date === dateStr && a.status !== "İptal"
  );

  const occupied = new Set();
  const dayStart = START_HOUR * 60;
  const dayEnd = END_HOUR * 60;

  dayAppointments.forEach((a) => {
    const start = toMinutes(a.time);
    const end = start + (Number(a.duration) || 30);

    for (
      let slot = dayStart;
      slot < dayEnd;
      slot += SLOT_MINUTES
    ) {
      const slotEnd = slot + SLOT_MINUTES;
      if (start < slotEnd && slot < end) {
        occupied.add(slot);
      }
    }
  });

  const occupiedSlots = occupied.size;
  const emptySlots = Math.max(0, totalSlots - occupiedSlots);
  const occupancyPercent =
    totalSlots === 0
      ? 0
      : Math.round((occupiedSlots / totalSlots) * 100);

  return {
    date: dateStr,
    appointmentCount: dayAppointments.length,
    totalSlots,
    occupiedSlots,
    emptySlots,
    occupancyPercent,
  };
}

/** Legend için durum → MUI color eşlemesi. */
export function getStatusLegendItems() {
  return APPOINTMENT_STATUSES.map((status) => ({
    status,
    color: getAppointmentStatusColor(status),
  }));
}

/** Ayın gün hücreleri (önceki/sonraki ay dolgulu). */
export function buildMonthCells(year, month) {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < startOffset; i += 1) {
    const d = new Date(year, month, 1 - (startOffset - i));
    cells.push({ date: d, inMonth: false, iso: toISODate(d) });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const d = new Date(year, month, day);
    cells.push({ date: d, inMonth: true, iso: toISODate(d) });
  }

  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    const d = new Date(last);
    d.setDate(d.getDate() + 1);
    cells.push({ date: d, inMonth: false, iso: toISODate(d) });
  }

  return cells;
}
