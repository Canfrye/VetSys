/**
 * VetSys — gömülü backend süreci (yalnızca production Electron).
 * Development'ta kullanılmaz; npm run dev / electron:dev akışı bozulmaz.
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app } from "electron";

import { logger } from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_PORT = 4000;
const PORT_RANGE_END = 4100;
const HEALTH_TIMEOUT_MS = 60000;
const HEALTH_INTERVAL_MS = 400;

let child = null;
let startedAt = null;
let activePort = null;
let stopping = false;

function resolveBackendRoot() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "backend");
  }
  return path.join(__dirname, "..", "backend");
}

function resolveServerEntry(backendRoot) {
  return path.join(backendRoot, "src", "server.js");
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

export async function findAvailablePort(preferred = DEFAULT_PORT) {
  for (let port = preferred; port <= PORT_RANGE_END; port += 1) {
    if (await isPortFree(port)) {
      return port;
    }
  }
  throw new Error(
    `Uygun port bulunamadı (${preferred}–${PORT_RANGE_END}). Başka bir VetSys veya servis çalışıyor olabilir.`
  );
}

export function healthUrl(port) {
  return `http://127.0.0.1:${port}/api/health`;
}

export function checkHealth(port, timeoutMs = 2000) {
  return new Promise((resolve) => {
    const req = http.get(
      healthUrl(port),
      { timeout: timeoutMs },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          resolve(res.statusCode === 200);
        });
      }
    );
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.on("error", () => resolve(false));
  });
}

export async function waitForHealth(port, onProgress) {
  const started = Date.now();
  while (Date.now() - started < HEALTH_TIMEOUT_MS) {
    const ok = await checkHealth(port);
    if (ok) return true;
    onProgress?.("Servisler başlatılıyor…");
    await new Promise((r) => setTimeout(r, HEALTH_INTERVAL_MS));
  }
  return false;
}

function killProcessTree(pid) {
  if (!pid) return;
  try {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(pid), "/T", "/F"], {
        windowsHide: true,
        stdio: "ignore",
      });
    } else {
      process.kill(pid, "SIGTERM");
    }
  } catch (error) {
    logger.warn("Process sonlandırma uyarısı", error?.message);
  }
}

/**
 * Mevcut sağlıklı backend varsa yeniden kullan; yoksa başlat.
 */
export async function startBackend({ onProgress } = {}) {
  stopping = false;
  const backendRoot = resolveBackendRoot();
  const serverEntry = resolveServerEntry(backendRoot);

  if (!fs.existsSync(serverEntry)) {
    throw new Error(
      `Backend bulunamadı: ${serverEntry}. Kurulum eksik olabilir.`
    );
  }

  onProgress?.("Klinik verileri hazırlanıyor…");

  // 4000'de zaten sağlıklı servis var mı?
  if (await checkHealth(DEFAULT_PORT)) {
    activePort = DEFAULT_PORT;
    startedAt = startedAt || new Date().toISOString();
    logger.info("Mevcut backend yeniden kullanılıyor", { port: activePort });
    onProgress?.("Sistem hazır");
    return {
      port: activePort,
      apiBaseUrl: `http://127.0.0.1:${activePort}/api`,
      reused: true,
      startedAt,
    };
  }

  const port = await findAvailablePort(DEFAULT_PORT);
  if (port !== DEFAULT_PORT) {
    logger.warn(`Port ${DEFAULT_PORT} dolu, ${port} kullanılıyor`);
  }

  onProgress?.("Servisler başlatılıyor…");

  const env = {
    ...process.env,
    ELECTRON_RUN_AS_NODE: "1",
    PORT: String(port),
    // file:// Origin: null — CORS için
    CORS_ORIGIN: process.env.CORS_ORIGIN || "null,http://localhost:5173,http://127.0.0.1:5173",
  };

  // Electron binary'sini Node gibi çalıştır (harici node gerekmez)
  child = spawn(process.execPath, [serverEntry], {
    cwd: backendRoot,
    env,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  startedAt = new Date().toISOString();
  activePort = port;

  logger.info("Backend süreci başlatıldı", { pid: child.pid, port, backendRoot });

  child.stdout?.on("data", (buf) => {
    logger.info("backend.stdout", String(buf).trim());
  });
  child.stderr?.on("data", (buf) => {
    logger.error("backend.stderr", String(buf).trim());
  });
  child.on("exit", (code, signal) => {
    logger.info("Backend süreci sonlandı", { code, signal });
    if (!stopping) {
      child = null;
    }
  });

  const healthy = await waitForHealth(port, onProgress);
  if (!healthy) {
    await stopBackend();
    throw new Error(
      "Sunucu servisi zaman aşımına uğradı. PostgreSQL ve .env ayarlarını kontrol edin."
    );
  }

  onProgress?.("Sistem hazır");
  return {
    port,
    apiBaseUrl: `http://127.0.0.1:${port}/api`,
    reused: false,
    startedAt,
  };
}

export async function stopBackend() {
  stopping = true;
  const proc = child;
  child = null;

  if (!proc || !proc.pid) {
    activePort = null;
    return;
  }

  logger.info("Backend kapatılıyor", { pid: proc.pid });

  try {
    if (process.platform === "win32") {
      killProcessTree(proc.pid);
    } else {
      proc.kill("SIGTERM");
      await new Promise((r) => setTimeout(r, 500));
      if (!proc.killed) {
        proc.kill("SIGKILL");
      }
    }
  } catch (error) {
    logger.error("Backend kapatma hatası", error?.message);
  }

  activePort = null;
}

export function getBackendStatus() {
  const running = Boolean(child?.pid) || Boolean(activePort);
  let uptimeSeconds = null;
  if (startedAt) {
    uptimeSeconds = Math.max(
      0,
      Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
    );
  }

  return {
    running,
    port: activePort,
    apiBaseUrl: activePort ? `http://127.0.0.1:${activePort}/api` : null,
    healthUrl: activePort ? healthUrl(activePort) : null,
    startedAt,
    uptimeSeconds,
    pid: child?.pid || null,
    version: app.getVersion(),
  };
}

export { DEFAULT_PORT };
