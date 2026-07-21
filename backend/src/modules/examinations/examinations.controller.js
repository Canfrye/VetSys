const createCrudController = require("../../common/createCrudController");
const examinationsService = require("./examinations.service");

module.exports = createCrudController(examinationsService);
