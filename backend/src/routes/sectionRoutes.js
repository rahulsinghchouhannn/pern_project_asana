const express = require("express");
const sectionController = require("../controllers/sectionController");
const { validateRequest } = require("../middleware/validateRequest");
const authMiddleware = require("../middleware/authMiddleware");
const { orgMiddleware } = require("../middleware/orgMiddleware");
const { requirePermission } = require("../services/permissionService");
const { PERMISSIONS } = require("../config/permissions");
const {
  createSectionSchema,
  updateSectionSchema,
  reorderSectionsSchema,
} = require("../validators/sectionValidator");

// mergeParams gives access to :projectId from the parent router
const router = express.Router({ mergeParams: true });

router.use(authMiddleware, orgMiddleware);

// ── Collection ────────────────────────────────────────────────────────────────
router.get("/", sectionController.list);
router.post("/", requirePermission(PERMISSIONS.CREATE_TASK), validateRequest(createSectionSchema), sectionController.create);
router.post("/reorder", requirePermission(PERMISSIONS.REORDER_TASK), validateRequest(reorderSectionsSchema), sectionController.reorder);

// ── Member ────────────────────────────────────────────────────────────────────
router.get("/:sectionId/task-count", sectionController.getTaskCount);
router.patch("/:sectionId", requirePermission(PERMISSIONS.EDIT_TASK), validateRequest(updateSectionSchema), sectionController.update);
router.delete("/:sectionId", requirePermission(PERMISSIONS.DELETE_TASK), sectionController.deleteOnly);
router.delete("/:sectionId/with-tasks", requirePermission(PERMISSIONS.DELETE_TASK), sectionController.deleteWithTasks);

module.exports = router;

