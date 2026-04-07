const express = require("express");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const organizationRoutes = require("./organizationRoutes");
const projectRoutes = require("./projectRoutes");
const taskRoutes = require("./taskRoutes");
const projectTaskRoutes = require("./projectTaskRoutes");
const { projectFieldRouter, taskFieldValueRouter } = require("./customFieldRoutes");
const roleRoutes = require("./roleRoutes");
const commentRoutes = require("./commentRoutes");
const notificationRoutes = require("./notificationRoutes");
const reportingRoutes = require("./reportingRoutes");
const invitationRoutes = require("./invitationRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/organizations", organizationRoutes);
router.use("/organizations/:orgId", roleRoutes);
router.use("/projects", projectRoutes);
router.use("/projects/:projectId/tasks", projectTaskRoutes);
router.use("/projects/:projectId/custom-fields", projectFieldRouter);
router.use("/tasks", taskRoutes);
router.use("/tasks/:taskId/custom-field-values", taskFieldValueRouter);
router.use("/", commentRoutes);
router.use("/notifications", notificationRoutes);
router.use("/reporting", reportingRoutes);
router.use("/invitations", invitationRoutes);

module.exports = router;
