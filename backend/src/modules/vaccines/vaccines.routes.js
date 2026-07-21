const express = require("express");

const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const { ROLES } = require("../../config/roles");

const controller = require("./vaccines.controller");
const { createVaccineSchema, updateVaccineSchema } = require("./vaccines.validation");

const router = express.Router();

// Aşı kayıtları klinik/tıbbi işlem olduğu için Admin + Veteriner ile sınırlıdır.
router.use(authenticate, authorize([ROLES.ADMIN, ROLES.VETERINARIAN]));

router.get("/", controller.list);
router.post("/", validate(createVaccineSchema), controller.create);

router.get("/:id", controller.getById);
router.put("/:id", validate(updateVaccineSchema), controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
