const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");

const env = require("./config/env");
const swaggerSpec = require("./config/swagger");
const routes = require("./routes");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

/**
 * Express app'i oluşturur ama başlatmaz (listen() çağırmaz). Bu ayrım
 * (app.js / server.js) sayesinde uygulama Jest+Supertest ile bir port
 * açmadan test edilebilir.
 */
function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        const allowed = String(env.CORS_ORIGIN || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        // Electron file:// → Origin "null"; geliştirme / sağlık kontrolü
        if (
          !origin ||
          origin === "null" ||
          allowed.includes("*") ||
          allowed.includes(origin) ||
          origin.startsWith("file://") ||
          origin.startsWith("app://")
        ) {
          callback(null, true);
          return;
        }

        callback(null, allowed[0] || false);
      },
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  if (env.NODE_ENV !== "test") {
    app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));
  }

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/api-docs.json", (req, res) => res.json(swaggerSpec));

  app.use("/api", routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
