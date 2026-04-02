const express = require("express");
const taskController = require("../controllers/taskController");
const { validateRequest } = require("../middleware/validateRequest");
const authMiddleware = require("../middleware/authMiddleware");
const { orgMiddleware } = require("../middleware/orgMiddleware");
const { requirePermission } = require("../services/permissionService");
const { PERMISSIONS } = require("../config/permissions");
const {
  createTaskSchema,
  updateTaskSchema,
  assigneeSchema,
  taskFilterSchema,
  updatePositionSchema,
  bulkUpdatePositionsSchema,
  updateDatesSchema,
} = require("../validators/taskValidator");

const router = express.Router({ mergeParams: true });

// All task routes require auth + org context
router.use(authMiddleware, orgMiddleware);

// ── My Tasks (user-scoped) ─────────────────────────────────────────────────────
// Mounted at /api/tasks — must be defined before /:id routes
router.get("/my", taskController.getMyTasks);

// ── Bulk position update ──────────────────────────────────────────────────────
router.post(
  "/bulk-position",
  validateRequest(bulkUpdatePositionsSchema),
  taskController.bulkUpdatePositions
);

// ── Task CRUD ─────────────────────────────────────────────────────────────────
router.get("/:id", taskController.getById);
router.put("/:id", validateRequest(updateTaskSchema), taskController.update);
router.delete("/:id", requirePermission(PERMISSIONS.DELETE_TASK), taskController.deleteTask);
router.post("/:id/complete", taskController.complete);
router.post("/:id/reopen", taskController.reopen);

// ── Assignees ─────────────────────────────────────────────────────────────────
router.post("/:id/assignees", validateRequest(assigneeSchema), taskController.addAssignee);
router.delete("/:id/assignees/:userId", taskController.removeAssignee);

// ── Position / Dates ─────────────────────────────────────────────────────────
router.patch("/:id/position", validateRequest(updatePositionSchema), taskController.updatePosition);
router.patch("/:id/dates", validateRequest(updateDatesSchema), taskController.updateTaskDates);

// ── Subtasks / History ────────────────────────────────────────────────────────
router.get("/:id/subtasks", taskController.getSubtasks);
router.get("/:id/history", taskController.getHistory);

module.exports = router;
