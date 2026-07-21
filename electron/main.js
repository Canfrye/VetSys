/**
 * VetSys — Electron main process
 * Production: backend otomatik başlatılır, splash + health, temiz kapanış.
 * Development (ELECTRON_DEV=true): mevcut akış; backend yönetilmez.
 */

import { app, BrowserWindow, Menu, ipcMain, shell, dialog } from "electron";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ensureUserDataPath,
  getUserDataPath,
  hasCompletedFirstRun,
  markFirstRunComplete,
  migrateLegacyUserDataOnce,
  prepareFirstRunWorkspace,
  readLocalStorageBackup,
  writeLocalStorageBackup,
} from "./userData.js";
import { logger } from "./logger.js";
import {
  startBackend,
  stopBackend,
  getBackendStatus,
  DEFAULT_PORT,
} from "./backendManager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.ELECTRON_DEV === "true";
const isPackaged = app.isPackaged;
const manageBackend = !isDev;

const DEV_SERVER_URL =
  process.env.VITE_DEV_SERVER_URL || "http://127.0.0.1:5173";

ensureUserDataPath();

/** @type {BrowserWindow | null} */
let mainWindow = null;
/** @type {BrowserWindow | null} */
let splashWindow = null;
/** @type {BrowserWindow | null} */
let errorWindow = null;

let apiRuntime = {
  useApi: false,
  apiBaseUrl: `http://127.0.0.1:${DEFAULT_PORT}/api`,
  port: DEFAULT_PORT,
};

let quitting = false;

function resolveIconPath() {
  return path.join(__dirname, "assets", "icon.ico");
}

function resolveIndexHtml() {
  return path.join(__dirname, "..", "dist", "index.html");
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 480,
    height: 420,
    frame: false,
    resizable: false,
    show: true,
    center: true,
    backgroundColor: "#0f172a",
    icon: resolveIconPath(),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  splashWindow.loadFile(path.join(__dirname, "splash.html"));
  splashWindow.on("closed", () => {
    splashWindow = null;
  });

  splashWindow.webContents.on("did-finish-load", () => {
    splashWindow?.webContents.executeJavaScript(
      `window.vetsysSplash && (window.vetsysSplash.setVersion(${JSON.stringify(app.getVersion())}), window.vetsysSplash.setStatus("Başlatılıyor..."));`
    );
  });

  return splashWindow;
}

function updateSplash(status, step) {
  if (!splashWindow || splashWindow.isDestroyed()) return;
  const script = `
    window.vetsysSplash && window.vetsysSplash.setStatus(${JSON.stringify(status || "")});
    ${step ? `window.vetsysSplash && window.vetsysSplash.addStep(${JSON.stringify(step)});` : ""}
  `;
  splashWindow.webContents.executeJavaScript(script).catch(() => {});
}

function closeSplash() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
  }
  splashWindow = null;
}

function showErrorWindow(message) {
  closeSplash();

  if (errorWindow && !errorWindow.isDestroyed()) {
    errorWindow.focus();
    return;
  }

  errorWindow = new BrowserWindow({
    width: 520,
    height: 360,
    resizable: false,
    show: true,
    center: true,
    title: "VetSys",
    backgroundColor: "#0f172a",
    icon: resolveIconPath(),
    webPreferences: {
      preload: path.join(__dirname, "preload-splash.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  errorWindow.loadFile(path.join(__dirname, "error.html"), {
    query: { message: String(message || "Bilinmeyen hata") },
  });

  errorWindow.on("closed", () => {
    errorWindow = null;
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: "VetSys",
    width: 1600,
    height: 900,
    minWidth: 1280,
    minHeight: 720,
    resizable: true,
    show: false,
    backgroundColor: "#f8fafc",
    icon: resolveIconPath(),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    closeSplash();
  });

  if (isDev) {
    mainWindow.loadURL(DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(resolveIndexHtml());
  }

  if (!isDev) {
    mainWindow.webContents.on("before-input-event", (event, input) => {
      const isToggleDevtools =
        input.key === "F12" ||
        (input.control &&
          input.shift &&
          ["I", "J", "C"].includes(input.key.toUpperCase())) ||
        (input.meta && input.alt && input.key.toUpperCase() === "I");

      if (isToggleDevtools) {
        event.preventDefault();
      }
    });

    mainWindow.webContents.on("context-menu", (event) => {
      event.preventDefault();
    });

    Menu.setApplicationMenu(null);
  }

  mainWindow.webContents.setWindowOpenHandler(({ url: openUrl }) => {
    shell.openExternal(openUrl);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  return mainWindow;
}

async function bootstrapProduction() {
  logger.info("Electron production başlangıcı", {
    version: app.getVersion(),
    packaged: isPackaged,
  });

  createSplashWindow();
  updateSplash("Başlatılıyor...", "Klinik verileri hazırlanıyor");

  try {
    const result = await startBackend({
      onProgress: (msg) => {
        if (msg.includes("Servis")) {
          updateSplash(msg, "Servisler başlatılıyor");
        } else if (msg.includes("hazır")) {
          updateSplash(msg, "Sistem hazır");
        } else {
          updateSplash(msg);
        }
      },
    });

    apiRuntime = {
      useApi: true,
      apiBaseUrl: result.apiBaseUrl,
      port: result.port,
    };

    logger.info("Backend hazır", apiRuntime);
    updateSplash("Sistem hazır", "Sistem hazır");

    createMainWindow();
  } catch (error) {
    const message = error?.message || String(error);
    logger.error("Backend başlatılamadı", message);
    showErrorWindow(message);
  }
}

function registerIpc() {
  ipcMain.on("vetsys:get-api-config-sync", (event) => {
    event.returnValue = {
      useApi: manageBackend ? apiRuntime.useApi : false,
      apiBaseUrl: apiRuntime.apiBaseUrl,
      port: apiRuntime.port,
      isDev,
      isPackaged,
    };
  });

  ipcMain.handle("vetsys:get-bootstrap", () => {
    const firstRunDone = hasCompletedFirstRun();
    const backend = getBackendStatus();
    return {
      isElectron: true,
      isPackaged,
      isDev,
      version: app.getVersion(),
      userDataPath: getUserDataPath(),
      isFirstRun: !firstRunDone,
      hasLocalStorageBackup: Boolean(readLocalStorageBackup()),
      apiBaseUrl: apiRuntime.apiBaseUrl,
      useApi: manageBackend ? apiRuntime.useApi : false,
      backend,
    };
  });

  ipcMain.handle("vetsys:get-system-status", async () => {
    const backend = getBackendStatus();
    let healthy = false;
    if (backend.port) {
      const { checkHealth } = await import("./backendManager.js");
      healthy = await checkHealth(backend.port);
    }
    return {
      backend: { ...backend, healthy },
      logsDir: logger.getLogsDir(),
      todayLog: logger.getTodayLogPath(),
      version: app.getVersion(),
      manageBackend,
      isDev,
      isPackaged,
    };
  });

  ipcMain.handle("vetsys:open-logs", async () => {
    const dir = logger.getLogsDir();
    await shell.openPath(dir);
    return { ok: true, dir };
  });

  ipcMain.on("vetsys:open-logs", () => {
    shell.openPath(logger.getLogsDir());
  });

  ipcMain.on("vetsys:startup-quit", () => {
    app.quit();
  });

  ipcMain.on("vetsys:startup-retry", () => {
    if (errorWindow && !errorWindow.isDestroyed()) {
      errorWindow.close();
    }
    bootstrapProduction();
  });

  ipcMain.handle("vetsys:prepare-first-run", () => {
    migrateLegacyUserDataOnce();
    const workspace = prepareFirstRunWorkspace();
    return {
      ok: true,
      userDataPath: workspace.userData,
      messages: [
        "VetSys klasörü oluşturuluyor...",
        "Yapılandırma hazırlanıyor...",
        "Kurulum tamamlandı.",
      ],
    };
  });

  ipcMain.handle("vetsys:complete-first-run", () => {
    markFirstRunComplete();
    return { ok: true };
  });

  ipcMain.handle("vetsys:get-local-backup", () => readLocalStorageBackup());

  ipcMain.handle("vetsys:save-local-backup", (_event, payload) => {
    writeLocalStorageBackup(payload ?? {});
    return { ok: true };
  });

  ipcMain.handle("vetsys:save-backup-file", async (event, payload = {}) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const defaultPath =
      payload.defaultPath ||
      `VetSys_Backup_${new Date().toISOString().slice(0, 10)}.vsb`;

    const result = await dialog.showSaveDialog(win || undefined, {
      title: "VetSys Yedeğini Kaydet",
      defaultPath,
      filters: [
        { name: "VetSys Backup", extensions: ["vsb"] },
        { name: "Tüm Dosyalar", extensions: ["*"] },
      ],
    });

    if (result.canceled || !result.filePath) {
      return { canceled: true };
    }

    try {
      const content = String(payload.content ?? "");
      fs.writeFileSync(result.filePath, content, "utf8");
      return {
        canceled: false,
        filePath: result.filePath,
        sizeBytes: Buffer.byteLength(content, "utf8"),
      };
    } catch (error) {
      return {
        canceled: false,
        error: error?.message || "Yedek dosyası yazılamadı.",
      };
    }
  });

  ipcMain.handle("vetsys:open-backup-file", async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(win || undefined, {
      title: "VetSys Yedeği Seç",
      properties: ["openFile"],
      filters: [
        { name: "VetSys Backup", extensions: ["vsb", "json"] },
        { name: "Tüm Dosyalar", extensions: ["*"] },
      ],
    });

    if (result.canceled || !result.filePaths?.[0]) {
      return { canceled: true };
    }

    const filePath = result.filePaths[0];

    try {
      const content = fs.readFileSync(filePath, "utf8");
      return {
        canceled: false,
        filePath,
        content,
        sizeBytes: Buffer.byteLength(content, "utf8"),
      };
    } catch (error) {
      return {
        canceled: false,
        error: error?.message || "Yedek dosyası okunamadı.",
      };
    }
  });

  ipcMain.handle("vetsys:write-safety-backup", (_event, payload = {}) => {
    try {
      const backupsDir = path.join(getUserDataPath(), "backups");
      fs.mkdirSync(backupsDir, { recursive: true });
      const fileName =
        payload.fileName || `VetSys_PreRestore_${Date.now()}.vsb`;
      const filePath = path.join(backupsDir, fileName);
      const content = String(payload.content ?? "");
      fs.writeFileSync(filePath, content, "utf8");
      return {
        ok: true,
        filePath,
        sizeBytes: Buffer.byteLength(content, "utf8"),
      };
    } catch (error) {
      return {
        ok: false,
        error: error?.message || "Güvenlik yedeği yazılamadı.",
      };
    }
  });

  ipcMain.handle("vetsys:relaunch", () => {
    app.relaunch();
    app.exit(0);
    return { ok: true };
  });
}

app.whenReady().then(async () => {
  if (process.platform === "win32") {
    app.setAppUserModelId("com.vetsys.app");
  }

  migrateLegacyUserDataOnce();
  prepareFirstRunWorkspace();
  registerIpc();

  logger.info("Electron whenReady", { isDev, manageBackend });

  if (manageBackend) {
    await bootstrapProduction();
  } else {
    createMainWindow();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      if (manageBackend) {
        bootstrapProduction();
      } else {
        createMainWindow();
      }
    }
  });
});

app.on("before-quit", (event) => {
  if (quitting || !manageBackend) {
    logger.info("Electron kapanış");
    return;
  }
  event.preventDefault();
  quitting = true;
  logger.info("Electron kapanış — backend sonlandırılıyor");
  stopBackend()
    .catch((err) => logger.error("Backend stop hatası", err?.message))
    .finally(() => {
      app.exit(0);
    });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
