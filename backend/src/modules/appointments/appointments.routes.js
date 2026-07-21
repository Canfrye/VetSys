const express = require("express");

const authenticate = require("../../middleware/authenticate");
const validate = require("../../middleware/validate");

const controller = require("./appointments.controller");
const {
  createAppointmentSchema,
  updateAppointmentSchema,
} = require("./appointments.validation");

const router = express.Router();

// Randevu kayıtları tüm giriş yapmış roller tarafından görülüp yönetilebilir.
router.use(authenticate);

router.get("/", controller.list);
router.post("/", validate(createAppointmentSchema), controller.create);

router.get("/:id", controller.getById);
router.put("/:id", validate(updateAppointmentSchema), controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
