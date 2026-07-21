const createCrudController = require("../../common/createCrudController");
const paymentsService = require("./payments.service");

module.exports = createCrudController(paymentsService);
