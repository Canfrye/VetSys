const express = require("express");

const authenticate = require("../../middleware/authenticate");
const validate = require("../../middleware/validate");

const controller = require("./customers.controller");
const { createCustomerSchema, updateCustomerSchema } = require("./customers.validation");

const router = express.Router();

// Müşteri kayıtları tüm giriş yapmış roller tarafından görülüp yönetilebilir.
router.use(authenticate);

router.get("/", controller.list);
router.post("/", validate(createCustomerSchema), controller.create);

router.get("/:id", controller.getById);
router.put("/:id", validate(updateCustomerSchema), controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
