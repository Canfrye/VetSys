import { STORAGE_KEYS } from "../utils/storage";
import apiClient from "./apiClient";
import { todayDateOnly, toDateOnly } from "../utils/dateRange";
import { getSettings } from "./settingsService";
import {
  addAppointment,
  deleteAppointment,
  getAppointments,
  getAnimalAppointments,
} from "./appointmentService";
import {
  AUTO_SCHEDULE_NOTE,
  animalHasAutoSchedule,
  attachScheduleAppointmentTimes,
  buildVaccineScheduleProposal,
  buildVaccineScheduleStatus,
  filterMissingScheduleVaccines,
  findLinkedAutoAppointment,
  isAutoScheduleAppointment,
  isCompletedScheduleVaccine,
  isDuplicateScheduleVaccine,
  isPendingAutoScheduleVaccine,
  SCHEDULE_SPECIES,
} from "../utils/vaccineTemplates";
import { createAuditLog } from "./auditLogService";
import { AUDIT_ACTIONS, AUDIT_MODULES } from "../utils/auditLog";

const RESOURCE = STORAGE_KEYS.VACCINES;

/* ---------------- CRUD ---------------- */

export const getVaccines = async () => {
  const vaccines = await apiClient.getAll(RESOURCE);

  return [...vaccines].sort(
    (a, b) =>
      new Date(a.nextDoseDate || "2999-01-01") -
      new Date(b.nextDoseDate || "2999-01-01")
  );
};

export const getVaccineById = (id) => apiClient.getById(RESOURCE, id);

export const addVaccine = async (vaccine, options = {}) => {
  const saved = await apiClient.create(RESOURCE, {
    animalId: vaccine.animalId,
    animalName: vaccine.animalName,

    ownerId: vaccine.ownerId,
    ownerName: vaccine.ownerName,

    vaccineName: vaccine.vaccineName,
    brand: vaccine.brand || "",
    batchNo: vaccine.batchNo || "",

    dose: vaccine.dose || "",

    applicationDate: vaccine.applicationDate,

    nextDoseDate: vaccine.nextDoseDate || "",

    fee: vaccine.fee === "" || vaccine.fee == null ? null : Number(vaccine.fee),

    veterinarian: vaccine.veterinarian || "",

    notes: vaccine.notes || "",

    status: vaccine.status || "",
  });

  if (!options.skipAudit) {
    await createAuditLog({
      module: AUDIT_MODULES.VACCINE,
      action: AUDIT_ACTIONS.CREATE,
      description: `${saved.animalName || ""} için ${saved.vaccineName || "aşı"} oluşturuldu`.trim(),
      entityId: saved.id,
      animalId: saved.animalId || "",
      ownerId: saved.ownerId || "",
    });
  }

  return saved;
};

export const updateVaccine = async (vaccine, options = {}) => {
  const previous = options.previous || (await getVaccineById(vaccine.id));
  const saved = await apiClient.update(RESOURCE, vaccine.id, vaccine);

  if (!saved || options.skipAudit) return saved;

  const completed =
    previous?.status !== "Tamamlandı" && saved.status === "Tamamlandı";

  await createAuditLog({
    module: AUDIT_MODULES.VACCINE,
    action: completed ? AUDIT_ACTIONS.COMPLETE : AUDIT_ACTIONS.UPDATE,
    description: completed
      ? `${saved.animalName || ""} için ${saved.vaccineName || "aşı"} tamamlandı`
      : `${saved.animalName || ""} için ${saved.vaccineName || "aşı"} güncellendi`,
    entityId: saved.id,
    animalId: saved.animalId || "",
    ownerId: saved.ownerId || "",
  });

  return saved;
};

export const deleteVaccine = async (id, options = {}) => {
  const existing = await getVaccineById(id);
  await apiClient.remove(RESOURCE, id);

  if (!options.skipAudit) {
    await createAuditLog({
      module: AUDIT_MODULES.VACCINE,
      action: AUDIT_ACTIONS.DELETE,
      description: `Aşı silindi: ${existing?.vaccineName || id} (${existing?.animalName || ""})`.trim(),
      entityId: id,
      animalId: existing?.animalId || "",
      ownerId: existing?.ownerId || "",
    });
  }
};

export const deleteVaccinesByAnimalId = (animalId) => {
  return apiClient.removeWhere(
    RESOURCE,
    (v) => String(v.animalId) === String(animalId)
  );
};

export const deleteVaccinesByOwnerId = (ownerId) => {
  return apiClient.removeWhere(
    RESOURCE,
    (v) => String(v.ownerId) === String(ownerId)
  );
};

export const syncOwnerName = (ownerId, ownerName) => {
  return apiClient.updateWhere(
    RESOURCE,
    (v) => String(v.ownerId) === String(ownerId),
    () => ({ ownerName })
  );
};

export const syncAnimalName = (animalId, animalName) => {
  return apiClient.updateWhere(
    RESOURCE,
    (v) => String(v.animalId) === String(animalId),
    () => ({ animalName })
  );
};

export const syncOwnerForAnimal = (animalId, ownerId, ownerName) => {
  return apiClient.updateWhere(
    RESOURCE,
    (v) => String(v.animalId) === String(animalId),
    () => ({ ownerId, ownerName })
  );
};

export const getAnimalVaccines = async (animalId) => {
  const vaccines = await getVaccines();

  return vaccines.filter(
    (vaccine) => String(vaccine.animalId) === String(animalId)
  );
};

export const getUpcomingVaccines = async (days = 7) => {
  const today = todayDateOnly();
  const end = new Date();
  end.setDate(end.getDate() + days);
  const endStr = toDateOnly(end);

  const vaccines = await getVaccines();

  return vaccines.filter((v) => {
    if (!v.nextDoseDate) return false;
    return v.nextDoseDate >= today && v.nextDoseDate <= endStr;
  });
};

export const getTodayVaccines = async () => {
  const today = todayDateOnly();

  const vaccines = await getVaccines();

  return vaccines.filter((v) => v.nextDoseDate === today);
};

/** nextDoseDate bugünden eski olan aşılar (tamamlanmamış hatırlatma). */
export const getOverdueVaccines = async () => {
  const today = todayDateOnly();
  const vaccines = await getVaccines();

  return vaccines.filter(
    (v) => v.nextDoseDate && v.nextDoseDate < today
  );
};

export const getVaccineCount = async () => {
  const vaccines = await apiClient.getAll(RESOURCE);
  return vaccines.length;
};

export const getLatestVaccines = async (limit = 5) => {
  const vaccines = await getVaccines();
  return vaccines.slice(0, limit);
};

/**
 * prepareVaccineSchedule hata kodlarını kullanıcı mesajına çevirir.
 */
export function schedulePrepareErrorMessage(reason) {
  switch (reason) {
    case "unsupported_species":
      return "Otomatik aşı takvimi yalnızca Kedi ve Köpek için kullanılabilir.";
    case "missing_birth_date":
      return "Aşı takvimi için hayvanın doğum tarihi gerekli.";
    case "empty_template":
      return "Bu tür/yaş için aşı şablonu boş. Ayarlardan şablon ekleyin.";
    default:
      return "Aşı takvimi hazırlanamadı.";
  }
}

/**
 * Hayvan için aşı takvimi önerisini hazırlar (önizleme + dedupe).
 */
export async function prepareVaccineSchedule(
  animal,
  startDate = todayDateOnly()
) {
  if (!animal?.id) {
    return { ok: false, reason: "missing_animal" };
  }

  if (!SCHEDULE_SPECIES.includes(animal.species)) {
    return { ok: false, reason: "unsupported_species" };
  }

  if (!animal.birthDate) {
    return { ok: false, reason: "missing_birth_date" };
  }

  const settings = await getSettings();
  const baseProposal = buildVaccineScheduleProposal(
    animal,
    startDate,
    settings.vaccineTemplates
  );

  if (!baseProposal || baseProposal.vaccines.length === 0) {
    return { ok: false, reason: "empty_template" };
  }

  const [existingVaccines, appointments] = await Promise.all([
    getAnimalVaccines(animal.id),
    getAppointments(),
  ]);

  const withTimes = attachScheduleAppointmentTimes(
    baseProposal,
    appointments
  );

  const { toCreate, skipped } = filterMissingScheduleVaccines(
    withTimes,
    existingVaccines
  );

  const completedCount = existingVaccines.filter((v) =>
    isCompletedScheduleVaccine(v, appointments)
  ).length;

  const alreadyExistCount = skipped.length;

  return {
    ok: true,
    hasExistingAutoSchedule: animalHasAutoSchedule(
      existingVaccines,
      animal.id
    ),
    proposal: {
      ...withTimes,
      vaccines: toCreate,
      skippedVaccines: skipped,
      templateVaccineCount: withTimes.vaccines.length,
      veterinarian: settings.veterinarian?.trim() || "",
      stats: {
        templateTotal: withTimes.vaccines.length,
        toCreate: toCreate.length,
        alreadyExist: alreadyExistCount,
        completed: completedCount,
        appointmentsToCreate: toCreate.length,
      },
    },
  };
}

/**
 * Uygulanmamış (bekleyen) otomatik aşı + otomatik randevuları siler.
 * Tamamlanmış otomatik aşılar, manuel aşılar ve manuel randevular korunur.
 */
export async function deletePendingAutoVaccineSchedule(animalId, options = {}) {
  const [vaccines, appointments] = await Promise.all([
    getAnimalVaccines(animalId),
    getAnimalAppointments(animalId),
  ]);

  const pendingVaccines = vaccines.filter((v) =>
    isPendingAutoScheduleVaccine(v, appointments)
  );

  let deletedVaccines = 0;
  let deletedAppointments = 0;
  const animalName = vaccines[0]?.animalName || appointments[0]?.animalName || "";
  const ownerId = vaccines[0]?.ownerId || appointments[0]?.ownerId || "";

  for (const vaccine of pendingVaccines) {
    const linked = findLinkedAutoAppointment(vaccine, appointments);

    await deleteVaccine(vaccine.id, { skipAudit: true });
    deletedVaccines += 1;

    if (linked && linked.status !== "Tamamlandı") {
      await deleteAppointment(linked.id, { skipAudit: true });
      deletedAppointments += 1;
    }
  }

  // Bağlı aşı silinmiş / yetim kalan bekleyen otomatik randevular
  const remainingApts = await getAnimalAppointments(animalId);
  for (const apt of remainingApts) {
    if (
      isAutoScheduleAppointment(apt) &&
      apt.status !== "Tamamlandı" &&
      apt.status !== "İptal"
    ) {
      await deleteAppointment(apt.id, { skipAudit: true });
      deletedAppointments += 1;
    }
  }

  if (
    !options.skipAudit &&
    (deletedVaccines > 0 || deletedAppointments > 0)
  ) {
    await createAuditLog({
      module: AUDIT_MODULES.VACCINE,
      action: AUDIT_ACTIONS.DELETE,
      description: `${animalName || "Hayvan"} için otomatik aşı takvimi silindi (${deletedVaccines} aşı)`,
      entityId: animalId,
      animalId,
      ownerId,
    });
  }

  return { deletedVaccines, deletedAppointments };
}

/**
 * Bekleyen otomatik takvimi siler, ardından şablondan yeniden hazırlar.
 * Önizleme için proposal döner (henüz yazmaz — apply ayrı çağrılır).
 */
export async function prepareVaccineScheduleRecreate(
  animal,
  startDate = todayDateOnly()
) {
  const deleted = await deletePendingAutoVaccineSchedule(animal.id, {
    skipAudit: true,
  });
  const prepared = await prepareVaccineSchedule(animal, startDate);

  return { deleted, ...prepared };
}

/**
 * Hayvan için aşı takvimi durum özeti (detay kartı).
 */
export async function getVaccineScheduleStatus(animalId) {
  const [vaccines, appointments] = await Promise.all([
    getAnimalVaccines(animalId),
    getAnimalAppointments(animalId),
  ]);

  return buildVaccineScheduleStatus(animalId, vaccines, appointments);
}

/**
 * Önizlemedeki eksik aşı + randevu kayıtlarını oluşturur.
 * Aynı aşı/tarih/doz varsa atlanır (çift koruma).
 * @param {object} proposal
 * @param {{ recreate?: boolean }} [options]
 */
export async function applyVaccineScheduleProposal(proposal, options = {}) {
  if (!proposal?.animalId || !proposal.vaccines?.length) {
    return { createdVaccines: 0, createdAppointments: 0, skipped: 0 };
  }

  const existingVaccines = await getAnimalVaccines(proposal.animalId);
  const veterinarian = proposal.veterinarian || "";
  let createdVaccines = 0;
  let createdAppointments = 0;
  let skipped = 0;

  for (const item of proposal.vaccines) {
    const candidate = {
      animalId: proposal.animalId,
      vaccineName: item.vaccineName,
      applicationDate: item.applicationDate,
      dose: item.dose || "",
    };

    if (isDuplicateScheduleVaccine(existingVaccines, candidate)) {
      skipped += 1;
      continue;
    }

    const time = item.appointmentTime || proposal.appointmentTime || "09:00";

    await addVaccine(
      {
        animalId: proposal.animalId,
        animalName: proposal.animalName,
        ownerId: proposal.ownerId,
        ownerName: proposal.ownerName,
        vaccineName: item.vaccineName,
        dose: item.dose || "",
        applicationDate: item.applicationDate,
        nextDoseDate: "",
        veterinarian,
        notes: AUTO_SCHEDULE_NOTE,
        status: "Bekliyor",
      },
      { skipAudit: true }
    );
    createdVaccines += 1;

    existingVaccines.push({
      ...candidate,
      notes: AUTO_SCHEDULE_NOTE,
      status: "Bekliyor",
    });

    await addAppointment(
      {
        animalId: proposal.animalId,
        animalName: proposal.animalName,
        ownerId: proposal.ownerId,
        ownerName: proposal.ownerName,
        date: item.applicationDate,
        time,
        duration: 30,
        veterinarian,
        reason: `Aşı: ${item.vaccineName}`,
        status: "Bekliyor",
        note: AUTO_SCHEDULE_NOTE,
      },
      { skipAudit: true }
    );
    createdAppointments += 1;
  }

  if (createdVaccines > 0 || createdAppointments > 0) {
    await createAuditLog({
      module: AUDIT_MODULES.VACCINE,
      action: options.recreate
        ? AUDIT_ACTIONS.RESCHEDULE
        : AUDIT_ACTIONS.SCHEDULE,
      description: options.recreate
        ? `${proposal.animalName || ""} için aşı takvimi yeniden oluşturuldu (${createdVaccines} aşı)`
        : `${proposal.animalName || ""} için aşı takvimi oluşturuldu (${createdVaccines} aşı)`,
      entityId: proposal.animalId,
      animalId: proposal.animalId,
      ownerId: proposal.ownerId || "",
    });
  }

  return { createdVaccines, createdAppointments, skipped };
}
