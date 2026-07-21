const createCrudController = require("../../common/createCrudController");
const usersService = require("./users.service");

module.exports = createCrudController(usersService);
