const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { orgMiddleware } = require("../middleware/orgMiddleware");
const { getOrgDashboard, getProjectDashboard } = require("../controllers/reportingController");

const router = express.Router();

router.use(authMiddleware, orgMiddleware);

router.get("/dashboard", getOrgDashboard);
router.get("/projects/:id/dashboard", getProjectDashboard);

module.exports = router;
