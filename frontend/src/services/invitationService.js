import api from "./api";

const invitationService = {
  /**
   * Fetch public info about an invitation token.
   * Used on the accept page to know if it's valid, who it's for,
   * and which project to redirect to after acceptance.
   * No auth required.
   */
  getInvitationInfo: (token) => api.get(`/invitations/info/${token}`),

  /**
   * Check if an email is already registered in the system.
   * Used to decide whether to send the user to /login or /register.
   */
  checkEmail: (email) => api.post("/auth/check-email", { email }),
};

export default invitationService;
