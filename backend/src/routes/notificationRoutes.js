const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { orgMiddleware } = require("../middleware/orgMiddleware");
const {
  getUserNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  deleteNotification,
} = require("../controllers/notificationController");

const router = express.Router();

router.use(authMiddleware, orgMiddleware);

router.get("/", getUserNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/:id/read", markRead);
router.post("/mark-all-read", markAllRead);
router.delete("/:id", deleteNotification);

module.exports = router;
