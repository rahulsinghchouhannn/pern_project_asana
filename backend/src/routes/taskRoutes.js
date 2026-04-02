const express = require("express");
const taskController = require("../controllers/taskController");
const { validateRequest } = require("../middleware/validateRequest");
const authMiddleware = require("../middleware/authMiddleware");
const { orgMiddleware } = require("../middleware/orgMiddleware");
const {
  createTaskSchema,
  updateTaskSchema,
  assigneeSchema,
  taskFilterSchema,
  updatePositionSchema,
  bulkUpdatePositionsSchema,
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
router.delete("/:id", taskController.deleteTask);
router.post("/:id/complete", taskController.complete);
router.post("/:id/reopen", taskController.reopen);

// ── Assignees ─────────────────────────────────────────────────────────────────
router.post("/:id/assignees", validateRequest(assigneeSchema), taskController.addAssignee);
router.delete("/:id/assignees/:userId", taskController.removeAssignee);

// ── Position ──────────────────────────────────────────────────────────────────
router.patch("/:id/position", validateRequest(updatePositionSchema), taskController.updatePosition);

// ── Subtasks / History ────────────────────────────────────────────────────────
router.get("/:id/subtasks", taskController.getSubtasks);
router.get("/:id/history", taskController.getHistory);

module.exports = router;
