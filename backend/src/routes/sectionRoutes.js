const express = require("express");
const sectionController = require("../controllers/sectionController");
const { validateRequest } = require("../middleware/validateRequest");
const authMiddleware = require("../middleware/authMiddleware");
const { orgMiddleware } = require("../middleware/orgMiddleware");
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
router.post("/", validateRequest(createSectionSchema), sectionController.create);
router.post("/reorder", validateRequest(reorderSectionsSchema), sectionController.reorder);

// ── Member ────────────────────────────────────────────────────────────────────
router.get("/:sectionId/task-count", sectionController.getTaskCount);
router.patch("/:sectionId", validateRequest(updateSectionSchema), sectionController.update);
router.delete("/:sectionId", sectionController.deleteOnly);
router.delete("/:sectionId/with-tasks", sectionController.deleteWithTasks);

module.exports = router;
