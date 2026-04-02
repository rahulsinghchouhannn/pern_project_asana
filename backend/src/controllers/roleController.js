const asyncHandler = require("../middleware/asyncHandler");
const permissionService = require("../services/permissionService");
const successResponse = require("../utils/successResponse");

const getOrgRoles = asyncHandler(async (req, res) => {
  const roles = await permissionService.getOrgRoles(req.params.orgId);
  res.status(200).json(successResponse(roles));
});

const createRole = asyncHandler(async (req, res) => {
  const { name, permissions } = req.validated;
  const role = await permissionService.createRole(req.params.orgId, name, permissions);
  res.status(201).json(successResponse(role));
});

const updateRole = asyncHandler(async (req, res) => {
  const { name, permissions } = req.validated;
  const role = await permissionService.updateRole(req.params.roleId, name, permissions);
  res.status(200).json(successResponse(role));
});

const deleteRole = asyncHandler(async (req, res) => {
  const result = await permissionService.deleteRole(req.params.roleId, req.params.orgId);
  res.status(200).json(successResponse(result));
});

const assignOrgRole = asyncHandler(async (req, res) => {
  const { roleId } = req.validated;
  const result = await permissionService.assignOrgRole(
    req.params.userId,
    req.params.orgId,
    roleId
  );
  res.status(200).json(successResponse(result));
});

const assignProjectRole = asyncHandler(async (req, res) => {
  const { roleId } = req.validated;
  const result = await permissionService.assignProjectRole(
    req.params.userId,
    req.params.projectId,
    roleId
  );
  res.status(200).json(successResponse(result));
});

const getMyPermissions = asyncHandler(async (req, res) => {
  const { orgId } = req.params;
  const projectId = req.query.projectId || null;
  const permissions = await permissionService.getMyPermissions(
    req.user.userId,
    orgId,
    projectId
  );
  res.status(200).json(successResponse({ permissions }));
});

module.exports = {
  getOrgRoles,
  createRole,
  updateRole,
  deleteRole,
  assignOrgRole,
  assignProjectRole,
  getMyPermissions,
};
