const asyncHandler = require("../middleware/asyncHandler");
const projectService = require("../services/projectService");
const invitationService = require("../services/invitationService");
const successResponse = require("../utils/successResponse");

const create = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(
    req.org.orgId,
    req.user.userId,
    req.validated
  );
  res.status(201).json(successResponse(project));
});

const list = asyncHandler(async (req, res) => {
  const projects = await projectService.getOrgProjects(
    req.org.orgId,
    req.user.userId
  );
  res.status(200).json(successResponse(projects));
});

const getById = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectById(
    req.params.id,
    req.user.userId
  );
  res.status(200).json(successResponse(project));
});

const update = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(
    req.params.id,
    req.user.userId,
    req.validated
  );
  res.status(200).json(successResponse(project));
});

const archive = asyncHandler(async (req, res) => {
  const project = await projectService.archiveProject(
    req.params.id,
    req.user.userId
  );
  res.status(200).json(successResponse(project));
});

const complete = asyncHandler(async (req, res) => {
  const project = await projectService.completeProject(
    req.params.id,
    req.user.userId
  );
  res.status(200).json(successResponse(project));
});

const deleteProject = asyncHandler(async (req, res) => {
  await projectService.deleteProject(req.params.id, req.user.userId);
  res.status(200).json(successResponse({ deleted: true }));
});

const addMember = asyncHandler(async (req, res) => {
  const member = await projectService.addMember(
    req.params.id,
    req.user.userId,
    req.validated
  );
  res.status(201).json(successResponse(member));
});

const removeMember = asyncHandler(async (req, res) => {
  await projectService.removeMember(
    req.params.id,
    req.user.userId,
    req.params.userId
  );
  res.status(200).json(successResponse({ removed: true }));
});

const getMembers = asyncHandler(async (req, res) => {
  const members = await projectService.getProjectMembers(req.params.id);
  res.status(200).json(successResponse(members));
});

const getStatuses = asyncHandler(async (req, res) => {
  const statuses = await projectService.getProjectStatuses(req.params.id);
  res.status(200).json(successResponse(statuses));
});

const createStatus = asyncHandler(async (req, res) => {
  const status = await projectService.createStatus(
    req.params.id,
    req.user.userId,
    req.validated
  );
  res.status(201).json(successResponse(status));
});

const updateStatus = asyncHandler(async (req, res) => {
  const status = await projectService.updateStatus(
    req.params.statusId,
    req.validated
  );
  res.status(200).json(successResponse(status));
});

const deleteStatus = asyncHandler(async (req, res) => {
  await projectService.deleteStatus(req.params.statusId, req.params.id);
  res.status(200).json(successResponse({ deleted: true }));
});

const reorderStatuses = asyncHandler(async (req, res) => {
  const statuses = await projectService.reorderStatuses(
    req.params.id,
    req.validated.orderedIds
  );
  res.status(200).json(successResponse(statuses));
});

const inviteToProject = asyncHandler(async (req, res) => {
  const invitation = await invitationService.sendProjectInvitation(
    req.params.id,
    req.org.orgId,
    req.user.userId,
    req.validated.email
  );
  res.status(201).json(successResponse(invitation));
});

module.exports = {
  create,
  list,
  getById,
  update,
  archive,
  complete,
  deleteProject,
  addMember,
  removeMember,
  getMembers,
  getStatuses,
  createStatus,
  updateStatus,
  deleteStatus,
  reorderStatuses,
  inviteToProject,
};
