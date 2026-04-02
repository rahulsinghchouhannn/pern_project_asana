const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { validateRequest } = require("../middleware/validateRequest");
const {
  createFieldSchema,
  updateFieldSchema,
  reorderFieldsSchema,
  setValueSchema,
} = require("../validators/customFieldValidator");
const {
  getProjectFields,
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
projectFieldRouter.use(authMiddleware);

projectFieldRouter.get("/", getProjectFields);
projectFieldRouter.post("/", validateRequest(createFieldSchema), createField);
projectFieldRouter.post("/reorder", validateRequest(reorderFieldsSchema), reorderFields);
projectFieldRouter.put("/:fieldId", validateRequest(updateFieldSchema), updateField);
projectFieldRouter.delete("/:fieldId", deleteField);

// Task-scoped value routes
const taskFieldValueRouter = express.Router({ mergeParams: true });
taskFieldValueRouter.use(authMiddleware);

taskFieldValueRouter.get("/", getTaskFieldValues);
taskFieldValueRouter.put("/:fieldId", validateRequest(setValueSchema), setTaskFieldValue);

module.exports = { projectFieldRouter, taskFieldValueRouter };
