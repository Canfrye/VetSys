/**
 * VetSys — Electron preload
 * Renderer'a güvenli, sınırlı bir köprü sağlar (nodeIntegration yok).
 */

import { contextBridge, ipcRenderer } from "electron";

/** Sayfa scriptlerinden önce senkron API yapılandırması */
const apiConfig = ipcRenderer.sendSync("vetsys:get-api-config-sync") || {
  useApi: false,
  apiBaseUrl: "http://127.0.0.1:4000/api",
};

contextBridge.exposeInMainWorld("__VETSYS_DESKTOP_API__", apiConfig);

contextBridge.exposeInMainWorld("vetsysDesktop", {
  isElectron: true,
  apiConfig,
  getBootstrap: () => ipcRenderer.invoke("vetsys:get-bootstrap"),
  getSystemStatus: () => ipcRenderer.invoke("vetsys:get-system-status"),
  openLogs: () => ipcRenderer.invoke("vetsys:open-logs"),
  prepareFirstRun: () => ipcRenderer.invoke("vetsys:prepare-first-run"),
  completeFirstRun: () => ipcRenderer.invoke("vetsys:complete-first-run"),
  getLocalBackup: () => ipcRenderer.invoke("vetsys:get-local-backup"),
  saveLocalBackup: (payload) =>
    ipcRenderer.invoke("vetsys:save-local-backup", payload),
  saveBackupFile: (payload) =>
    ipcRenderer.invoke("vetsys:save-backup-file", payload),
  openBackupFile: () => ipcRenderer.invoke("vetsys:open-backup-file"),
  writeSafetyBackup: (payload) =>
    ipcRenderer.invoke("vetsys:write-safety-backup", payload),
  relaunch: () => ipcRenderer.invoke("vetsys:relaunch"),
});
