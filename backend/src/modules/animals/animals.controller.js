const createCrudController = require("../../common/createCrudController");
const animalsService = require("./animals.service");

module.exports = createCrudController(animalsService);
