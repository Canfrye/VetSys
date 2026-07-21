/**
 * Splash / hata pencereleri için minimal preload.
 */

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("vetsysError", {
  retry: () => ipcRenderer.send("vetsys:startup-retry"),
  openLogs: () => ipcRenderer.send("vetsys:open-logs"),
  quit: () => ipcRenderer.send("vetsys:startup-quit"),
});
