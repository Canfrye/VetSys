const express = require("express");

const authenticate = require("../../middleware/authenticate");
const validate = require("../../middleware/validate");

const controller = require("./animals.controller");
const { createAnimalSchema, updateAnimalSchema } = require("./animals.validation");

const router = express.Router();

// Hayvan kayıtları tüm giriş yapmış roller tarafından görülüp yönetilebilir.
router.use(authenticate);

router.get("/", controller.list);
router.post("/", validate(createAnimalSchema), controller.create);

router.get("/:id", controller.getById);
router.put("/:id", validate(updateAnimalSchema), controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
