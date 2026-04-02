const express = require("express");
const organizationController = require("../controllers/organizationController");
const { validateRequest } = require("../middleware/validateRequest");
const authMiddleware = require("../middleware/authMiddleware");
const { orgMiddleware } = require("../middleware/orgMiddleware");
const { requirePermission } = require("../services/permissionService");
const { PERMISSIONS } = require("../config/permissions");
const {
  createOrgSchema,
  inviteUserSchema,
  acceptInviteSchema,
} = require("../validators/organizationValidator");

const router = express.Router();

// POST /api/organizations — create org (auth required)
router.post(
  "/",
  authMiddleware,
  validateRequest(createOrgSchema),
  organizationController.createOrg
);

// GET /api/organizations/mine — list user's orgs
router.get("/mine", authMiddleware, organizationController.getUserOrgs);

// POST /api/organizations/:orgId/switch — switch active org
router.post("/:orgId/switch", authMiddleware, organizationController.switchOrg);

// POST /api/organizations/:orgId/invite — invite user
router.post(
  "/:orgId/invite",
  authMiddleware,
  orgMiddleware,
  requirePermission(PERMISSIONS.INVITE_USER),
  validateRequest(inviteUserSchema),
  organizationController.inviteUser
);

// DELETE /api/organizations/:orgId/members/:userId — remove member
router.delete(
  "/:orgId/members/:userId",
  authMiddleware,
  orgMiddleware,
  requirePermission(PERMISSIONS.REMOVE_USER),
  organizationController.removeMember
);

// GET /api/organizations/:orgId/members — list members
router.get(
  "/:orgId/members",
  authMiddleware,
  orgMiddleware,
  organizationController.getMembers
);

// POST /api/invitations/accept — accept invitation (auth required)
router.post(
  "/invitations/accept",
  authMiddleware,
  validateRequest(acceptInviteSchema),
  organizationController.acceptInvite
);

// POST /api/invitations/reject — reject invitation (no auth required)
router.post(
  "/invitations/reject",
  validateRequest(acceptInviteSchema),
  organizationController.rejectInvite
);

module.exports = router;
