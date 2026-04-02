const express = require("express");
const taskController = require("../controllers/taskController");
const { validateRequest } = require("../middleware/validateRequest");
const authMiddleware = require("../middleware/authMiddleware");
const { orgMiddleware } = require("../middleware/orgMiddleware");
const { requirePermission } = require("../services/permissionService");
const { PERMISSIONS } = require("../config/permissions");
const {
  createTaskSchema,
  taskFilterSchema,
  calendarQuerySchema,
} = require("../validators/taskValidator");

// mergeParams allows access to :projectId from the parent router
const router = express.Router({ mergeParams: true });

router.use(authMiddleware, orgMiddleware);

// ── Specific sub-resource routes (must come before GET /) ────────────────────
router.get("/board", taskController.getBoardTasks);
router.get("/calendar", validateRequest(calendarQuerySchema, "query"), taskController.getCalendarTasks);
router.get("/timeline", taskController.getTimelineTasks);

// ── Base CRUD ─────────────────────────────────────────────────────────────────
router.post("/", requirePermission(PERMISSIONS.CREATE_TASK), validateRequest(createTaskSchema), taskController.create);
router.get("/", validateRequest(taskFilterSchema, "query"), taskController.listByProject);

module.exports = router;
