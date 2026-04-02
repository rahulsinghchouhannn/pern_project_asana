const asyncHandler = require("../middleware/asyncHandler");
const reportingService = require("../services/reportingService");
const successResponse = require("../utils/successResponse");

const getOrgDashboard = asyncHandler(async (req, res) => {
  const orgId = req.org.orgId;
  const { projectId, userId, startDate, endDate } = req.query;
  const data = await reportingService.getOrgDashboard(orgId, {
    projectId,
    userId,
    startDate,
    endDate,
  });
  res.status(200).json(successResponse(data));
});

const getProjectDashboard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = await reportingService.getProjectDashboard(id);
  res.status(200).json(successResponse(data));
});

module.exports = { getOrgDashboard, getProjectDashboard };
