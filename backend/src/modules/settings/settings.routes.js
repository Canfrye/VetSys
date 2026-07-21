const express = require("express");

const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const { ROLES } = require("../../config/roles");

const controller = require("./settings.controller");

const router = express.Router();

router.use(authenticate);

router.get("/", controller.get);
router.put("/", authorize([ROLES.ADMIN]), controller.put);

module.exports = router;
