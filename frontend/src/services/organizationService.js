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
  api.post(`/organizations/${orgId}/members/${userId}/remove`);

const getOrgInvitations = async (orgId) =>
  api.get(`/organizations/${orgId}/invitations`);

const resendInvitation = async (orgId, invitationId) =>
  api.post(`/organizations/${orgId}/invitations/${invitationId}/resend`);

const cancelInvitation = async (orgId, invitationId) =>
  api.delete(`/organizations/${orgId}/invitations/${invitationId}`);

const getOrgRoles = async (orgId) =>
  api.get(`/organizations/${orgId}/roles`);

const updateMemberRole = async (orgId, userId, roleId) =>
  api.put(`/organizations/${orgId}/members/${userId}/role`, { roleId });

const updateOrganization = async (orgId, data) =>
  api.patch(`/organizations/${orgId}`, data, { headers: { "x-org-id": orgId } });

const deleteOrganization = async (orgId) =>
  api.delete(`/organizations/${orgId}`);

export default {
  createOrganization,
  getUserOrganizations,
  switchOrganization,
  inviteUser,
  acceptInvitation,
  rejectInvitation,
  getOrgMembers,
  removeMember,
  getOrgInvitations,
  resendInvitation,
  cancelInvitation,
  getOrgRoles,
  updateMemberRole,
  updateOrganization,
  deleteOrganization,
};
