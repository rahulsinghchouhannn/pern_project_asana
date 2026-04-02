const express = require("express");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const organizationRoutes = require("./organizationRoutes");
const projectRoutes = require("./projectRoutes");
const taskRoutes = require("./taskRoutes");
const projectTaskRoutes = require("./projectTaskRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/organizations", organizationRoutes);
router.use("/projects", projectRoutes);
router.use("/projects/:projectId/tasks", projectTaskRoutes);
router.use("/tasks", taskRoutes);

module.exports = router;
