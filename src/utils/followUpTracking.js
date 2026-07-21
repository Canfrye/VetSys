/**
 * Hasta takip / hatırlatma panosu — mevcut aşı, randevu ve kontrol
 * kayıtlarını tek tip satıra dönüştürür. Yeni veri modeli yok.
 */

import { getDaysUntil, getDueBadge } from "./dueDate";

export const FOLLOW_UP_KIND = {
  APPOINTMENT: "appointment",
  VACCINE: "vaccine",
  CONTROL: "control",
};

export const FOLLOW_UP_KIND_LABEL = {
  [FOLLOW_UP_KIND.APPOINTMENT]: "Randevu",
  [FOLLOW_UP_KIND.VACCINE]: "Aşı",
  [FOLLOW_UP_KIND.CONTROL]: "Kontrol",
};

/** Randevu: tamamlanmamış / iptal edilmemiş. */
export function isOpenAppointment(appointment) {
  const status = appointment?.status || "";
  return status !== "Tamamlandı" && status !== "İptal";
}

/** İptal hariç (bugün listesinde tamamlananlar da görünsün). */
export function isActiveAppointment(appointment) {
  return (appointment?.status || "") !== "İptal";
}

function baseItem({
  kind,
  source,
  date,
  time = "",
  title = "",
  status = "Bekliyor",
}) {
  const daysUntil = getDaysUntil(date);

  return {
    id: `${kind}-${source.id}`,
    sourceId: source.id,
    kind,
    kindLabel: FOLLOW_UP_KIND_LABEL[kind],
    animalId: source.animalId,
    animalName: source.animalName || "-",
    ownerName: source.ownerName || "-",
    date: date || "",
    time: time || "",
    title,
    status,
    daysUntil,
    dueBadge: getDueBadge(date),
    source,
  };
}

export function appointmentToFollowUp(appointment) {
  return baseItem({
    kind: FOLLOW_UP_KIND.APPOINTMENT,
    source: appointment,
    date: appointment.date,
    time: appointment.time || "",
    title: appointment.reason || "Randevu",
    status: appointment.status || "Bekliyor",
  });
}

export function vaccineToFollowUp(vaccine, { overdue = false } = {}) {
  return baseItem({
    kind: FOLLOW_UP_KIND.VACCINE,
    source: vaccine,
    date: vaccine.nextDoseDate,
    time: "",
    title: vaccine.vaccineName || "Aşı",
    status: overdue ? "Gecikmiş" : "Bekliyor",
  });
}

export function controlToFollowUp(exam, { overdue = false } = {}) {
  return baseItem({
    kind: FOLLOW_UP_KIND.CONTROL,
    source: exam,
    date: exam.controlDate,
    time: "",
    title: exam.diagnosis || "Kontrol",
    status: overdue ? "Gecikmiş" : "Bekliyor",
  });
}

function sortByDateTime(a, b) {
  const dateCmp = (a.date || "").localeCompare(b.date || "");
  if (dateCmp !== 0) return dateCmp;
  return (a.time || "").localeCompare(b.time || "");
}

/**
 * Bugün yapılması gerekenler panosu.
 */
export function buildTodayFollowUps({
  appointments = [],
  vaccines = [],
  overdueVaccines = [],
  controls = [],
} = {}) {
  const todayAppointments = appointments
    .filter(isActiveAppointment)
    .map(appointmentToFollowUp)
    .sort(sortByDateTime);

  const todayVaccines = vaccines
    .map((v) => vaccineToFollowUp(v))
    .sort(sortByDateTime);

  const overdueVaccineItems = overdueVaccines
    .map((v) => vaccineToFollowUp(v, { overdue: true }))
    .sort(sortByDateTime);

  const todayControls = controls
    .map((e) => controlToFollowUp(e))
    .sort(sortByDateTime);

  return {
    appointments: todayAppointments,
    vaccines: todayVaccines,
    overdueVaccines: overdueVaccineItems,
    controls: todayControls,
    all: [
      ...todayAppointments,
      ...todayVaccines,
      ...overdueVaccineItems,
      ...todayControls,
    ],
  };
}

/**
 * Önümüzdeki 7 gün (bugün dahil, mevcut servis pencereleriyle uyumlu).
 */
export function buildUpcomingFollowUps({
  appointments = [],
  vaccines = [],
  controls = [],
} = {}) {
  const items = [
    ...appointments.filter(isActiveAppointment).map(appointmentToFollowUp),
    ...vaccines.map((v) => vaccineToFollowUp(v)),
    ...controls.map((e) => controlToFollowUp(e)),
  ].sort(sortByDateTime);

  return { items, count: items.length };
}

/**
 * Geciken işlemler — aşı + tamamlanmamış randevu.
 */
export function buildOverdueFollowUps({
  appointments = [],
  vaccines = [],
} = {}) {
  const items = [
    ...appointments.filter(isOpenAppointment).map(appointmentToFollowUp),
    ...vaccines.map((v) => vaccineToFollowUp(v, { overdue: true })),
  ].sort(sortByDateTime);

  return { items, count: items.length };
}
