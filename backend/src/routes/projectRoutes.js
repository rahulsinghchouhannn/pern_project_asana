const express = require("express");
const projectController = require("../controllers/projectController");
const { validateRequest } = require("../middleware/validateRequest");
const authMiddleware = require("../middleware/authMiddleware");
const { orgMiddleware } = require("../middleware/orgMiddleware");
const {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  createStatusSchema,
  updateStatusSchema,
  reorderStatusesSchema,
} = require("../validators/projectValidator");

const router = express.Router();

// All project routes require auth + org context
router.use(authMiddleware, orgMiddleware);

// ── Project CRUD ──────────────────────────────────────────────────────────────
router.post("/", validateRequest(createProjectSchema), projectController.create);
router.get("/", projectController.list);
router.get("/:id", projectController.getById);
router.put("/:id", validateRequest(updateProjectSchema), projectController.update);
router.delete("/:id", projectController.deleteProject);
router.post("/:id/archive", projectController.archive);
router.post("/:id/complete", projectController.complete);

// ── Members ───────────────────────────────────────────────────────────────────
router.get("/:id/members", projectController.getMembers);
router.post("/:id/members", validateRequest(addMemberSchema), projectController.addMember);
router.delete("/:id/members/:userId", projectController.removeMember);

// ── Statuses ──────────────────────────────────────────────────────────────────
router.get("/:id/statuses", projectController.getStatuses);
router.post("/:id/statuses", validateRequest(createStatusSchema), projectController.createStatus);
router.post("/:id/statuses/reorder", validateRequest(reorderStatusesSchema), projectController.reorderStatuses);
router.put("/:id/statuses/:statusId", validateRequest(updateStatusSchema), projectController.updateStatus);
router.delete("/:id/statuses/:statusId", projectController.deleteStatus);

module.exports = router;
