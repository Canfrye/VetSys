/**
 * VetSys — günlük dosyası (%APPDATA%/VetSys/logs/YYYY-MM-DD.log)
 */

import fs from "node:fs";
import path from "node:path";
import { getUserDataPath } from "./userData.js";

function logsDir() {
  const dir = path.join(getUserDataPath(), "logs");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function todayLogPath() {
  const d = new Date();
  const name = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}.log`;
  return path.join(logsDir(), name);
}

function write(level, message, detail) {
  const ts = new Date().toISOString();
  let line = `[${ts}] [${level}] ${message}`;
  if (detail != null) {
    const extra =
      typeof detail === "string" ? detail : JSON.stringify(detail, null, 0);
    line += ` ${extra}`;
  }
  line += "\n";

  try {
    fs.appendFileSync(todayLogPath(), line, "utf8");
  } catch {
    // Log yazılamasa uygulamayı düşürme
  }

  if (level === "ERROR") {
    console.error(line.trim());
  } else {
    console.log(line.trim());
  }
}

export const logger = {
  info: (msg, detail) => write("INFO", msg, detail),
  warn: (msg, detail) => write("WARN", msg, detail),
  error: (msg, detail) => write("ERROR", msg, detail),
  getLogsDir: () => logsDir(),
  getTodayLogPath: () => todayLogPath(),
};
