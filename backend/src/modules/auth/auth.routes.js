const express = require("express");
const rateLimit = require("express-rate-limit");

const authenticate = require("../../middleware/authenticate");
const validate = require("../../middleware/validate");

const controller = require("./auth.controller");
const { loginSchema } = require("./auth.validation");

const router = express.Router();

// Brute-force login denemelerine karşı basit hız sınırlama.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "TOO_MANY_REQUESTS", message: "Çok fazla giriş denemesi. Lütfen sonra tekrar deneyin." },
  },
});

// API dokümantasyonu src/config/swagger.js içinde programatik olarak
// üretilir (bkz. buildAuthPaths) — route dosyaları sadece wiring içerir.
router.post("/login", loginLimiter, validate(loginSchema), controller.login);
router.get("/me", authenticate, controller.me);

module.exports = router;
