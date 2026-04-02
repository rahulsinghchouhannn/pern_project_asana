const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { orgMiddleware } = require("../middleware/orgMiddleware");
const { validateRequest } = require("../middleware/validateRequest");
const { requirePermission } = require("../services/permissionService");
const { PERMISSIONS } = require("../config/permissions");
const roleController = require("../controllers/roleController");
const {
  createRoleSchema,
  updateRoleSchema,
  assignRoleSchema,
} = require("../validators/roleValidator");

const router = express.Router({ mergeParams: true });

// All role routes require auth + org context
router.use(authMiddleware, orgMiddleware);

// GET /api/organizations/:orgId/my-permissions
router.get("/my-permissions", roleController.getMyPermissions);

// GET /api/organizations/:orgId/roles
router.get("/roles", roleController.getOrgRoles);

// POST /api/organizations/:orgId/roles
router.post(
  "/roles",
  requirePermission(PERMISSIONS.MANAGE_ROLES),
  validateRequest(createRoleSchema),
  roleController.createRole
);

// PUT /api/organizations/:orgId/roles/:roleId
router.put(
  "/roles/:roleId",
  requirePermission(PERMISSIONS.MANAGE_ROLES),
  validateRequest(updateRoleSchema),
  roleController.updateRole
);

// DELETE /api/organizations/:orgId/roles/:roleId
router.delete(
  "/roles/:roleId",
  requirePermission(PERMISSIONS.MANAGE_ROLES),
  roleController.deleteRole
);

// PUT /api/organizations/:orgId/members/:userId/role
router.put(
  "/members/:userId/role",
  requirePermission(PERMISSIONS.MANAGE_ROLES),
  validateRequest(assignRoleSchema),
  roleController.assignOrgRole
);

module.exports = router;
