/**
 * VetSys Backup (.vsb) format yardımcıları.
 * Yeni storage key oluşturmaz; mevcut BACKUP_KEYS verisini sarar.
 */

import {
  BACKUP_KEYS,
  STORAGE_KEYS,
  normalizeStorageKey,
  validateBackupData,
} from "./storage";

export const VSB_FORMAT_ID = "vetsys-backup";
export const VSB_BACKUP_VERSION = 1;

/** package.json version — vite.config.js define ile enjekte edilir */
export const APP_VERSION =
  typeof __VETSYS_VERSION__ !== "undefined" ? __VETSYS_VERSION__ : "1.0.0";

/** Bu sürüm ve altı okunabilir; üstü desteklenmez. */
export const MAX_SUPPORTED_BACKUP_VERSION = VSB_BACKUP_VERSION;

export function formatVsbFilename(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `VetSys_Backup_${y}-${m}-${d}.vsb`;
}

export function countBackupEntities(data = {}) {
  const len = (key) =>
    Array.isArray(data[key]) ? data[key].length : 0;

  return {
    customers: len(STORAGE_KEYS.CUSTOMERS),
    animals: len(STORAGE_KEYS.ANIMALS),
    examinations: len(STORAGE_KEYS.EXAMINATIONS),
    vaccines: len(STORAGE_KEYS.VACCINES),
    appointments: len(STORAGE_KEYS.APPOINTMENTS),
    prescriptions: len(STORAGE_KEYS.PRESCRIPTIONS),
    stock: len(STORAGE_KEYS.STOCK),
    stockMovements: len(STORAGE_KEYS.STOCK_MOVEMENTS),
    invoices: len(STORAGE_KEYS.INVOICES),
    payments: len(STORAGE_KEYS.PAYMENTS),
    users: len(STORAGE_KEYS.USERS),
    auditLogs: Array.isArray(data[STORAGE_KEYS.SETTINGS]?.auditLogs)
      ? data[STORAGE_KEYS.SETTINGS].auditLogs.length
      : 0,
  };
}

/**
 * .vsb belgesi üretir (metadata + data).
 */
export function buildVsbDocument({
  data,
  user = null,
  clinicName = "",
  appVersion = APP_VERSION,
} = {}) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const settings = data?.[STORAGE_KEYS.SETTINGS] || {};

  return {
    format: VSB_FORMAT_ID,
    backupVersion: VSB_BACKUP_VERSION,
    metadata: {
      vetsysVersion: appVersion,
      backupVersion: VSB_BACKUP_VERSION,
      createdAt: now.toISOString(),
      date,
      time,
      createdBy:
        user?.fullName || user?.username || user?.email || "Sistem",
      clinicName: clinicName || settings.clinicName || "",
      counts: countBackupEntities(data),
      keys: [...BACKUP_KEYS],
    },
    data,
  };
}

/**
 * Ham metni ayrıştırır; eski düz JSON yedekleri de destekler.
 */
export function parseVsbContent(rawText) {
  if (rawText == null || String(rawText).trim() === "") {
    return {
      ok: false,
      error: "Yedek dosyası boş veya okunamadı.",
    };
  }

  let parsed;

  try {
    parsed = JSON.parse(rawText);
  } catch {
    return {
      ok: false,
      error:
        "Yedek dosyası bozuk veya geçerli bir VetSys yedeği değil (JSON ayrıştırılamadı).",
    };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      ok: false,
      error: "Yedek dosyası geçersiz yapıda.",
    };
  }

  // Yeni .vsb formatı
  if (parsed.format === VSB_FORMAT_ID) {
    const backupVersion = Number(parsed.backupVersion);

    if (!Number.isFinite(backupVersion) || backupVersion < 1) {
      return {
        ok: false,
        error: "Yedek dosyasının sürüm bilgisi geçersiz.",
      };
    }

    if (backupVersion > MAX_SUPPORTED_BACKUP_VERSION) {
      return {
        ok: false,
        error: `Bu yedek VetSys ${parsed.metadata?.vetsysVersion || "?"} sürümüyle oluşturulmuş (yedek formatı v${backupVersion}). Bu uygulama en fazla v${MAX_SUPPORTED_BACKUP_VERSION} formatını destekliyor. Lütfen VetSys'i güncelleyin.`,
        unsupported: true,
        metadata: parsed.metadata || null,
      };
    }

    if (!parsed.data || typeof parsed.data !== "object" || Array.isArray(parsed.data)) {
      return {
        ok: false,
        error: "Yedek dosyasında veri bölümü eksik veya bozuk.",
      };
    }

    const validation = validateBackupData(parsed.data);

    if (!validation.valid) {
      return {
        ok: false,
        error: validation.error || "Yedek veri içeriği doğrulanamadı.",
      };
    }

    return {
      ok: true,
      kind: "vsb",
      metadata: parsed.metadata || {},
      backupVersion,
      data: validation.data,
    };
  }

  // Eski düz JSON yedek (doğrudan storage key'leri)
  const looksLegacy = Object.keys(parsed).some(
    (key) => normalizeStorageKey(key) !== null
  );

  if (!looksLegacy) {
    return {
      ok: false,
      error:
        "Dosya tanınan bir VetSys yedeği değil. .vsb veya eski .json yedek dosyası seçin.",
    };
  }

  const validation = validateBackupData(parsed);

  if (!validation.valid) {
    return {
      ok: false,
      error: validation.error || "Eski yedek dosyası doğrulanamadı.",
    };
  }

  return {
    ok: true,
    kind: "legacy",
    metadata: {
      vetsysVersion: "eski",
      backupVersion: 0,
      clinicName: validation.data[STORAGE_KEYS.SETTINGS]?.clinicName || "",
      createdAt: null,
      date: null,
      time: null,
      createdBy: null,
      counts: countBackupEntities(validation.data),
    },
    backupVersion: 0,
    data: validation.data,
  };
}

export function buildRestoreSummary(parsed) {
  const meta = parsed.metadata || {};
  const counts = meta.counts || countBackupEntities(parsed.data || {});
  const settings = parsed.data?.[STORAGE_KEYS.SETTINGS] || {};

  return {
    clinicName: meta.clinicName || settings.clinicName || "—",
    date: meta.date || (meta.createdAt ? meta.createdAt.slice(0, 10) : "—"),
    time: meta.time || "—",
    vetsysVersion: meta.vetsysVersion || "—",
    backupVersion: parsed.backupVersion ?? meta.backupVersion ?? "—",
    kind: parsed.kind,
    counts: {
      customers: counts.customers ?? 0,
      animals: counts.animals ?? 0,
      invoices: counts.invoices ?? 0,
      examinations: counts.examinations ?? 0,
      vaccines: counts.vaccines ?? 0,
      appointments: counts.appointments ?? 0,
      prescriptions: counts.prescriptions ?? 0,
      payments: counts.payments ?? 0,
      stock: counts.stock ?? 0,
      users: counts.users ?? 0,
      auditLogs: counts.auditLogs ?? 0,
    },
  };
}

export function formatBytes(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDisplayDate(isoOrDate) {
  if (!isoOrDate) return "—";
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return String(isoOrDate);
  return d.toLocaleString("tr-TR");
}
