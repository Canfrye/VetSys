export const STORAGE_KEYS = {
  CUSTOMERS: "vetsys_customers",
  ANIMALS: "vetsys_animals",
  APPOINTMENTS: "vetsys_appointments",
  VACCINES: "vetsys_vaccines",
  EXAMINATIONS: "vetsys_examinations",
  STOCK: "vetsys_stock",
  STOCK_MOVEMENTS: "vetsys_stock_movements",
  INVOICES: "vetsys_invoices",
  PRESCRIPTIONS: "vetsys_prescriptions",
  PAYMENTS: "vetsys_payments",
  USERS: "vetsys_users",
  SETTINGS: "vetsys_settings",
  SESSION: "vetsys_session",
  PRE_RESTORE_SNAPSHOT: "vetsys_pre_restore_snapshot",
};

const LEGACY_KEY_MAP = {
  customers: STORAGE_KEYS.CUSTOMERS,
};

export const BACKUP_KEYS = [
  STORAGE_KEYS.CUSTOMERS,
  STORAGE_KEYS.ANIMALS,
  STORAGE_KEYS.APPOINTMENTS,
  STORAGE_KEYS.VACCINES,
  STORAGE_KEYS.EXAMINATIONS,
  STORAGE_KEYS.STOCK,
  STORAGE_KEYS.STOCK_MOVEMENTS,
  STORAGE_KEYS.INVOICES,
  STORAGE_KEYS.PRESCRIPTIONS,
  STORAGE_KEYS.PAYMENTS,
  STORAGE_KEYS.USERS,
  STORAGE_KEYS.SETTINGS,
];

const ARRAY_KEYS = new Set([
  STORAGE_KEYS.CUSTOMERS,
  STORAGE_KEYS.ANIMALS,
  STORAGE_KEYS.APPOINTMENTS,
  STORAGE_KEYS.VACCINES,
  STORAGE_KEYS.EXAMINATIONS,
  STORAGE_KEYS.STOCK,
  STORAGE_KEYS.STOCK_MOVEMENTS,
  STORAGE_KEYS.INVOICES,
  STORAGE_KEYS.PRESCRIPTIONS,
  STORAGE_KEYS.PAYMENTS,
  STORAGE_KEYS.USERS,
]);

export function safeParseJSON(raw, fallback) {
  if (raw == null || raw === "") {
    return fallback;
  }

  try {
    return JSON.parse(raw);
  } catch {
    console.warn(
      "[VetSys] Bozuk localStorage verisi okundu, varsayilan deger kullaniliyor."
    );
    return fallback;
  }
}

export function normalizeStorageKey(key) {
  if (BACKUP_KEYS.includes(key)) {
    return key;
  }

  return LEGACY_KEY_MAP[key] || null;
}

export function isKnownStorageKey(key) {
  return normalizeStorageKey(key) !== null;
}

export function getExpectedValueType(key) {
  const normalizedKey = normalizeStorageKey(key);

  if (!normalizedKey) {
    return null;
  }

  return ARRAY_KEYS.has(normalizedKey) ? "array" : "object";
}

function migrateLegacyKey(legacyKey, newKey) {
  const legacyRaw = localStorage.getItem(legacyKey);

  if (!legacyRaw) {
    return;
  }

  const newRaw = localStorage.getItem(newKey);
  const newData = safeParseJSON(newRaw, null);
  const shouldMigrate =
    !newRaw ||
    (Array.isArray(newData) && newData.length === 0);

  if (shouldMigrate) {
    const legacyData = safeParseJSON(
      legacyRaw,
      ARRAY_KEYS.has(newKey) ? [] : {}
    );

    writeJson(newKey, legacyData);
  }

  localStorage.removeItem(legacyKey);
}

export function runStorageMigrations() {
  Object.entries(LEGACY_KEY_MAP).forEach(
    ([legacyKey, newKey]) => {
      migrateLegacyKey(legacyKey, newKey);
    }
  );
}

export function readJson(key, fallback) {
  runStorageMigrations();

  return safeParseJSON(localStorage.getItem(key), fallback);
}

export function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function readAllBackupData() {
  runStorageMigrations();

  const backup = {};

  BACKUP_KEYS.forEach((key) => {
    const raw = localStorage.getItem(key);

    if (raw == null) {
      return;
    }

    const fallback = ARRAY_KEYS.has(key) ? [] : {};
    backup[key] = safeParseJSON(raw, fallback);
  });

  return backup;
}

export function validateBackupData(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {
      valid: false,
      error: "Yedek dosyasi gecerli bir JSON nesnesi olmalidir.",
    };
  }

  const keys = Object.keys(data);

  if (keys.length === 0) {
    return {
      valid: false,
      error: "Yedek dosyasi bos.",
    };
  }

  const normalized = {};

  for (const key of keys) {
    const normalizedKey = normalizeStorageKey(key);

    if (!normalizedKey) {
      return {
        valid: false,
        error: `Yedek dosyasinda desteklenmeyen anahtar: ${key}`,
      };
    }

    const expectedType = getExpectedValueType(key);
    const value = data[key];

    if (expectedType === "array" && !Array.isArray(value)) {
      return {
        valid: false,
        error: `${normalizedKey} alani dizi olmalidir.`,
      };
    }

    if (
      expectedType === "object" &&
      (typeof value !== "object" ||
        value === null ||
        Array.isArray(value))
    ) {
      return {
        valid: false,
        error: `${normalizedKey} alani nesne olmalidir.`,
      };
    }

    normalized[normalizedKey] = value;
  }

  return {
    valid: true,
    data: normalized,
  };
}

export function savePreRestoreSnapshot() {
  const snapshot = {
    createdAt: new Date().toISOString(),
    data: readAllBackupData(),
  };

  writeJson(STORAGE_KEYS.PRE_RESTORE_SNAPSHOT, snapshot);

  return snapshot;
}

export function applyBackupData(data) {
  // Yedekte olmayan anahtarlar da sıfırlanır; aksi halde eski fatura/
  // müşteri kayıtları yeni yedekle karışır.
  BACKUP_KEYS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      writeJson(key, data[key]);
    } else {
      writeJson(key, ARRAY_KEYS.has(key) ? [] : {});
    }
  });

  // Oturum yedekten bağımsızdır; geri yükleme sonrası eski kullanıcı
  // bellekte kalmasın diye temizlenir.
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}
