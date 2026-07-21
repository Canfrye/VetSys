const createCrudController = require("../../common/createCrudController");
const appointmentsService = require("./appointments.service");

module.exports = createCrudController(appointmentsService);
