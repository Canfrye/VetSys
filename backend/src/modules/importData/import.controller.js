const asyncHandler = require("../../middleware/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");
const importService = require("./import.service");

const importLocalData = asyncHandler(async (req, res) => {
  const data = await importService.importLocalData(req.body || {});
  sendSuccess(res, { data });
});

module.exports = { importLocalData };
