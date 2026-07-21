const createCrudController = require("../../common/createCrudController");
const customersService = require("./customers.service");

module.exports = createCrudController(customersService);
