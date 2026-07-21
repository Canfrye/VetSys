const express = require("express");

const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const { ROLES } = require("../../config/roles");

const controller = require("./stock.controller");
const { createStockSchema, updateStockSchema } = require("./stock.validation");

const router = express.Router();

// Stok yönetimi Admin + Veteriner ile sınırlıdır (frontend ROUTE_PERMISSIONS ile eşleşir).
router.use(authenticate, authorize([ROLES.ADMIN, ROLES.VETERINARIAN]));

router.get("/", controller.list);
router.post("/", validate(createStockSchema), controller.create);

router.get("/:id", controller.getById);
router.put("/:id", validate(updateStockSchema), controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
