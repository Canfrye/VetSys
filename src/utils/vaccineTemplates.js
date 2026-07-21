/**
 * Otomatik aşı takvimi — yaş hesabı, varsayılan şablon tohumu ve
 * öneri üreticileri. Çalışma zamanı şablonları Settings'ten gelir;
 * DEFAULT_VACCINE_TEMPLATES yalnızca ilk kurulum / eksik alan doldurma içindir.
 */

import { toDateOnly } from "./dateRange";

export const SCHEDULE_SPECIES = ["Kedi", "Köpek"];

export const AGE_GROUPS = {
  PUPPY: "Yavru",
  ADULT: "Yetişkin",
};

/** Settings UI ve validasyon için dört şablon yuvası. */
export const TEMPLATE_SLOTS = [
  { species: "Kedi", ageGroup: AGE_GROUPS.PUPPY, label: "Kedi Yavru" },
  { species: "Kedi", ageGroup: AGE_GROUPS.ADULT, label: "Kedi Yetişkin" },
  { species: "Köpek", ageGroup: AGE_GROUPS.PUPPY, label: "Köpek Yavru" },
  { species: "Köpek", ageGroup: AGE_GROUPS.ADULT, label: "Köpek Yetişkin" },
];

/** 12 aydan küçük → Yavru, 12 ay ve üzeri → Yetişkin */
export const PUPPY_MAX_MONTHS = 12;

/**
 * Sprint 14 varsayılan şablonları — klinik ilk açılışta Settings'e yazılır.
 * Otomatik takvim üretiminden değil, yalnızca seed / merge için kullanılır.
 */
export const DEFAULT_VACCINE_TEMPLATES = {
  Kedi: {
    [AGE_GROUPS.PUPPY]: [
      { vaccineName: "İç Parazit", dayOffset: 0 },
      { vaccineName: "Dış Parazit", dayOffset: 0 },
      { vaccineName: "Karma 1", dayOffset: 14 },
      { vaccineName: "Karma 2", dayOffset: 35 },
      { vaccineName: "Lösemi", dayOffset: 42 },
      { vaccineName: "Kuduz", dayOffset: 84 },
    ],
    [AGE_GROUPS.ADULT]: [
      { vaccineName: "Karma", dayOffset: 0 },
      { vaccineName: "Kuduz", dayOffset: 0 },
      { vaccineName: "İç Parazit", dayOffset: 0 },
      { vaccineName: "Dış Parazit", dayOffset: 0 },
    ],
  },
  Köpek: {
    [AGE_GROUPS.PUPPY]: [
      { vaccineName: "İç Parazit", dayOffset: 0 },
      { vaccineName: "Dış Parazit", dayOffset: 0 },
      { vaccineName: "Karma 1", dayOffset: 14 },
      { vaccineName: "Karma 2", dayOffset: 35 },
      { vaccineName: "Bronchine", dayOffset: 42 },
      { vaccineName: "Corona", dayOffset: 56 },
      { vaccineName: "Kuduz", dayOffset: 84 },
    ],
    [AGE_GROUPS.ADULT]: [
      { vaccineName: "Karma", dayOffset: 0 },
      { vaccineName: "Kuduz", dayOffset: 0 },
      { vaccineName: "İç Parazit", dayOffset: 0 },
      { vaccineName: "Dış Parazit", dayOffset: 0 },
    ],
  },
};

function cloneTemplates(templates) {
  return JSON.parse(JSON.stringify(templates));
}

/**
 * Eksik tür/yaş grubunu varsayılanlarla doldurur; bozuk satırları temizler.
 */
export function normalizeVaccineTemplates(templates) {
  const base = cloneTemplates(DEFAULT_VACCINE_TEMPLATES);
  const source = templates && typeof templates === "object" ? templates : {};

  SCHEDULE_SPECIES.forEach((species) => {
    if (!source[species] || typeof source[species] !== "object") return;

    Object.values(AGE_GROUPS).forEach((ageGroup) => {
      const list = source[species][ageGroup];

      if (!Array.isArray(list)) return;

      base[species][ageGroup] = list.map((item) => ({
        vaccineName: String(item?.vaccineName || "").trim(),
        dayOffset: Number(item?.dayOffset) || 0,
      }));
    });
  });

  return base;
}

/**
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateVaccineTemplates(templates) {
  const normalized = normalizeVaccineTemplates(templates);

  for (const slot of TEMPLATE_SLOTS) {
    const list = normalized[slot.species]?.[slot.ageGroup] || [];

    if (list.length === 0) {
      return {
        valid: false,
        error: `"${slot.label}" şablonu boş olamaz. En az bir aşı ekleyin.`,
      };
    }

    for (let i = 0; i < list.length; i += 1) {
      const item = list[i];

      if (!item.vaccineName?.trim()) {
        return {
          valid: false,
          error: `"${slot.label}" şablonunda ${i + 1}. satırın aşı adı boş olamaz.`,
        };
      }

      if (Number(item.dayOffset) < 0 || Number.isNaN(Number(item.dayOffset))) {
        return {
          valid: false,
          error: `"${slot.label}" şablonunda ${i + 1}. satırın gün ofseti negatif olamaz.`,
        };
      }
    }
  }

  return { valid: true, data: normalized };
}

/**
 * Doğum tarihinden bugüne (veya verilen tarihe) tam ay farkı.
 * Geçersiz / boş doğum tarihinde null döner.
 */
export function getAgeInMonths(birthDateStr, asOf = new Date()) {
  if (!birthDateStr) return null;

  const birth = new Date(birthDateStr);
  const end = asOf instanceof Date ? asOf : new Date(asOf);

  if (Number.isNaN(birth.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  if (birth > end) return 0;

  let months =
    (end.getFullYear() - birth.getFullYear()) * 12 +
    (end.getMonth() - birth.getMonth());

  if (end.getDate() < birth.getDate()) {
    months -= 1;
  }

  return Math.max(0, months);
}

export function getAgeGroup(ageInMonths) {
  if (ageInMonths == null || Number.isNaN(ageInMonths)) return null;

  return ageInMonths < PUPPY_MAX_MONTHS
    ? AGE_GROUPS.PUPPY
    : AGE_GROUPS.ADULT;
}

export function formatAgeLabel(ageInMonths) {
  if (ageInMonths == null) return "-";

  if (ageInMonths < 1) return "1 aydan küçük";

  if (ageInMonths === 1) return "1 ay";

  if (ageInMonths < 12) return `${ageInMonths} ay`;

  const years = Math.floor(ageInMonths / 12);
  const rem = ageInMonths % 12;

  if (rem === 0) {
    return years === 1 ? "1 yaş" : `${years} yaş`;
  }

  return `${years} yaş ${rem} ay`;
}

function addDaysToDateOnly(dateStr, days) {
  const base = new Date(dateStr);
  base.setHours(12, 0, 0, 0);
  base.setDate(base.getDate() + days);
  return toDateOnly(base);
}

/** Takvimde saat yoksa kullanılacak varsayılan klinik saati. */
export const DEFAULT_SCHEDULE_TIME = "09:00";

/** Aynı güne birden fazla aşı düşerse aralarındaki dakika. */
export const SCHEDULE_SLOT_MINUTES = 30;

/**
 * Belirli bir gündeki iptal edilmemiş randevuların en erken saatini döner.
 * Yoksa null.
 */
export function getFirstTimeOnDate(appointments = [], dateStr) {
  const times = appointments
    .filter(
      (a) =>
        a.date === dateStr &&
        a.time &&
        a.status !== "İptal"
    )
    .map((a) => a.time)
    .sort((a, b) => a.localeCompare(b));

  return times[0] || null;
}

function addMinutesToTime(time, minutesToAdd) {
  const [h, m] = (time || DEFAULT_SCHEDULE_TIME).split(":").map(Number);
  const total = (h || 0) * 60 + (m || 0) + minutesToAdd;
  const nh = Math.floor(total / 60) % 24;
  const nm = ((total % 60) + 60) % 60;

  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

/**
 * Öneriye randevu saatlerini ekler.
 * Başlangıç günündeki ilk randevu saati (yoksa 09:00) tüm günlere temel alınır;
 * aynı güne birden fazla aşı düşerse 30 dk arayla sıralanır.
 */
export function attachScheduleAppointmentTimes(proposal, appointments = []) {
  if (!proposal) return null;

  const baseTime =
    getFirstTimeOnDate(appointments, proposal.startDate) ||
    DEFAULT_SCHEDULE_TIME;

  const dayIndex = {};

  const vaccines = proposal.vaccines.map((item) => {
    const indexOnDay = dayIndex[item.applicationDate] || 0;
    dayIndex[item.applicationDate] = indexOnDay + 1;

    return {
      ...item,
      appointmentTime: addMinutesToTime(
        baseTime,
        indexOnDay * SCHEDULE_SLOT_MINUTES
      ),
    };
  });

  return {
    ...proposal,
    appointmentTime: baseTime,
    vaccines,
  };
}

/**
 * Hayvan için önerilen aşı takvimini üretir.
 * Şablonlar Settings'ten gelmelidir (üçüncü parametre).
 *
 * @param {object} animal
 * @param {string} [startDate]
 * @param {object} [templates] - Settings.vaccineTemplates
 */
export function buildVaccineScheduleProposal(
  animal,
  startDate,
  templates
) {
  if (!animal?.species) return null;

  if (!SCHEDULE_SPECIES.includes(animal.species)) return null;

  const ageInMonths = getAgeInMonths(animal.birthDate);

  if (ageInMonths == null) return null;

  const ageGroup = getAgeGroup(ageInMonths);
  const catalog = normalizeVaccineTemplates(templates);
  const template = catalog[animal.species]?.[ageGroup];

  if (!template || template.length === 0) return null;

  const baseDate = startDate || toDateOnly(new Date());

  const vaccines = template.map((item) => ({
    vaccineName: item.vaccineName,
    dayOffset: Number(item.dayOffset) || 0,
    applicationDate: addDaysToDateOnly(
      baseDate,
      Number(item.dayOffset) || 0
    ),
  }));

  return {
    animalId: animal.id,
    animalName: animal.name,
    ownerId: animal.ownerId,
    ownerName: animal.ownerName,
    species: animal.species,
    birthDate: animal.birthDate,
    ageInMonths,
    ageGroup,
    ageLabel: formatAgeLabel(ageInMonths),
    startDate: baseDate,
    vaccines,
  };
}

/** Otomatik takvim kayıtlarını ayırt etmek için not etiketi. */
export const AUTO_SCHEDULE_NOTE = "Otomatik aşı takvimi";

export function isAutoScheduleVaccine(vaccine) {
  return String(vaccine?.notes || "").includes(AUTO_SCHEDULE_NOTE);
}

export function isAutoScheduleAppointment(appointment) {
  return String(appointment?.note || "").includes(AUTO_SCHEDULE_NOTE);
}

export function animalHasAutoSchedule(vaccines = [], animalId) {
  return vaccines.some(
    (v) =>
      String(v.animalId) === String(animalId) && isAutoScheduleVaccine(v)
  );
}

function namesEqual(a, b) {
  return (
    String(a || "")
      .trim()
      .toLocaleLowerCase("tr") ===
    String(b || "")
      .trim()
      .toLocaleLowerCase("tr")
  );
}

/**
 * Otomatik aşıya bağlı otomatik randevuyu bulur (hayvan + tarih + aşı adı).
 */
export function findLinkedAutoAppointment(vaccine, appointments = []) {
  if (!vaccine) return null;

  return (
    appointments.find(
      (a) =>
        String(a.animalId) === String(vaccine.animalId) &&
        a.date === vaccine.applicationDate &&
        isAutoScheduleAppointment(a) &&
        String(a.reason || "").includes(String(vaccine.vaccineName || ""))
    ) || null
  );
}

/**
 * Tamamlanmış otomatik aşı: bağlı randevu "Tamamlandı" veya vaccine.status.
 */
export function isCompletedScheduleVaccine(vaccine, appointments = []) {
  if (!isAutoScheduleVaccine(vaccine)) return false;

  if (vaccine.status === "Tamamlandı") return true;

  const apt = findLinkedAutoAppointment(vaccine, appointments);
  return apt?.status === "Tamamlandı";
}

/** Silinebilir / yeniden oluşturulabilir otomatik aşı. */
export function isPendingAutoScheduleVaccine(vaccine, appointments = []) {
  return (
    isAutoScheduleVaccine(vaccine) &&
    !isCompletedScheduleVaccine(vaccine, appointments)
  );
}

/**
 * Aynı hayvan + aşı adı + tarih + doz varsa tekrar oluşturma.
 */
export function isDuplicateScheduleVaccine(existingVaccines = [], candidate) {
  return existingVaccines.some(
    (v) =>
      String(v.animalId) === String(candidate.animalId) &&
      namesEqual(v.vaccineName, candidate.vaccineName) &&
      v.applicationDate === candidate.applicationDate &&
      String(v.dose || "") === String(candidate.dose || "")
  );
}

/**
 * Öneriden yalnızca eksik aşıları bırakır; atlananları ayrıca döner.
 */
export function filterMissingScheduleVaccines(
  proposal,
  existingVaccines = []
) {
  if (!proposal) {
    return { toCreate: [], skipped: [] };
  }

  const toCreate = [];
  const skipped = [];

  proposal.vaccines.forEach((item) => {
    const candidate = {
      animalId: proposal.animalId,
      vaccineName: item.vaccineName,
      applicationDate: item.applicationDate,
      dose: item.dose || "",
    };

    if (isDuplicateScheduleVaccine(existingVaccines, candidate)) {
      skipped.push(item);
    } else {
      toCreate.push(item);
    }
  });

  return { toCreate, skipped };
}

/**
 * Hayvan detayı — Aşı Takvimi Durumu kartı özeti.
 */
export function buildVaccineScheduleStatus(
  animalId,
  vaccines = [],
  appointments = []
) {
  const auto = vaccines.filter(
    (v) =>
      String(v.animalId) === String(animalId) && isAutoScheduleVaccine(v)
  );

  const completed = auto.filter((v) =>
    isCompletedScheduleVaccine(v, appointments)
  );
  const pending = auto.filter(
    (v) => !isCompletedScheduleVaccine(v, appointments)
  );

  const next = [...pending].sort((a, b) =>
    String(a.applicationDate || "").localeCompare(
      String(b.applicationDate || "")
    )
  )[0];

  return {
    totalPlanned: auto.length,
    completedCount: completed.length,
    pendingCount: pending.length,
    nextVaccineName: next?.vaccineName || null,
    nextVaccineDate: next?.applicationDate || null,
    hasAutoSchedule: auto.length > 0,
  };
}
