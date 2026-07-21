import { STORAGE_KEYS } from "../utils/storage";
import apiClient from "./apiClient";
import { todayDateOnly, toDateOnly } from "../utils/dateRange";
import { calculateDayOccupancy } from "../utils/calendarUtils";
import { createAuditLog } from "./auditLogService";
import { AUDIT_ACTIONS, AUDIT_MODULES } from "../utils/auditLog";

const RESOURCE = STORAGE_KEYS.APPOINTMENTS;

export const getAppointments = async () => {
  const appointments = await apiClient.getAll(RESOURCE);

  return [...appointments].sort((a, b) => {
    return (
      new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`)
    );
  });
};

export const getAppointmentById = (id) => apiClient.getById(RESOURCE, id);

export const addAppointment = async (appointment, options = {}) => {
  const saved = await apiClient.create(RESOURCE, {
    animalId: appointment.animalId,
    animalName: appointment.animalName,

    ownerId: appointment.ownerId,
    ownerName: appointment.ownerName,

    date: appointment.date,
    time: appointment.time,
    duration: Number(appointment.duration) || 30,

    veterinarian: appointment.veterinarian,

    reason: appointment.reason,

    status: appointment.status,

    note: appointment.note || "",
  });

  if (!options.skipAudit) {
    await createAuditLog({
      module: AUDIT_MODULES.APPOINTMENT,
      action: AUDIT_ACTIONS.CREATE,
      description: `Randevu oluşturuldu: ${saved.animalName || ""} ${saved.date || ""} ${saved.time || ""}`.trim(),
      entityId: saved.id,
      animalId: saved.animalId || "",
      ownerId: saved.ownerId || "",
    });
  }

  return saved;
};

export const updateAppointment = async (appointment, options = {}) => {
  const previous = await getAppointmentById(appointment.id);
  const saved = await apiClient.update(RESOURCE, appointment.id, {
    ...appointment,
    duration: Number(appointment.duration) || 30,
  });

  if (!saved || options.skipAudit) return saved;

  const animalLabel = saved.animalName || previous?.animalName || "";
  const base = {
    module: AUDIT_MODULES.APPOINTMENT,
    entityId: saved.id,
    animalId: saved.animalId || previous?.animalId || "",
    ownerId: saved.ownerId || previous?.ownerId || "",
  };

  if (previous) {
    const moved =
      previous.date !== saved.date || previous.time !== saved.time;
    const durationChanged =
      Number(previous.duration) !== Number(saved.duration);
    const completed =
      previous.status !== "Tamamlandı" && saved.status === "Tamamlandı";
    const cancelled =
      previous.status !== "İptal" && saved.status === "İptal";

    if (moved) {
      await createAuditLog({
        ...base,
        action: AUDIT_ACTIONS.MOVE,
        description: `${animalLabel} randevusu taşındı (${saved.date} ${saved.time})`,
      });
    }

    if (durationChanged) {
      await createAuditLog({
        ...base,
        action: AUDIT_ACTIONS.DURATION,
        description: `${animalLabel} randevu süresi değişti (${saved.duration} dk)`,
      });
    }

    if (completed) {
      await createAuditLog({
        ...base,
        action: AUDIT_ACTIONS.COMPLETE,
        description: `${animalLabel} randevusu tamamlandı`,
      });
    } else if (cancelled) {
      await createAuditLog({
        ...base,
        action: AUDIT_ACTIONS.CANCEL,
        description: `${animalLabel} randevusu iptal edildi`,
      });
    } else if (!moved && !durationChanged) {
      await createAuditLog({
        ...base,
        action: AUDIT_ACTIONS.UPDATE,
        description: `Randevu güncellendi: ${animalLabel}`,
      });
    }
  } else {
    await createAuditLog({
      ...base,
      action: AUDIT_ACTIONS.UPDATE,
      description: `Randevu güncellendi: ${animalLabel}`,
    });
  }

  return saved;
};

export const deleteAppointment = async (id, options = {}) => {
  const existing = await getAppointmentById(id);
  await apiClient.remove(RESOURCE, id);

  if (!options.skipAudit) {
    await createAuditLog({
      module: AUDIT_MODULES.APPOINTMENT,
      action: AUDIT_ACTIONS.DELETE,
      description: `Randevu silindi: ${existing?.animalName || id}`,
      entityId: id,
      animalId: existing?.animalId || "",
      ownerId: existing?.ownerId || "",
    });
  }
};

export const deleteAppointmentsByAnimalId = (animalId) => {
  return apiClient.removeWhere(
    RESOURCE,
    (a) => String(a.animalId) === String(animalId)
  );
};

export const deleteAppointmentsByOwnerId = (ownerId) => {
  return apiClient.removeWhere(
    RESOURCE,
    (a) => String(a.ownerId) === String(ownerId)
  );
};

export const syncOwnerName = (ownerId, ownerName) => {
  return apiClient.updateWhere(
    RESOURCE,
    (a) => String(a.ownerId) === String(ownerId),
    () => ({ ownerName })
  );
};

export const syncAnimalName = (animalId, animalName) => {
  return apiClient.updateWhere(
    RESOURCE,
    (a) => String(a.animalId) === String(animalId),
    () => ({ animalName })
  );
};

export const syncOwnerForAnimal = (animalId, ownerId, ownerName) => {
  return apiClient.updateWhere(
    RESOURCE,
    (a) => String(a.animalId) === String(animalId),
    () => ({ ownerId, ownerName })
  );
};

export const getTodayAppointments = async () => {
  const today = todayDateOnly();

  const appointments = await getAppointments();

  return appointments.filter((a) => a.date === today);
};

/**
 * Yaklaşan randevular (bugün dahil, varsayılan 7 gün).
 * İptal edilenler hariç.
 */
export const getUpcomingAppointments = async (days = 7) => {
  const today = todayDateOnly();
  const end = new Date();
  end.setDate(end.getDate() + days);
  const endStr = toDateOnly(end);

  const appointments = await getAppointments();

  return appointments.filter((a) => {
    if (!a.date) return false;
    if (a.status === "İptal") return false;
    return a.date >= today && a.date <= endStr;
  });
};

/**
 * Bugünden eski ve hâlâ açık (Tamamlandı / İptal değil) randevular.
 */
export const getOverdueAppointments = async () => {
  const today = todayDateOnly();
  const appointments = await getAppointments();

  return appointments.filter((a) => {
    if (!a.date || a.date >= today) return false;
    if (a.status === "Tamamlandı" || a.status === "İptal") return false;
    return true;
  });
};

export const getAppointmentCount = async () => {
  const appointments = await apiClient.getAll(RESOURCE);
  return appointments.length;
};

export const getLatestAppointments = async (limit = 5) => {
  const appointments = await getAppointments();
  return [...appointments].reverse().slice(0, limit);
};

export const getAnimalAppointments = async (animalId) => {
  const appointments = await getAppointments();

  return appointments.filter(
    (appointment) => String(appointment.animalId) === String(animalId)
  );
};

const toMinutes = (time) => {
  const [h, m] = (time || "0:0").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const isAppointmentConflict = async (
  { veterinarian, date, time, duration = 30 },
  excludeId = null
) => {
  if (!date || !time) return null;

  const startMinutes = toMinutes(time);
  const endMinutes = startMinutes + (Number(duration) || 30);
  const vet = (veterinarian || "").trim();

  const appointments = await apiClient.getAll(RESOURCE);

  const conflict = appointments.find((a) => {
    if (excludeId && String(a.id) === String(excludeId)) return false;
    if (a.status === "İptal") return false;
    if (a.date !== date) return false;

    // Veteriner boşsa klinik odası çakışması: aynı saatte herhangi bir
    // randevu çakışır. Veteriner doluysa aynı veterinerin programı kontrol
    // edilir (boş veterinerli kayıtlar da aynı slota engel olur).
    const otherVet = (a.veterinarian || "").trim();
    if (vet && otherVet && otherVet !== vet) return false;

    const aStart = toMinutes(a.time);
    const aEnd = aStart + (Number(a.duration) || 30);

    return startMinutes < aEnd && aStart < endMinutes;
  });

  return conflict || null;
};

export const getAppointmentsByDateRange = async (startDate, endDate) => {
  const appointments = await getAppointments();

  return appointments.filter(
    (a) => a.date >= startDate && a.date <= endDate
  );
};

/**
 * Belirli bir gün için slot doluluk özeti (08:00–20:00).
 * appointments verilmezse depodan okunur.
 */
export const getDayOccupancy = async (dateStr, appointments) => {
  const list =
    appointments != null ? appointments : await getAppointments();

  return calculateDayOccupancy(list, dateStr || todayDateOnly());
};
