const createCrudController = require("../../common/createCrudController");
const prescriptionsService = require("./prescriptions.service");

module.exports = createCrudController(prescriptionsService);
