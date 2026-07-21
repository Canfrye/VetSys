const asyncHandler = require("../../middleware/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");
const searchService = require("./search.service");

const search = asyncHandler(async (req, res) => {
  const data = await searchService.search(req.query.q || "");
  sendSuccess(res, { data });
});

module.exports = { search };
