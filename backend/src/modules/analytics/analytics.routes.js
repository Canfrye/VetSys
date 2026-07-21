const express = require("express");

const authenticate = require("../../middleware/authenticate");
const controller = require("./analytics.controller");

const router = express.Router();

router.use(authenticate);

router.get("/", controller.getReport);
router.get("/dashboard-kpis", controller.getDashboardKpis);
router.get("/dataset", controller.getDataset);

module.exports = router;
