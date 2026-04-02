const express = require("express");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const organizationRoutes = require("./organizationRoutes");
const projectRoutes = require("./projectRoutes");
const taskRoutes = require("./taskRoutes");
const projectTaskRoutes = require("./projectTaskRoutes");
const { projectFieldRouter, taskFieldValueRouter } = require("./customFieldRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/organizations", organizationRoutes);
router.use("/projects", projectRoutes);
router.use("/projects/:projectId/tasks", projectTaskRoutes);
router.use("/projects/:projectId/custom-fields", projectFieldRouter);
router.use("/tasks", taskRoutes);
router.use("/tasks/:taskId/custom-field-values", taskFieldValueRouter);

module.exports = router;
