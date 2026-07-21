/**
 * Hatırlatma Merkezi veri yükleme — mevcut servisleri birleştirir.
 */

import { getCustomers } from "./customerService";
import { getSettings } from "./settingsService";
import {
  getTodayVaccines,
  getUpcomingVaccines,
  getOverdueVaccines,
  getVaccines,
} from "./vaccineService";
import {
  getTodayAppointments,
  getUpcomingAppointments,
} from "./appointmentService";
import {
  getTodayControls,
  getUpcomingControls,
  getOverdueControls,
} from "./examinationService";
import { buildReminderCenter } from "../utils/reminderCenter";
import { normalizeReminderStatuses } from "../utils/reminderStatus";

export async function loadReminderCenterData() {
  const [
    customers,
    settings,
    todayVaccines,
    upcomingVaccines,
    overdueVaccines,
    allVaccines,
    todayAppointments,
    upcomingAppointments,
    todayControls,
    upcomingControls,
    overdueControls,
  ] = await Promise.all([
    getCustomers(),
    getSettings(),
    getTodayVaccines(),
    getUpcomingVaccines(7),
    getOverdueVaccines(),
    getVaccines(),
    getTodayAppointments(),
    getUpcomingAppointments(7),
    getTodayControls(),
    getUpcomingControls(7),
    getOverdueControls(),
  ]);

  // Yarınki aşılar için tüm aşılar (nextDoseDate) üzerinden de bakılır
  const vaccinesForCenter = allVaccines.length
    ? allVaccines
    : [...todayVaccines, ...upcomingVaccines];

  const appointments = [
    ...todayAppointments,
    ...upcomingAppointments,
  ];

  // Tekilleştir
  const appointmentMap = new Map();
  appointments.forEach((a) => appointmentMap.set(a.id, a));

  const controls = [...todayControls, ...upcomingControls];
  const controlMap = new Map();
  controls.forEach((c) => controlMap.set(c.id, c));

  const center = buildReminderCenter({
    vaccines: vaccinesForCenter,
    appointments: Array.from(appointmentMap.values()),
    controls: Array.from(controlMap.values()),
    overdueVaccines,
    overdueControls,
    customers,
    reminderStatuses: normalizeReminderStatuses(settings.reminderStatuses),
  });

  return {
    ...center,
    settings,
    customers,
  };
}

export async function getReminderDashboardStats() {
  const data = await loadReminderCenterData();
  return data.counts;
}
