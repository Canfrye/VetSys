const express = require("express");

const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const { ROLES } = require("../../config/roles");

const controller = require("./users.controller");
const { createUserSchema, updateUserSchema } = require("./users.validation");

const router = express.Router();

// Kullanıcı yönetimi sadece Admin rolüne açıktır.
router.use(authenticate, authorize([ROLES.ADMIN]));

// API dokümantasyonu src/config/swagger.js içinde programatik olarak
// üretilir (bkz. buildCrudPaths) — route dosyaları sadece wiring içerir.
router.get("/", controller.list);
router.post("/", validate(createUserSchema), controller.create);

router.get("/:id", controller.getById);
router.put("/:id", validate(updateUserSchema), controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
