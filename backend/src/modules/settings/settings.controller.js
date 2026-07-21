const asyncHandler = require("../../middleware/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");
const settingsService = require("./settings.service");

const get = asyncHandler(async (req, res) => {
  const data = await settingsService.get();
  sendSuccess(res, { data });
});

const put = asyncHandler(async (req, res) => {
  const data = await settingsService.put(req.body || {});
  sendSuccess(res, { data });
});

module.exports = { get, put };
