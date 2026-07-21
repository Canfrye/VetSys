/**
 * Audit log servisi — Settings.auditLogs üzerinden okuma/yazma.
 */

import { restoreSession } from "./authService";
import { getSettings, saveSettings } from "./settingsService";
import { ROLES } from "../utils/roles";
import {
  AUDIT_MODULES,
  MAX_AUDIT_LOGS,
  buildAuditEntry,
  normalizeAuditLogs,
} from "../utils/auditLog";
import { getPresetRange } from "../utils/dateRange";

/**
 * Tek giriş noktası — tüm servisler bunu çağırır.
 * Hata fırlatmaz; iş akışını bozmaz.
 */
export async function createAuditLog(payload = {}) {
  try {
    const user = await restoreSession();
    const settings = await getSettings();
    const entry = buildAuditEntry({
      ...payload,
      user: user || payload.user || null,
    });

    const nextLogs = [entry, ...normalizeAuditLogs(settings.auditLogs)].slice(
      0,
      MAX_AUDIT_LOGS
    );

    await saveSettings(
      {
        ...settings,
        auditLogs: nextLogs,
      },
      { skipAudit: true }
    );

    return entry;
  } catch {
    return null;
  }
}

export async function getAuditLogs() {
  const settings = await getSettings();
  return normalizeAuditLogs(settings.auditLogs).sort((a, b) =>
    String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
  );
}

/**
 * Rol bazlı görünürlük.
 * Admin: tümü
 * Veteriner: kendi işlemleri + klinik modüller
 * Resepsiyon: müşteri, randevu, tahsilat, fatura, hayvan
 */
export function filterAuditLogsForRole(logs = [], user = null) {
  if (!user?.role) return [];

  if (user.role === ROLES.ADMIN) return logs;

  if (user.role === ROLES.VETERINARIAN) {
    const clinicModules = new Set([
      AUDIT_MODULES.ANIMAL,
      AUDIT_MODULES.APPOINTMENT,
      AUDIT_MODULES.EXAMINATION,
      AUDIT_MODULES.VACCINE,
      AUDIT_MODULES.PRESCRIPTION,
      AUDIT_MODULES.STOCK,
    ]);

    return logs.filter(
      (log) =>
        String(log.userId) === String(user.id) ||
        clinicModules.has(log.module)
    );
  }

  if (user.role === ROLES.RECEPTION) {
    const allowed = new Set([
      AUDIT_MODULES.CUSTOMER,
      AUDIT_MODULES.ANIMAL,
      AUDIT_MODULES.APPOINTMENT,
      AUDIT_MODULES.INVOICE,
      AUDIT_MODULES.PAYMENT,
    ]);

    return logs.filter((log) => allowed.has(log.module));
  }

  return [];
}

export async function getVisibleAuditLogs(user) {
  const logs = await getAuditLogs();
  return filterAuditLogsForRole(logs, user);
}

export async function getAuditLogsByAnimal(animalId, user = null) {
  const logs = user
    ? await getVisibleAuditLogs(user)
    : await getAuditLogs();

  return logs.filter(
    (log) => String(log.animalId) === String(animalId)
  );
}

export async function getAuditLogsByOwner(ownerId, user = null) {
  const logs = user
    ? await getVisibleAuditLogs(user)
    : await getAuditLogs();

  return logs.filter(
    (log) => String(log.ownerId) === String(ownerId)
  );
}

export async function getLatestAuditLogs(limit = 10, user = null) {
  const logs = user
    ? await getVisibleAuditLogs(user)
    : await getAuditLogs();

  return logs.slice(0, limit);
}

export function filterAuditLogs(logs = [], filters = {}) {
  const {
    period = "all",
    userId = "",
    role = "",
    module = "",
    action = "",
    search = "",
  } = filters;

  let startDate = "";
  let endDate = "";

  if (period === "today") {
    const range = getPresetRange("today");
    startDate = range.startDate;
    endDate = range.endDate;
  } else if (period === "week") {
    const range = getPresetRange("week");
    startDate = range.startDate;
    endDate = range.endDate;
  } else if (period === "month") {
    const range = getPresetRange("month");
    startDate = range.startDate;
    endDate = range.endDate;
  }

  const query = String(search || "")
    .trim()
    .toLocaleLowerCase("tr");

  return logs.filter((log) => {
    if (startDate && log.date && log.date < startDate) return false;
    if (endDate && log.date && log.date > endDate) return false;

    if (userId && String(log.userId) !== String(userId)) return false;
    if (role && log.userRole !== role) return false;
    if (module && log.module !== module) return false;
    if (action && log.action !== action) return false;

    if (query) {
      const haystack = [
        log.description,
        log.module,
        log.action,
        log.userName,
        log.userRole,
        log.entityId,
        log.meta?.invoiceNumber,
        log.meta?.prescriptionNumber,
        log.meta?.receiptNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("tr");

      if (!haystack.includes(query)) return false;
    }

    return true;
  });
}

export function collectAuditFilterOptions(logs = []) {
  const users = new Map();
  const roles = new Set();
  const modules = new Set();
  const actions = new Set();

  logs.forEach((log) => {
    if (log.userId) {
      users.set(String(log.userId), log.userName || log.userId);
    }
    if (log.userRole) roles.add(log.userRole);
    if (log.module) modules.add(log.module);
    if (log.action) actions.add(log.action);
  });

  return {
    users: Array.from(users.entries()).map(([id, name]) => ({ id, name })),
    roles: Array.from(roles).sort((a, b) => a.localeCompare(b, "tr")),
    modules: Array.from(modules).sort((a, b) => a.localeCompare(b, "tr")),
    actions: Array.from(actions).sort((a, b) => a.localeCompare(b, "tr")),
  };
}
