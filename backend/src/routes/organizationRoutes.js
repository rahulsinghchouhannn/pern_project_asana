const express = require("express");
const organizationController = require("../controllers/organizationController");
const { validateRequest } = require("../middleware/validateRequest");
const authMiddleware = require("../middleware/authMiddleware");
const { orgMiddleware, requireOrgRole } = require("../middleware/orgMiddleware");
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

// POST /api/organizations/:orgId/invite — invite user (owner/admin only)
router.post(
  "/:orgId/invite",
  authMiddleware,
  orgMiddleware,
  requireOrgRole(["owner", "admin"]),
  validateRequest(inviteUserSchema),
  organizationController.inviteUser
);

// GET /api/organizations/:orgId/members — list members (member+)
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
