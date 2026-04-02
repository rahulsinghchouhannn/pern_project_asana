const { eq, and, desc, count } = require("drizzle-orm");
const { db } = require("../db");
const { notifications, users } = require("../db/schema");
const { emitToUser } = require("../config/socket");
const logger = require("../config/logger");

// ─── Create single notification ───────────────────────────────────────────────

const create = async ({ recipientId, actorId, orgId, type, title, body, entityType, entityId }) => {
  const [notification] = await db
    .insert(notifications)
    .values({
      recipientId,
      actorId: actorId ?? null,
      organizationId: orgId,
      type,
      title,
      body: body ?? null,
      entityType: entityType ?? null,
      entityId: entityId ?? null,
    })
    .returning();

  emitToUser(recipientId, "notification:new", notification);

  return notification;
};

// ─── Create notifications for multiple recipients ─────────────────────────────

const createBulk = async (recipientIds, { actorId, orgId, type, title, body, entityType, entityId }) => {
  if (!recipientIds || recipientIds.length === 0) return [];

  const rows = await db
    .insert(notifications)
    .values(
      recipientIds.map((recipientId) => ({
        recipientId,
        actorId: actorId ?? null,
        organizationId: orgId,
        type,
        title,
        body: body ?? null,
        entityType: entityType ?? null,
        entityId: entityId ?? null,
      }))
    )
    .returning();

  rows.forEach((n) => emitToUser(n.recipientId, "notification:new", n));

  return rows;
};

// ─── Get user notifications with actor details ────────────────────────────────

const getUserNotifications = async (userId, { unreadOnly = false, limit = 50, offset = 0 } = {}) => {
  const actor = users;
  const conditions = [eq(notifications.recipientId, userId)];
  if (unreadOnly) conditions.push(eq(notifications.isRead, false));

  const rows = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      title: notifications.title,
      body: notifications.body,
      entityType: notifications.entityType,
      entityId: notifications.entityId,
      isRead: notifications.isRead,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
      actorId: actor.id,
      actorName: actor.name,
      actorAvatar: actor.avatarUrl,
    })
    .from(notifications)
    .leftJoin(actor, eq(notifications.actorId, actor.id))
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);

  return rows;
};

// ─── Mark single notification as read ────────────────────────────────────────

const markRead = async (notificationId, userId) => {
  const [notification] = await db
    .select({ id: notifications.id, recipientId: notifications.recipientId })
    .from(notifications)
    .where(and(eq(notifications.id, notificationId), eq(notifications.recipientId, userId)))
    .limit(1);

  if (!notification) {
    const err = new Error("Notification not found");
    err.statusCode = 404;
    throw err;
  }

  const [updated] = await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(eq(notifications.id, notificationId))
    .returning();

  return updated;
};

// ─── Mark all notifications as read for a user + org ─────────────────────────

const markAllRead = async (userId, orgId) => {
  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.recipientId, userId),
        eq(notifications.organizationId, orgId),
        eq(notifications.isRead, false)
      )
    );
};

// ─── Get unread count ─────────────────────────────────────────────────────────

const getUnreadCount = async (userId, orgId) => {
  const [row] = await db
    .select({ total: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.recipientId, userId),
        eq(notifications.organizationId, orgId),
        eq(notifications.isRead, false)
      )
    );

  return Number(row?.total ?? 0);
};

// ─── Delete notification ──────────────────────────────────────────────────────

const deleteNotification = async (notificationId, userId) => {
  const [notification] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.id, notificationId), eq(notifications.recipientId, userId)))
    .limit(1);

  if (!notification) {
    const err = new Error("Notification not found");
    err.statusCode = 404;
    throw err;
  }

  await db.delete(notifications).where(eq(notifications.id, notificationId));
};

module.exports = { create, createBulk, getUserNotifications, markRead, markAllRead, getUnreadCount, deleteNotification };
