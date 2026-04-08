const asyncHandler = require("../middleware/asyncHandler");
const sectionService = require("../services/sectionService");
const successResponse = require("../utils/successResponse");

const create = asyncHandler(async (req, res) => {
  const section = await sectionService.createSection(
    req.params.projectId,
    req.org.orgId,
    req.validated
  );
  res.status(201).json(successResponse(section));
});

const list = asyncHandler(async (req, res) => {
  const sections = await sectionService.getSectionsByProject(req.params.projectId);
  res.status(200).json(successResponse(sections));
});

const update = asyncHandler(async (req, res) => {
  const section = await sectionService.updateSection(
    req.params.sectionId,
    req.params.projectId,
    req.validated
  );
  res.status(200).json(successResponse(section));
});

const reorder = asyncHandler(async (req, res) => {
  const sections = await sectionService.reorderSections(
    req.params.projectId,
    req.validated.sectionIds
  );
  res.status(200).json(successResponse(sections));
});

const deleteOnly = asyncHandler(async (req, res) => {
  await sectionService.deleteSectionOnly(req.params.sectionId, req.params.projectId);
  res.status(200).json(successResponse({ deleted: true }));
});

const deleteWithTasks = asyncHandler(async (req, res) => {
  await sectionService.deleteSectionWithTasks(req.params.sectionId, req.params.projectId);
  res.status(200).json(successResponse({ deleted: true }));
});

const getTaskCount = asyncHandler(async (req, res) => {
  const count = await sectionService.getSectionTaskCount(req.params.sectionId);
  res.status(200).json(successResponse({ count }));
});

module.exports = {
  create,
  list,
  update,
  reorder,
  deleteOnly,
  deleteWithTasks,
  getTaskCount,
};
