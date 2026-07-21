const createCrudController = require("../../common/createCrudController");
const stockMovementsService = require("./stockMovements.service");

module.exports = createCrudController(stockMovementsService);
