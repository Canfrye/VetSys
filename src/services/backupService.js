import {
  readAllBackupData,
  savePreRestoreSnapshot,
  applyBackupData,
  STORAGE_KEYS,
} from "../utils/storage";
import {
  APP_VERSION,
  buildRestoreSummary,
  buildVsbDocument,
  formatVsbFilename,
  parseVsbContent,
} from "../utils/vsbBackup";
import { getSettings, saveSettings } from "./settingsService";

function isElectronDesktop() {
  return typeof window !== "undefined" && window.vetsysDesktop?.isElectron;
}

function downloadTextFile(content, filename, mime = "application/json") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function persistLastBackupMeta(meta) {
  try {
    const settings = await getSettings();
    await saveSettings(
      {
        ...settings,
        lastBackupMeta: meta,
      },
      { skipAudit: true }
    );
  } catch {
    // Meta yazılamazsa yedek yine de başarılı sayılır.
  }
}

/**
 * Tam sistem yedeği oluşturur (.vsb).
 * Electron'da Save Dialog; tarayıcıda indirme.
 */
export async function createSystemBackup({ user = null } = {}) {
  const settings = await getSettings();
  const data = readAllBackupData();
  const document = buildVsbDocument({
    data,
    user,
    clinicName: settings.clinicName,
    appVersion: APP_VERSION,
  });

  const content = JSON.stringify(document, null, 2);
  const filename = formatVsbFilename();
  const sizeBytes = new Blob([content]).size;

  if (isElectronDesktop() && window.vetsysDesktop.saveBackupFile) {
    const result = await window.vetsysDesktop.saveBackupFile({
      defaultPath: filename,
      content,
    });

    if (result?.canceled) {
      return { canceled: true };
    }

    if (result?.error) {
      throw new Error(result.error);
    }

    const meta = {
      createdAt: document.metadata.createdAt,
      date: document.metadata.date,
      time: document.metadata.time,
      fileName: result.filePath?.split(/[/\\]/).pop() || filename,
      filePath: result.filePath || "",
      sizeBytes: result.sizeBytes ?? sizeBytes,
      vetsysVersion: APP_VERSION,
    };

    await persistLastBackupMeta(meta);
    return { canceled: false, meta, document };
  }

  downloadTextFile(content, filename, "application/octet-stream");

  const meta = {
    createdAt: document.metadata.createdAt,
    date: document.metadata.date,
    time: document.metadata.time,
    fileName: filename,
    filePath: "",
    sizeBytes,
    vetsysVersion: APP_VERSION,
  };

  await persistLastBackupMeta(meta);
  return { canceled: false, meta, document };
}

/**
 * Dosya içeriğini okuyup özet + doğrulama döner (henüz uygulamaz).
 */
export async function inspectBackupFile(fileOrContent) {
  let rawText;
  let fileName = "";
  let sizeBytes;

  if (typeof fileOrContent === "string") {
    rawText = fileOrContent;
    sizeBytes = new Blob([rawText]).size;
  } else if (fileOrContent?.content) {
    rawText = fileOrContent.content;
    fileName = fileOrContent.fileName || "";
    sizeBytes = fileOrContent.sizeBytes || new Blob([rawText]).size;
  } else if (fileOrContent instanceof Blob) {
    rawText = await fileOrContent.text();
    fileName = fileOrContent.name || "";
    sizeBytes = fileOrContent.size;
  } else {
    return {
      ok: false,
      error: "Yedek dosyası seçilmedi.",
    };
  }

  const parsed = parseVsbContent(rawText);

  if (!parsed.ok) {
    return {
      ok: false,
      error: parsed.error,
      unsupported: parsed.unsupported || false,
    };
  }

  return {
    ok: true,
    parsed,
    summary: buildRestoreSummary(parsed),
    fileName,
    sizeBytes,
    rawText,
  };
}

/**
 * Electron open dialog veya tarayıcı file input sonrası inceleme.
 */
export async function pickAndInspectBackup() {
  if (isElectronDesktop() && window.vetsysDesktop.openBackupFile) {
    const result = await window.vetsysDesktop.openBackupFile();

    if (result?.canceled) {
      return { canceled: true };
    }

    if (result?.error) {
      return { ok: false, error: result.error };
    }

    const inspected = await inspectBackupFile({
      content: result.content,
      fileName: result.filePath?.split(/[/\\]/).pop() || "",
      sizeBytes: result.sizeBytes,
    });

    return { canceled: false, ...inspected };
  }

  return { canceled: true, needsBrowserPicker: true };
}

/**
 * Onaylanmış yedeği uygular. Önce otomatik güvenlik yedeği alır.
 */
export async function applyInspectedBackup(inspected, { user = null } = {}) {
  if (!inspected?.ok || !inspected.parsed?.data) {
    throw new Error(inspected?.error || "Geri yüklenecek geçerli yedek yok.");
  }

  // 1) Otomatik geçici yedek (localStorage snapshot + dosya)
  const snapshot = savePreRestoreSnapshot();
  const safetyDoc = buildVsbDocument({
    data: snapshot.data,
    user,
    clinicName: snapshot.data?.[STORAGE_KEYS.SETTINGS]?.clinicName || "",
    appVersion: APP_VERSION,
  });
  const safetyName = `VetSys_PreRestore_${new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/[:T]/g, "-")}.vsb`;
  const safetyContent = JSON.stringify(safetyDoc, null, 2);

  if (isElectronDesktop() && window.vetsysDesktop.writeSafetyBackup) {
    await window.vetsysDesktop.writeSafetyBackup({
      fileName: safetyName,
      content: safetyContent,
    });
  } else {
    downloadTextFile(safetyContent, safetyName, "application/octet-stream");
  }

  // 2) Veriyi uygula
  applyBackupData(inspected.parsed.data);

  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new Event("vetsys-backup-restored"));

  return {
    ok: true,
    safetyFileName: safetyName,
  };
}

/** @deprecated Eski API — createSystemBackup kullanın */
export const exportBackup = () => {
  createSystemBackup().catch(() => {});
};

/** @deprecated Eski API — inspect + apply kullanın */
export const importBackup = (file, { onSuccess, onError } = {}) => {
  inspectBackupFile(file)
    .then(async (inspected) => {
      if (!inspected.ok) {
        onError?.(inspected.error);
        return;
      }
      await applyInspectedBackup(inspected);
      onSuccess?.();
    })
    .catch((err) => {
      onError?.(err?.message || "Yedek dosyası okunamadı.");
    });
};
