const express = require("express");
const commentController = require("../controllers/commentController");
const activityController = require("../controllers/activityController");
const { validateRequest } = require("../middleware/validateRequest");
const authMiddleware = require("../middleware/authMiddleware");
const { orgMiddleware } = require("../middleware/orgMiddleware");
const { requirePermission } = require("../services/permissionService");
const { PERMISSIONS } = require("../config/permissions");
const { createCommentSchema, updateCommentSchema } = require("../validators/commentValidator");

const router = express.Router({ mergeParams: true });

router.use(authMiddleware, orgMiddleware);

// Task comments
router.get(
  "/tasks/:taskId/comments",
  commentController.getTaskComments
);
router.post(
  "/tasks/:taskId/comments",
  requirePermission(PERMISSIONS.CREATE_COMMENT),
  validateRequest(createCommentSchema),
  commentController.createComment
);

// Individual comment operations (id is comment id)
router.put(
  "/comments/:id",
  requirePermission(PERMISSIONS.EDIT_COMMENT),
  validateRequest(updateCommentSchema),
  commentController.updateComment
);
router.delete(
  "/comments/:id",
  requirePermission(PERMISSIONS.DELETE_COMMENT),
  commentController.deleteComment
);

// Task activity
router.get(
  "/tasks/:taskId/activity",
  activityController.getTaskActivity
);

// Project activity
router.get(
  "/projects/:projectId/activity",
  activityController.getProjectActivity
);

module.exports = router;
