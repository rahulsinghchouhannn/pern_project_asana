import api, { getOrgHeader } from "./api";

const notificationService = {
  getNotifications: (params = {}) =>
    api.get("/notifications", { headers: getOrgHeader(), params }),

  getUnreadCount: () =>
    api.get("/notifications/unread-count", { headers: getOrgHeader() }),

  markRead: (id) =>
    api.patch(`/notifications/${id}/read`, {}, { headers: getOrgHeader() }),

  markAllRead: () =>
    api.post("/notifications/mark-all-read", {}, { headers: getOrgHeader() }),

  deleteNotification: (id) =>
    api.delete(`/notifications/${id}`, { headers: getOrgHeader() }),
};

export default notificationService;
