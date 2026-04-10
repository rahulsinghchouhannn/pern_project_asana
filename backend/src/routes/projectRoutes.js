const express = require("express");
const projectController = require("../controllers/projectController");
const roleController = require("../controllers/roleController");
const { validateRequest } = require("../middleware/validateRequest");
const authMiddleware = require("../middleware/authMiddleware");
const { orgMiddleware } = require("../middleware/orgMiddleware");
const { requirePermission } = require("../services/permissionService");
const { PERMISSIONS } = require("../config/permissions");
const { assignRoleSchema } = require("../validators/roleValidator");
const {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  createStatusSchema,
  updateStatusSchema,
  reorderStatusesSchema,
} = require("../validators/projectValidator");
const { inviteToProjectSchema } = require("../validators/invitationValidator");

const router = express.Router();

// All project routes require auth + org context
router.use(authMiddleware, orgMiddleware);

// ── Project CRUD ──────────────────────────────────────────────────────────────
router.post("/", requirePermission(PERMISSIONS.CREATE_PROJECT), validateRequest(createProjectSchema), projectController.create);
router.get("/", projectController.list);
router.get("/:id", projectController.getById);
router.put("/:id", requirePermission(PERMISSIONS.MANAGE_PROJECT_SETTINGS), validateRequest(updateProjectSchema), projectController.update);
router.delete("/:id", projectController.deleteProject);
router.post("/:id/archive", requirePermission(PERMISSIONS.ARCHIVE_PROJECT), projectController.archive);
router.post("/:id/complete", projectController.complete);

// ── Members ───────────────────────────────────────────────────────────────────
router.get("/:id/members", projectController.getMembers);
router.post("/:id/members", validateRequest(addMemberSchema), projectController.addMember);
router.delete("/:id/members/:userId", projectController.removeMember);

// ── Invite via email ──────────────────────────────────────────────────────────
router.post("/:id/invite", validateRequest(inviteToProjectSchema), projectController.inviteToProject);

// ── Project member role override ──────────────────────────────────────────────
router.put(
  "/:projectId/members/:userId/role",
  requirePermission(PERMISSIONS.MANAGE_PROJECT_MEMBERS),
  validateRequest(assignRoleSchema),
  roleController.assignProjectRole
);

// ── Statuses ──────────────────────────────────────────────────────────────────
router.get("/:id/statuses", projectController.getStatuses);
router.post("/:id/statuses", validateRequest(createStatusSchema), projectController.createStatus);
router.post("/:id/statuses/reorder", validateRequest(reorderStatusesSchema), projectController.reorderStatuses);
router.put("/:id/statuses/:statusId", validateRequest(updateStatusSchema), projectController.updateStatus);
router.delete("/:id/statuses/:statusId", projectController.deleteStatus);

module.exports = router;
