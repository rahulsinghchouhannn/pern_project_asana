const asyncHandler = require("../middleware/asyncHandler");
const organizationService = require("../services/organizationService");
const successResponse = require("../utils/successResponse");

const createOrg = asyncHandler(async (req, res) => {
  const org = await organizationService.createOrganization(req.user.userId, req.validated);
  res.status(201).json(successResponse(org));
});

const getUserOrgs = asyncHandler(async (req, res) => {
  const orgs = await organizationService.getUserOrganizations(req.user.userId);
  res.status(200).json(successResponse(orgs));
});

const switchOrg = asyncHandler(async (req, res) => {
  const org = await organizationService.switchOrganization(
    req.user.userId,
    req.params.orgId
  );
  res.status(200).json(successResponse(org));
});

const inviteUser = asyncHandler(async (req, res) => {
  const invitation = await organizationService.inviteUser(
    req.params.orgId,
    req.user.userId,
    req.validated.email
  );
  res.status(201).json(successResponse(invitation));
});

const acceptInvite = asyncHandler(async (req, res) => {
  const result = await organizationService.acceptInvitation(
    req.validated.token,
    req.user.userId
  );
  res.status(200).json(successResponse(result));
});

const rejectInvite = asyncHandler(async (req, res) => {
  const result = await organizationService.rejectInvitation(req.validated.token);
  res.status(200).json(successResponse(result));
});

const getMembers = asyncHandler(async (req, res) => {
  const members = await organizationService.getOrgMembers(req.params.orgId);
  res.status(200).json(successResponse(members));
});

const removeMember = asyncHandler(async (req, res) => {
  const result = await organizationService.removeMember(
    req.params.orgId,
    req.params.userId,
    req.user.userId
  );
  res.status(200).json(successResponse(result));
});

module.exports = { createOrg, getUserOrgs, switchOrg, inviteUser, acceptInvite, rejectInvite, getMembers, removeMember };
