const express = require("express");

const authenticate = require("../../middleware/authenticate");
const controller = require("./search.controller");

const router = express.Router();

router.use(authenticate);
router.get("/", controller.search);

module.exports = router;
