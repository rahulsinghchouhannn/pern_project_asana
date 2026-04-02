const express = require("express");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const organizationRoutes = require("./organizationRoutes");
const projectRoutes = require("./projectRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/organizations", organizationRoutes);
router.use("/projects", projectRoutes);

module.exports = router;
