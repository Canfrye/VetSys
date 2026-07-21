/**
 * Son kullanılan seçimler — Settings içinde saklanır (yeni storage key yok).
 */

import { getSettings, saveSettings } from "../services/settingsService";

const MAX_RECENT = 10;

function normalizeList(list = []) {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => {
      if (typeof item === "string") {
        const value = item.trim();
        return value ? value : null;
      }
      if (item && typeof item === "object") {
        const breed = String(item.breed || "").trim();
        if (!breed) return null;
        return {
          breed,
          species: String(item.species || "").trim(),
        };
      }
      return null;
    })
    .filter(Boolean);
}

export function pushRecentUnique(list, item, max = MAX_RECENT) {
  const normalized = normalizeList(list);
  const key =
    typeof item === "string"
      ? item.trim().toLocaleLowerCase("tr")
      : `${item.species || ""}::${item.breed || ""}`.toLocaleLowerCase("tr");

  const next = normalized.filter((entry) => {
    const entryKey =
      typeof entry === "string"
        ? entry.toLocaleLowerCase("tr")
        : `${entry.species || ""}::${entry.breed || ""}`.toLocaleLowerCase(
            "tr"
          );
    return entryKey !== key;
  });

  next.unshift(item);
  return next.slice(0, max);
}

export async function rememberRecentBreed(species, breed) {
  const cleaned = String(breed || "").trim();
  if (!cleaned) return;

  const settings = await getSettings();
  const recentBreeds = pushRecentUnique(settings.recentBreeds, {
    species: species || "",
    breed: cleaned,
  });

  await saveSettings({
    ...settings,
    recentBreeds,
  });
}

export async function rememberRecentValue(field, value) {
  const cleaned = String(value || "").trim();
  if (!cleaned || !field) return;

  const settings = await getSettings();
  const recentSelections = {
    ...(settings.recentSelections || {}),
    [field]: pushRecentUnique(settings.recentSelections?.[field], cleaned),
  };

  await saveSettings({
    ...settings,
    recentSelections,
  });
}

export const DEFAULT_VACCINE_NAMES = [
  "Kuduz",
  "Karma",
  "Karma 1",
  "Karma 2",
  "Lösemi",
  "Bronchine",
  "Corona",
  "İç Parazit",
  "Dış Parazit",
  "Lyme",
  "Bordetella",
  "Diğer",
];

export const DEFAULT_MEDICATION_NAMES = [
  "Amoksisilin",
  "Enrofloksasin",
  "Metronidazol",
  "Prednizolon",
  "Meloksikam",
  "Tramadol",
  "Doksisiklin",
  "Sefaleksin",
  "Furosemid",
  "Omeprazol",
];

/**
 * Katalog + son kullanılan + kayıtlı değerleri birleştirir.
 */
export function mergeSuggestionLists({
  catalog = [],
  recent = [],
  extras = [],
} = {}) {
  const seen = new Set();
  const result = [];

  function push(value) {
    const cleaned = String(value || "").trim();
    if (!cleaned) return;
    const key = cleaned.toLocaleLowerCase("tr");
    if (seen.has(key)) return;
    seen.add(key);
    result.push(cleaned);
  }

  normalizeList(recent).forEach((item) =>
    push(typeof item === "string" ? item : item.breed)
  );
  catalog.forEach(push);
  extras.forEach(push);

  return result;
}
