/**
 * Frontend API yapılandırması — Sprint 26 feature flag.
 * Electron production: preload __VETSYS_DESKTOP_API__ ile runtime override.
 */

function readDesktopApi() {
  try {
    if (typeof window !== "undefined" && window.__VETSYS_DESKTOP_API__) {
      return window.__VETSYS_DESKTOP_API__;
    }
  } catch {
    // ignore
  }
  return null;
}

const desk = readDesktopApi();

const envUseApi =
  String(import.meta.env.VITE_USE_API || "false").toLowerCase() === "true";

export const USE_API =
  typeof desk?.useApi === "boolean" ? desk.useApi : envUseApi;

export const API_BASE_URL = (
  desk?.apiBaseUrl ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:4000/api"
).replace(/\/$/, "");

export const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 15000;
