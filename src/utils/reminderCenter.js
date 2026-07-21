/**
 * Hatırlatma Merkezi — mevcut aşı / kontrol / randevu kayıtlarından
 * bölümler üretir. Yeni veri modeli yok.
 */

import { todayDateOnly } from "./dateRange";
import {
  FOLLOW_UP_KIND,
  appointmentToFollowUp,
  vaccineToFollowUp,
  controlToFollowUp,
  isActiveAppointment,
} from "./followUpTracking";
import {
  getReminderEntry,
  isUnsentReminder,
  needsReRemind,
  addDaysToDateOnly,
} from "./reminderStatus";

function tomorrowDateOnly() {
  return addDaysToDateOnly(todayDateOnly(), 1);
}

function weekEndDateOnly() {
  return addDaysToDateOnly(todayDateOnly(), 7);
}

function enrichItem(item, { customersById, statuses }) {
  const ownerId = item.source?.ownerId;
  const customer = ownerId ? customersById.get(String(ownerId)) : null;
  const phone = customer?.telefon || "";
  const email = customer?.email || "";
  const reminder = getReminderEntry(statuses, item.id);

  return {
    ...item,
    ownerId: ownerId || "",
    phone,
    email,
    veterinarian: item.source?.veterinarian || "",
    reminderStatus: reminder.status,
    reminderSentAt: reminder.sentAt,
    remindAgainAt: reminder.remindAgainAt,
    reminderChannel: reminder.channel,
    needsReRemind: needsReRemind(reminder),
    isUnsent: isUnsentReminder(reminder),
  };
}

function sortItems(a, b) {
  const dateCmp = (a.date || "").localeCompare(b.date || "");
  if (dateCmp !== 0) return dateCmp;
  return (a.time || "").localeCompare(b.time || "");
}

/**
 * Tüm hatırlatma bölümlerini üretir.
 */
export function buildReminderCenter({
  vaccines = [],
  appointments = [],
  controls = [],
  overdueVaccines = [],
  overdueControls = [],
  customers = [],
  reminderStatuses = {},
} = {}) {
  const today = todayDateOnly();
  const tomorrow = tomorrowDateOnly();
  const weekEnd = weekEndDateOnly();

  const customersById = new Map(
    customers.map((c) => [String(c.id), c])
  );

  const enrich = (item) =>
    enrichItem(item, { customersById, statuses: reminderStatuses });

  const todayVaccines = vaccines
    .filter((v) => v.nextDoseDate === today)
    .map((v) => enrich(vaccineToFollowUp(v)))
    .sort(sortItems);

  const tomorrowVaccines = vaccines
    .filter((v) => v.nextDoseDate === tomorrow)
    .map((v) => enrich(vaccineToFollowUp(v)))
    .sort(sortItems);

  const weekVaccines = vaccines
    .filter(
      (v) =>
        v.nextDoseDate &&
        v.nextDoseDate >= today &&
        v.nextDoseDate <= weekEnd
    )
    .map((v) => enrich(vaccineToFollowUp(v)))
    .sort(sortItems);

  const todayControls = controls
    .filter((e) => e.controlDate === today)
    .map((e) => enrich(controlToFollowUp(e)))
    .sort(sortItems);

  const upcomingControls = controls
    .filter(
      (e) =>
        e.controlDate &&
        e.controlDate > today &&
        e.controlDate <= weekEnd
    )
    .map((e) => enrich(controlToFollowUp(e)))
    .sort(sortItems);

  const upcomingAppointments = appointments
    .filter(isActiveAppointment)
    .filter(
      (a) => a.date && a.date >= today && a.date <= weekEnd
    )
    .map((a) => enrich(appointmentToFollowUp(a)))
    .sort(sortItems);

  const overdueVaccineItems = overdueVaccines
    .map((v) => enrich(vaccineToFollowUp(v, { overdue: true })))
    .sort(sortItems);

  const overdueControlItems = overdueControls
    .map((e) => enrich(controlToFollowUp(e, { overdue: true })))
    .sort(sortItems);

  const sections = [
    { key: "todayVaccines", title: "Bugünkü Aşılar", items: todayVaccines },
    { key: "tomorrowVaccines", title: "Yarınki Aşılar", items: tomorrowVaccines },
    {
      key: "weekVaccines",
      title: "7 Gün İçindeki Aşılar",
      items: weekVaccines,
    },
    {
      key: "todayControls",
      title: "Bugünkü Kontroller",
      items: todayControls,
    },
    {
      key: "upcomingControls",
      title: "Yaklaşan Kontroller",
      items: upcomingControls,
    },
    {
      key: "upcomingAppointments",
      title: "Yaklaşan Randevular",
      items: upcomingAppointments,
    },
    {
      key: "overdueVaccines",
      title: "Geciken Aşılar",
      items: overdueVaccineItems,
    },
    {
      key: "overdueControls",
      title: "Geciken Kontroller",
      items: overdueControlItems,
    },
  ];

  const allMap = new Map();
  sections.forEach((section) => {
    section.items.forEach((item) => {
      if (!allMap.has(item.id)) allMap.set(item.id, item);
    });
  });

  const all = Array.from(allMap.values()).sort(sortItems);

  const todayItems = all.filter((item) => item.date === today);
  const upcomingItems = all.filter(
    (item) => item.date && item.date >= today && item.daysUntil >= 0
  );
  const unsentItems = all.filter((item) => item.isUnsent);
  const overdueItems = all.filter((item) => item.daysUntil < 0);

  return {
    sections,
    all,
    todayItems,
    upcomingItems,
    unsentItems,
    overdueItems,
    counts: {
      today: todayItems.length,
      upcoming: upcomingItems.length,
      unsent: unsentItems.length,
      overdue: overdueItems.length,
    },
  };
}

/**
 * Hatırlatma listesi filtreleri.
 */
export function filterReminderItems(items = [], filters = {}) {
  const {
    kind = "all",
    period = "all",
    status = "all",
    veterinarian = "",
    search = "",
  } = filters;

  const today = todayDateOnly();
  const weekEnd = weekEndDateOnly();
  const query = String(search || "")
    .trim()
    .toLocaleLowerCase("tr");

  return items.filter((item) => {
    if (kind !== "all" && item.kind !== kind) return false;

    if (period === "today" && item.date !== today) return false;
    if (period === "week") {
      if (!item.date || item.date < today || item.date > weekEnd) return false;
    }
    if (period === "overdue" && !(item.daysUntil < 0)) return false;

    if (status !== "all") {
      if (status === "unsent" && !item.isUnsent) return false;
      if (
        status !== "unsent" &&
        item.reminderStatus !== status
      ) {
        return false;
      }
    }

    if (veterinarian) {
      const vet = String(item.veterinarian || "").toLocaleLowerCase("tr");
      if (!vet.includes(String(veterinarian).toLocaleLowerCase("tr"))) {
        return false;
      }
    }

    if (query) {
      const haystack = [
        item.animalName,
        item.ownerName,
        item.phone,
        item.title,
        item.kindLabel,
        item.veterinarian,
        item.date,
      ]
        .join(" ")
        .toLocaleLowerCase("tr");

      if (!haystack.includes(query)) return false;
    }

    return true;
  });
}

export function collectVeterinarianOptions(items = []) {
  const set = new Set();
  items.forEach((item) => {
    const vet = String(item.veterinarian || "").trim();
    if (vet) set.add(vet);
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b, "tr"));
}

export { FOLLOW_UP_KIND };
