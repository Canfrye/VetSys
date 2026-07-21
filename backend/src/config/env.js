/**
 * Ortam değişkenlerinin TEK okunduğu ve doğrulandığı yer. Diğer tüm
 * dosyalar process.env'e doğrudan erişmek yerine bu modülü kullanır;
 * eksik/zayıf bir .env konfigürasyonu uygulama ayağa kalkar kalkmaz
 * (route'lara gelmeden) fark edilir.
 */
require("dotenv").config();

const REQUIRED_IN_PRODUCTION = ["DATABASE_URL", "JWT_SECRET"];

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT) || 4000,

  DATABASE_URL: process.env.DATABASE_URL || "",

  JWT_SECRET: process.env.JWT_SECRET || "vetsys-dev-secret-change-me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "8h",

  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
};

if (env.NODE_ENV === "production") {
  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Eksik ortam değişkenleri (production): ${missing.join(", ")}`
    );
  }
}

module.exports = env;
