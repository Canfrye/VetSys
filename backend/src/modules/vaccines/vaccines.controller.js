const createCrudController = require("../../common/createCrudController");
const vaccinesService = require("./vaccines.service");

module.exports = createCrudController(vaccinesService);
