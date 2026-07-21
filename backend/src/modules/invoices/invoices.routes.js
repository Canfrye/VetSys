const express = require("express");

const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const { ROLES } = require("../../config/roles");

const controller = require("./invoices.controller");
const { createInvoiceSchema, updateInvoiceSchema } = require("./invoices.validation");

const router = express.Router();

router.use(authenticate);

// GET: Admin + Reception + Veterinarian (dashboard)
router.get(
  "/",
  authorize([ROLES.ADMIN, ROLES.RECEPTION, ROLES.VETERINARIAN]),
  controller.list
);
router.get(
  "/animal/:animalId",
  authorize([ROLES.ADMIN, ROLES.RECEPTION, ROLES.VETERINARIAN]),
  controller.getByAnimalId
);
router.get(
  "/:id",
  authorize([ROLES.ADMIN, ROLES.RECEPTION, ROLES.VETERINARIAN]),
  controller.getById
);

// Write: Admin + Reception
router.post(
  "/",
  authorize([ROLES.ADMIN, ROLES.RECEPTION]),
  validate(createInvoiceSchema),
  controller.create
);
router.put(
  "/:id",
  authorize([ROLES.ADMIN, ROLES.RECEPTION]),
  validate(updateInvoiceSchema),
  controller.update
);
router.delete("/:id", authorize([ROLES.ADMIN, ROLES.RECEPTION]), controller.remove);

module.exports = router;
