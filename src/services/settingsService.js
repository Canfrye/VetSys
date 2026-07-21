import {
  STORAGE_KEYS,
  writeJson,
  safeParseJSON,
  readAllBackupData,
} from "../utils/storage";

import {
  DEFAULT_VACCINE_TEMPLATES,
  normalizeVaccineTemplates,
} from "../utils/vaccineTemplates";
import {
  DEFAULT_SERVICE_FEES,
  normalizeServiceFees,
} from "../utils/serviceCatalog";
import {
  DEFAULT_WORKING_HOURS_SCHEDULE,
  formatWorkingHoursSummary,
  normalizeWorkingHoursSchedule,
} from "../utils/clinicIdentity";
import apiClient, { apiRequest, USE_API } from "./apiClient";

const defaultSettings = {
  clinicName: "",
  clinicOwner: "",
  veterinarian: "",

  phone: "",
  email: "",
  website: "",

  taxOffice: "",
  taxNumber: "",
  mersis: "",
  tradeRegistryNo: "",

  iban: "",
  licenceNo: "",

  city: "",
  district: "",

  logo: "",

  address: "",

  workingHoursSchedule: DEFAULT_WORKING_HOURS_SCHEDULE,
  workingHours: formatWorkingHoursSummary(DEFAULT_WORKING_HOURS_SCHEDULE),

  footer: "VetSys Veteriner Klinik Yönetim Sistemi",

  vaccineTemplates: DEFAULT_VACCINE_TEMPLATES,
  serviceFees: DEFAULT_SERVICE_FEES,
  recentBreeds: [],
  recentSelections: {},
  reminderStatuses: {},
  auditLogs: [],
  /** Son .vsb yedek özeti (yeni storage key değil; settings içinde) */
  lastBackupMeta: null,
};

function withNormalizedSettings(settings) {
  const workingHoursSchedule = normalizeWorkingHoursSchedule(
    settings?.workingHoursSchedule
  );

  return {
    ...defaultSettings,
    ...settings,
    clinicName: settings?.clinicName ?? "",
    clinicOwner: settings?.clinicOwner ?? "",
    mersis: settings?.mersis ?? "",
    tradeRegistryNo: settings?.tradeRegistryNo ?? "",
    workingHoursSchedule,
    workingHours:
      settings?.workingHours ||
      formatWorkingHoursSummary(workingHoursSchedule),
    vaccineTemplates: normalizeVaccineTemplates(settings?.vaccineTemplates),
    serviceFees: normalizeServiceFees(settings?.serviceFees),
    recentBreeds: Array.isArray(settings?.recentBreeds)
      ? settings.recentBreeds
      : [],
    recentSelections:
      settings?.recentSelections && typeof settings.recentSelections === "object"
        ? settings.recentSelections
        : {},
    reminderStatuses:
      settings?.reminderStatuses && typeof settings.reminderStatuses === "object"
        ? settings.reminderStatuses
        : {},
    auditLogs: Array.isArray(settings?.auditLogs) ? settings.auditLogs : [],
    lastBackupMeta:
      settings?.lastBackupMeta && typeof settings.lastBackupMeta === "object"
        ? settings.lastBackupMeta
        : null,
  };
}

export const getSettings = async () => {
  if (USE_API) {
    const data = await apiClient.getAll(STORAGE_KEYS.SETTINGS);
    return withNormalizedSettings(data || {});
  }

  const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);

  if (!raw) {
    const seeded = withNormalizedSettings(defaultSettings);
    writeJson(STORAGE_KEYS.SETTINGS, seeded);
    return seeded;
  }

  const parsed = safeParseJSON(raw, defaultSettings);
  const merged = withNormalizedSettings(parsed);

  if (!parsed?.vaccineTemplates || !parsed?.serviceFees) {
    writeJson(STORAGE_KEYS.SETTINGS, merged);
  }

  return merged;
};

export const saveSettings = async (settings, options = {}) => {
  void options.skipAudit;

  const toSave = withNormalizedSettings(settings);

  if (USE_API) {
    const saved = await apiClient.update(STORAGE_KEYS.SETTINGS, "default", toSave);
    window.dispatchEvent(new Event("storage"));
    return withNormalizedSettings(saved || toSave);
  }

  writeJson(STORAGE_KEYS.SETTINGS, toSave);
  window.dispatchEvent(new Event("storage"));
  return toSave;
};

export const resetSettings = async () => {
  const seeded = withNormalizedSettings(defaultSettings);

  if (USE_API) {
    const saved = await apiClient.update(STORAGE_KEYS.SETTINGS, "default", seeded);
    window.dispatchEvent(new Event("storage"));
    return withNormalizedSettings(saved || seeded);
  }

  writeJson(STORAGE_KEYS.SETTINGS, seeded);
  window.dispatchEvent(new Event("storage"));
  return seeded;
};

/**
 * LocalStorage yedeğini PostgreSQL'e tek seferlik aktarır (yalnızca API modu).
 */
export async function importLocalDataToApi() {
  if (!USE_API) {
    throw new Error("Aktarım yalnızca API modunda (VITE_USE_API=true) kullanılabilir.");
  }

  const backup = readAllBackupData();
  return apiRequest("POST", "/import/local-data", { body: backup });
}

export const subscribeSettings = (callback) => {
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener("storage", callback);
  };
};
