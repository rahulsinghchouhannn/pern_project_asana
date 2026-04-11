const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { orgMiddleware } = require("../middleware/orgMiddleware");
const { validateRequest } = require("../middleware/validateRequest");
const { requirePermission } = require("../services/permissionService");
const { PERMISSIONS } = require("../config/permissions");
const {
  createFieldSchema,
  updateFieldSchema,
  reorderFieldsSchema,
  setValueSchema,
} = require("../validators/customFieldValidator");
const {
  getProjectFields,
  getProjectFieldValues,
  createField,
  updateField,
  deleteField,
  reorderFields,
  getTaskFieldValues,
  setTaskFieldValue,
} = require("../controllers/customFieldController");

const router = express.Router({ mergeParams: true });

router.use(authMiddleware);

// Project-scoped field routes (mergeParams gives us :projectId)
const projectFieldRouter = express.Router({ mergeParams: true });
projectFieldRouter.use(authMiddleware, orgMiddleware);

projectFieldRouter.get("/", getProjectFields);
projectFieldRouter.get("/values", getProjectFieldValues);
projectFieldRouter.post("/", requirePermission(PERMISSIONS.MANAGE_PROJECT_SETTINGS), validateRequest(createFieldSchema), createField);
projectFieldRouter.post("/reorder", requirePermission(PERMISSIONS.MANAGE_PROJECT_SETTINGS), validateRequest(reorderFieldsSchema), reorderFields);
projectFieldRouter.put("/:fieldId", requirePermission(PERMISSIONS.MANAGE_PROJECT_SETTINGS), validateRequest(updateFieldSchema), updateField);
projectFieldRouter.delete("/:fieldId", requirePermission(PERMISSIONS.MANAGE_PROJECT_SETTINGS), deleteField);

// Task-scoped value routes
const taskFieldValueRouter = express.Router({ mergeParams: true });
taskFieldValueRouter.use(authMiddleware, orgMiddleware);

taskFieldValueRouter.get("/", getTaskFieldValues);
taskFieldValueRouter.put("/:fieldId", requirePermission(PERMISSIONS.EDIT_TASK), validateRequest(setValueSchema), setTaskFieldValue);

module.exports = { projectFieldRouter, taskFieldValueRouter };
