const express = require("express");

const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const { ROLES } = require("../../config/roles");

const controller = require("./import.controller");

const router = express.Router();

router.use(authenticate, authorize([ROLES.ADMIN]));

router.post("/local-data", controller.importLocalData);

module.exports = router;
