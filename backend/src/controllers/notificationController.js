const asyncHandler = require("../middleware/asyncHandler");
const notificationService = require("../services/notificationService");
const successResponse = require("../utils/successResponse");

const getUserNotifications = asyncHandler(async (req, res) => {
  const { unreadOnly, limit, offset } = req.query;
  const data = await notificationService.getUserNotifications(req.user.userId, {
    unreadOnly: unreadOnly === "true",
    limit: limit ? Number(limit) : 50,
    offset: offset ? Number(offset) : 0,
  });
  res.status(200).json(successResponse(data));
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const total = await notificationService.getUnreadCount(req.user.userId, req.org.orgId);
  res.status(200).json(successResponse({ count: total }));
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markRead(req.params.id, req.user.userId);
  res.status(200).json(successResponse(notification));
});

const markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user.userId, req.org.orgId);
  res.status(200).json(successResponse({ success: true }));
});

const deleteNotification = asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(req.params.id, req.user.userId);
  res.status(200).json(successResponse({ deleted: true }));
});

module.exports = { getUserNotifications, getUnreadCount, markRead, markAllRead, deleteNotification };
