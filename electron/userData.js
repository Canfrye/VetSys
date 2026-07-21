/**
 * VetSys — kullanıcı veri dizini ve tek seferlik taşıma yardımcıları.
 * Program Files ile AppData ayrımı; veriler silinmez.
 */

import fs from "node:fs";
import path from "node:path";
import { app } from "electron";

export const APP_FOLDER_NAME = "VetSys";

const MIGRATION_MARKER = ".vetsys-storage-migrated";
const FIRST_RUN_MARKER = ".vetsys-first-run-done";
const CONFIG_FILE = "config.json";

/** Chromium / Electron depolama klasörleri (LocalStorage burada yaşar) */
const STORAGE_DIR_NAMES = [
  "Local Storage",
  "Session Storage",
  "IndexedDB",
  "databases",
];

/**
 * userData = %APPDATA%/VetSys (Windows)
 * Paket adı "vetsys" olsa bile ürün adı ile sabitlenir.
 */
export function ensureUserDataPath() {
  const target = path.join(app.getPath("appData"), APP_FOLDER_NAME);
  app.setPath("userData", target);
  app.setName(APP_FOLDER_NAME);
  fs.mkdirSync(target, { recursive: true });
  return target;
}

export function getUserDataPath() {
  return app.getPath("userData");
}

export function getMigrationMarkerPath() {
  return path.join(getUserDataPath(), MIGRATION_MARKER);
}

export function getFirstRunMarkerPath() {
  return path.join(getUserDataPath(), FIRST_RUN_MARKER);
}

export function hasCompletedFirstRun() {
  return fs.existsSync(getFirstRunMarkerPath());
}

export function markFirstRunComplete() {
  const userData = getUserDataPath();
  fs.mkdirSync(userData, { recursive: true });
  fs.writeFileSync(
    getFirstRunMarkerPath(),
    JSON.stringify(
      {
        completedAt: new Date().toISOString(),
        version: app.getVersion(),
      },
      null,
      2
    ),
    "utf8"
  );
}

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    return false;
  }

  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(from, to);
    } else if (entry.isFile()) {
      if (!fs.existsSync(to)) {
        fs.copyFileSync(from, to);
      }
    }
  }
  return true;
}

function listLegacyUserDataDirs(currentUserData) {
  const appData = app.getPath("appData");
  const candidates = [
    path.join(appData, "vetsys"),
    path.join(appData, "Electron"),
  ];

  return candidates.filter(
    (dir) =>
      dir !== currentUserData &&
      fs.existsSync(dir) &&
      fs.statSync(dir).isDirectory()
  );
}

/**
 * Eski Electron / küçük harfli vetsys userData içindeki LocalStorage vb.
 * tek seferde yeni VetSys dizinine taşınır. Mevcut hedef dosyalar ezilmez.
 */
export function migrateLegacyUserDataOnce() {
  const userData = getUserDataPath();
  const marker = getMigrationMarkerPath();

  if (fs.existsSync(marker)) {
    return { migrated: false, reason: "already-done" };
  }

  const legacyDirs = listLegacyUserDataDirs(userData);
  let copiedAny = false;

  for (const legacy of legacyDirs) {
    for (const name of STORAGE_DIR_NAMES) {
      const from = path.join(legacy, name);
      const to = path.join(userData, name);
      if (copyDirRecursive(from, to)) {
        copiedAny = true;
      }
    }

    // Yedek JSON varsa da kopyala (ileride renderer import edebilir)
    const backupName = "vetsys-local-backup.json";
    const backupFrom = path.join(legacy, backupName);
    const backupTo = path.join(userData, backupName);
    if (fs.existsSync(backupFrom) && !fs.existsSync(backupTo)) {
      fs.copyFileSync(backupFrom, backupTo);
      copiedAny = true;
    }
  }

  fs.writeFileSync(
    marker,
    JSON.stringify(
      {
        migratedAt: new Date().toISOString(),
        sources: legacyDirs,
        copiedAny,
      },
      null,
      2
    ),
    "utf8"
  );

  return { migrated: true, copiedAny, sources: legacyDirs };
}

/**
 * İlk çalıştırmada klasör + temel config hazırlar.
 */
export function prepareFirstRunWorkspace() {
  const userData = getUserDataPath();
  fs.mkdirSync(userData, { recursive: true });
  fs.mkdirSync(path.join(userData, "logs"), { recursive: true });
  fs.mkdirSync(path.join(userData, "backups"), { recursive: true });

  const configPath = path.join(userData, CONFIG_FILE);
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          app: APP_FOLDER_NAME,
          version: app.getVersion(),
          createdAt: new Date().toISOString(),
          // İleride autoUpdater / publish kanalı buradan okunabilir
          updates: {
            enabled: false,
            channel: "latest",
          },
        },
        null,
        2
      ),
      "utf8"
    );
  }

  return { userData, configPath };
}

/**
 * Renderer localStorage yedeğini userData'ya yazar / okur.
 * Kaynak veriler silinmez; yalnızca kopyalanır.
 */
export function readLocalStorageBackup() {
  const file = path.join(getUserDataPath(), "vetsys-local-backup.json");
  if (!fs.existsSync(file)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

export function writeLocalStorageBackup(payload) {
  const file = path.join(getUserDataPath(), "vetsys-local-backup.json");
  fs.writeFileSync(file, JSON.stringify(payload, null, 2), "utf8");
  return file;
}
