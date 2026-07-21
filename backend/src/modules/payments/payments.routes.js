const express = require("express");

const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const { ROLES } = require("../../config/roles");

const controller = require("./payments.controller");
const {
  createPaymentSchema,
  updatePaymentSchema,
} = require("./payments.validation");

const router = express.Router();

router.use(authenticate);

router.get("/", controller.list);
router.get("/:id", controller.getById);

router.post(
  "/",
  authorize([ROLES.ADMIN, ROLES.RECEPTION]),
  validate(createPaymentSchema),
  controller.create
);

router.put(
  "/:id",
  authorize([ROLES.ADMIN, ROLES.RECEPTION]),
  validate(updatePaymentSchema),
  controller.update
);

router.delete("/:id", authorize([ROLES.ADMIN]), controller.remove);

module.exports = router;
