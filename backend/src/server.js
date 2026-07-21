const env = require("./config/env");
const createApp = require("./app");

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`[VetSys API] ${env.NODE_ENV} modunda ${env.PORT} portunda çalışıyor.`);
  console.log(`[VetSys API] Swagger dokümantasyonu: http://localhost:${env.PORT}/api-docs`);
});

function shutdown(signal) {
  console.log(`[VetSys API] ${signal} alındı, sunucu kapatılıyor...`);
  server.close(() => process.exit(0));
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  console.error("[VetSys API] Yakalanmamış Promise reddi:", reason);
});
