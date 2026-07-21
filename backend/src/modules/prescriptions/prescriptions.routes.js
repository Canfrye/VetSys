const express = require("express");

const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const { ROLES } = require("../../config/roles");

const controller = require("./prescriptions.controller");
const {
  createPrescriptionSchema,
  updatePrescriptionSchema,
} = require("./prescriptions.validation");

const router = express.Router();

router.use(authenticate);

router.get("/", controller.list);
router.get("/:id", controller.getById);

router.post(
  "/",
  authorize([ROLES.ADMIN, ROLES.VETERINARIAN]),
  validate(createPrescriptionSchema),
  controller.create
);

router.put(
  "/:id",
  authorize([ROLES.ADMIN, ROLES.VETERINARIAN]),
  validate(updatePrescriptionSchema),
  controller.update
);

router.delete("/:id", authorize([ROLES.ADMIN]), controller.remove);

module.exports = router;
