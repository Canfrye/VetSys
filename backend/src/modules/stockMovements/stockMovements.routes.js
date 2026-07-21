const express = require("express");

const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const { ROLES } = require("../../config/roles");

const controller = require("./stockMovements.controller");
const {
  createStockMovementSchema,
} = require("./stockMovements.validation");

const router = express.Router();

router.use(authenticate, authorize([ROLES.ADMIN, ROLES.VETERINARIAN]));

router.get("/", controller.list);
router.post("/", validate(createStockMovementSchema), controller.create);
router.get("/:id", controller.getById);
router.delete("/:id", controller.remove);

module.exports = router;
