/**
 * Hizmet kataloğu — Settings.serviceFees içinde saklanır.
 * Yeni storage key yok.
 */

export const DEFAULT_SERVICE_FEES = [
  {
    id: "genel-muayene",
    name: "Genel Muayene",
    defaultPrice: 500,
    active: true,
    category: "Muayene",
  },
  {
    id: "kontrol-muayene",
    name: "Kontrol Muayenesi",
    defaultPrice: 350,
    active: true,
    category: "Muayene",
  },
  {
    id: "acil-muayene",
    name: "Acil Muayene",
    defaultPrice: 750,
    active: true,
    category: "Muayene",
  },
  {
    id: "cerrahi",
    name: "Cerrahi İşlem",
    defaultPrice: 2500,
    active: true,
    category: "Tedavi",
  },
  {
    id: "serum",
    name: "Serum",
    defaultPrice: 200,
    active: true,
    category: "Tedavi",
  },
  {
    id: "pansuman",
    name: "Pansuman",
    defaultPrice: 150,
    active: true,
    category: "Tedavi",
  },
  {
    id: "tirnak",
    name: "Tırnak Kesimi",
    defaultPrice: 100,
    active: true,
    category: "Tedavi",
  },
  {
    id: "mikrochip",
    name: "Mikroçip",
    defaultPrice: 400,
    active: true,
    category: "Tedavi",
  },
  {
    id: "asi-uygulama",
    name: "Aşı Uygulama",
    defaultPrice: 250,
    active: true,
    category: "Aşı",
  },
  {
    id: "diger",
    name: "Diğer",
    defaultPrice: 0,
    active: true,
    category: "Tedavi",
  },
];

function slugify(name) {
  return String(name || "")
    .trim()
    .toLocaleLowerCase("tr")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9çğıöşü-]/gi, "");
}

export function normalizeMoney(value) {
  if (value === "" || value == null) return 0;
  const num = Number(value);
  if (Number.isNaN(num) || num < 0) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function normalizeServiceFees(fees) {
  const source = Array.isArray(fees) ? fees : [];
  const byName = new Map();

  source.forEach((item) => {
    const name = String(item?.name || "").trim();
    if (!name) return;

    byName.set(name.toLocaleLowerCase("tr"), {
      id: item.id || slugify(name),
      name,
      defaultPrice: normalizeMoney(item.defaultPrice),
      active: item.active !== false,
      category: item.category || "Tedavi",
    });
  });

  // Eksik varsayılanları ekle
  DEFAULT_SERVICE_FEES.forEach((def) => {
    const key = def.name.toLocaleLowerCase("tr");
    if (!byName.has(key)) {
      byName.set(key, { ...def });
    }
  });

  return Array.from(byName.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "tr")
  );
}

export function validateServiceFees(fees) {
  const normalized = normalizeServiceFees(fees);

  for (let i = 0; i < normalized.length; i += 1) {
    const row = normalized[i];
    if (!row.name.trim()) {
      return {
        valid: false,
        error: `${i + 1}. satırda hizmet adı boş olamaz.`,
      };
    }
    if (Number(row.defaultPrice) < 0) {
      return {
        valid: false,
        error: `"${row.name}" ücreti 0'dan küçük olamaz.`,
      };
    }
  }

  return { valid: true, data: normalized };
}

export function getActiveServiceFees(fees) {
  return normalizeServiceFees(fees).filter((s) => s.active);
}

export function getExamTypeOptions(fees) {
  return getActiveServiceFees(fees).filter(
    (s) => s.category === "Muayene" || s.name.toLocaleLowerCase("tr").includes("muayene")
  );
}

export function findServiceByName(fees, name) {
  const needle = String(name || "")
    .trim()
    .toLocaleLowerCase("tr");
  if (!needle) return null;

  return (
    normalizeServiceFees(fees).find(
      (s) => s.name.toLocaleLowerCase("tr") === needle
    ) || null
  );
}

export function getServiceDefaultPrice(fees, name) {
  const found = findServiceByName(fees, name);
  return found ? found.defaultPrice : 0;
}
