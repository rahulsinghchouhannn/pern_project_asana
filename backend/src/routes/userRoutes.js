const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const { orgMiddleware } = require("../middleware/orgMiddleware");

const router = express.Router();

router.get("/me", authMiddleware, userController.getMe);
router.get("/", authMiddleware, userController.getAllUsers);

// Activity (requires org context)
router.get("/me/activity", authMiddleware, orgMiddleware, userController.getUserActivity);
router.post("/me/activity/archive-all", authMiddleware, orgMiddleware, userController.archiveAll);
router.patch("/activity/:id/read", authMiddleware, orgMiddleware, userController.markActivityRead);

module.exports = router;
