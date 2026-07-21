const express = require("express");

const authRoutes = require("../modules/auth/auth.routes");
const usersRoutes = require("../modules/users/users.routes");
const customersRoutes = require("../modules/customers/customers.routes");
const animalsRoutes = require("../modules/animals/animals.routes");
const appointmentsRoutes = require("../modules/appointments/appointments.routes");
const examinationsRoutes = require("../modules/examinations/examinations.routes");
const vaccinesRoutes = require("../modules/vaccines/vaccines.routes");
const stockRoutes = require("../modules/stock/stock.routes");
const stockMovementsRoutes = require("../modules/stockMovements/stockMovements.routes");
const invoicesRoutes = require("../modules/invoices/invoices.routes");
const prescriptionsRoutes = require("../modules/prescriptions/prescriptions.routes");
const paymentsRoutes = require("../modules/payments/payments.routes");
const settingsRoutes = require("../modules/settings/settings.routes");
const searchRoutes = require("../modules/search/search.routes");
const analyticsRoutes = require("../modules/analytics/analytics.routes");
const importRoutes = require("../modules/importData/import.routes");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } });
});

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/customers", customersRoutes);
router.use("/animals", animalsRoutes);
router.use("/appointments", appointmentsRoutes);
router.use("/examinations", examinationsRoutes);
router.use("/vaccines", vaccinesRoutes);
router.use("/stock", stockRoutes);
router.use("/stock-movements", stockMovementsRoutes);
router.use("/invoices", invoicesRoutes);
router.use("/prescriptions", prescriptionsRoutes);
router.use("/payments", paymentsRoutes);
router.use("/settings", settingsRoutes);
router.use("/search", searchRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/import", importRoutes);

module.exports = router;
