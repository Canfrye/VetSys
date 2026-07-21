const createCrudController = require("../../common/createCrudController");
const asyncHandler = require("../../middleware/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");

const invoicesService = require("./invoices.service");

const controller = createCrudController(invoicesService);

controller.getByAnimalId = asyncHandler(async (req, res) => {
  const data = await invoicesService.getByAnimalId(req.params.animalId);
  sendSuccess(res, { data });
});

module.exports = controller;
