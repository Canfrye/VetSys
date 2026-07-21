/**
 * Hatırlatma iletişim durumu — Settings.reminderStatuses içinde saklanır.
 * Yeni storage key yok.
 */

import { getSettings, saveSettings } from "../services/settingsService";
import { todayDateOnly, toDateOnly } from "./dateRange";

export const REMINDER_STATUS = {
  NOT_SENT: "Gönderilmedi",
  SENT: "Gönderildi",
  POSTPONED: "Ertelendi",
};

export const REMINDER_STATUS_OPTIONS = [
  REMINDER_STATUS.NOT_SENT,
  REMINDER_STATUS.SENT,
  REMINDER_STATUS.POSTPONED,
];

export const REMIND_AGAIN_DAYS = [1, 3, 7];

export function normalizeReminderStatuses(map) {
  if (!map || typeof map !== "object") return {};
  return { ...map };
}

export function getReminderEntry(statuses, reminderId) {
  const entry = statuses?.[reminderId];
  if (!entry || typeof entry !== "object") {
    return {
      status: REMINDER_STATUS.NOT_SENT,
      sentAt: "",
      remindAgainAt: "",
      channel: "",
    };
  }

  return {
    status: REMINDER_STATUS_OPTIONS.includes(entry.status)
      ? entry.status
      : REMINDER_STATUS.NOT_SENT,
    sentAt: entry.sentAt || "",
    remindAgainAt: entry.remindAgainAt || "",
    channel: entry.channel || "",
  };
}

export function addDaysToDateOnly(dateStr, days) {
  const base = dateStr || todayDateOnly();
  const d = new Date(`${base}T12:00:00`);
  d.setDate(d.getDate() + Number(days || 0));
  return toDateOnly(d);
}

/**
 * Gönderildi kayıtları remindAgainAt gelince yeniden hatırlatılabilir.
 */
export function needsReRemind(entry, today = todayDateOnly()) {
  if (!entry) return false;
  if (entry.status !== REMINDER_STATUS.SENT) return false;
  if (!entry.remindAgainAt) return false;
  return entry.remindAgainAt <= today;
}

export function isUnsentReminder(entry) {
  const status = entry?.status || REMINDER_STATUS.NOT_SENT;
  return (
    status === REMINDER_STATUS.NOT_SENT ||
    status === REMINDER_STATUS.POSTPONED ||
    needsReRemind(entry)
  );
}

export async function loadReminderStatuses() {
  const settings = await getSettings();
  return normalizeReminderStatuses(settings.reminderStatuses);
}

export async function saveReminderStatus(reminderId, patch = {}) {
  if (!reminderId) return null;

  const settings = await getSettings();
  const current = normalizeReminderStatuses(settings.reminderStatuses);
  const prev = getReminderEntry(current, reminderId);

  const nextEntry = {
    ...prev,
    ...patch,
  };

  const nextMap = {
    ...current,
    [reminderId]: nextEntry,
  };

  await saveSettings({
    ...settings,
    reminderStatuses: nextMap,
  });

  return nextEntry;
}

export async function markReminderSent(reminderId, { channel = "", remindAgainDays = null } = {}) {
  const today = todayDateOnly();
  const patch = {
    status: REMINDER_STATUS.SENT,
    sentAt: today,
    channel: channel || "",
  };

  if (remindAgainDays != null) {
    patch.remindAgainAt = addDaysToDateOnly(today, remindAgainDays);
  }

  return saveReminderStatus(reminderId, patch);
}
