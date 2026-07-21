const createCrudController = require("../../common/createCrudController");
const stockService = require("./stock.service");

module.exports = createCrudController(stockService);
