import api from "./api";

const createOrganization = async (data) =>
  api.post("/organizations", data);

const getUserOrganizations = async () =>
  api.get("/organizations/mine");

const switchOrganization = async (orgId) =>
  api.post(`/organizations/${orgId}/switch`);

const inviteUser = async (orgId, email, orgId_header) =>
  api.post(
    `/organizations/${orgId}/invite`,
    { email },
    { headers: { "x-org-id": orgId_header ?? orgId } }
  );

const acceptInvitation = async (token) =>
  api.post("/organizations/invitations/accept", { token });

const rejectInvitation = async (token) =>
  api.post("/organizations/invitations/reject", { token });

const getOrgMembers = async (orgId) =>
  api.get(`/organizations/${orgId}/members`, {
    headers: { "x-org-id": orgId },
  });

const removeMember = async (orgId, userId) =>
  api.delete(`/organizations/${orgId}/members/${userId}`);

export default {
  createOrganization,
  getUserOrganizations,
  switchOrganization,
  inviteUser,
  acceptInvitation,
  rejectInvitation,
  getOrgMembers,
  removeMember,
};
