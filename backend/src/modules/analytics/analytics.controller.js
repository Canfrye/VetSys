const asyncHandler = require("../../middleware/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");
const analyticsService = require("./analytics.service");

const getReport = asyncHandler(async (req, res) => {
  const data = await analyticsService.getReport(
    {
      startDate: req.query.startDate || "",
      endDate: req.query.endDate || "",
    },
    req.user?.role
  );
  sendSuccess(res, { data });
});

const getDashboardKpis = asyncHandler(async (req, res) => {
  const data = await analyticsService.getDashboardKpis();
  sendSuccess(res, { data });
});

const getDataset = asyncHandler(async (req, res) => {
  const data = await analyticsService.getDataset();
  sendSuccess(res, { data });
});

module.exports = { getReport, getDashboardKpis, getDataset };
