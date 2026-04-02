const { eq, and, desc } = require("drizzle-orm");
const { db } = require("../db");
const { activityLogs, users, userActivityRead, comments } = require("../db/schema");
const logger = require("../config/logger");

// ─── Log an activity event (fire-and-forget safe) ─────────────────────────────

const log = ({ orgId, projectId = null, taskId = null, actorId, action, metadata = null }) =>
  db
    .insert(activityLogs)
    .values({
      organizationId: orgId,
      projectId,
      taskId,
      actorId,
      action,
      metadata,
    })
    .catch((err) => logger.error({ message: "Failed to log activity", err, action }));

// ─── Get task activity (merged: activityLogs + comments) ─────────────────────

const getTaskActivity = async (taskId, limit = 50) => {
  const [activityRows, commentRows] = await Promise.all([
    db
      .select({
        id: activityLogs.id,
        action: activityLogs.action,
        metadata: activityLogs.metadata,
        createdAt: activityLogs.createdAt,
        actorId: users.id,
        actorName: users.name,
        actorAvatar: users.avatarUrl,
      })
      .from(activityLogs)
      .innerJoin(users, eq(activityLogs.actorId, users.id))
      .where(eq(activityLogs.taskId, taskId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit),

    db
      .select({
        id: comments.id,
        content: comments.content,
        isEdited: comments.isEdited,
        editedAt: comments.editedAt,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        authorId: users.id,
        authorName: users.name,
        authorAvatar: users.avatarUrl,
        authorEmail: users.email,
      })
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.taskId, taskId))
      .orderBy(desc(comments.createdAt))
      .limit(limit),
  ]);

  const unified = [
    ...activityRows.map((a) => ({ type: "activity", ...a })),
    ...commentRows.map((c) => ({ type: "comment", ...c })),
  ];

  unified.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return unified.slice(0, limit);
};

// ─── Get project-level activity ───────────────────────────────────────────────

const getProjectActivity = async (projectId, limit = 50) => {
  return db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      metadata: activityLogs.metadata,
      taskId: activityLogs.taskId,
      createdAt: activityLogs.createdAt,
      actorId: users.id,
      actorName: users.name,
      actorAvatar: users.avatarUrl,
    })
    .from(activityLogs)
    .innerJoin(users, eq(activityLogs.actorId, users.id))
    .where(eq(activityLogs.projectId, projectId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);
};

// ─── Get user activity in an org ──────────────────────────────────────────────

const getUserActivity = async (userId, orgId, limit = 50) => {
  const rows = await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      metadata: activityLogs.metadata,
      projectId: activityLogs.projectId,
      taskId: activityLogs.taskId,
      createdAt: activityLogs.createdAt,
      actorId: users.id,
      actorName: users.name,
      actorAvatar: users.avatarUrl,
    })
    .from(activityLogs)
    .innerJoin(users, eq(activityLogs.actorId, users.id))
    .where(eq(activityLogs.organizationId, orgId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);

  // Fetch read status for this user
  const activityIds = rows.map((r) => r.id);
  let readSet = new Set();

  if (activityIds.length > 0) {
    const { inArray } = require("drizzle-orm");
    const readRows = await db
      .select({ activityLogId: userActivityRead.activityLogId })
      .from(userActivityRead)
      .where(
        and(
          eq(userActivityRead.userId, userId),
          inArray(userActivityRead.activityLogId, activityIds)
        )
      );
    readSet = new Set(readRows.map((r) => r.activityLogId));
  }

  return rows.map((r) => ({ ...r, isRead: readSet.has(r.id) }));
};

// ─── Mark single activity read ────────────────────────────────────────────────

const markRead = async (activityLogId, userId) => {
  await db
    .insert(userActivityRead)
    .values({ userId, activityLogId })
    .onConflictDoNothing();
};

// ─── Archive all (mark all org activity read for user) ────────────────────────

const archiveAll = async (userId, orgId) => {
  const rows = await db
    .select({ id: activityLogs.id })
    .from(activityLogs)
    .where(eq(activityLogs.organizationId, orgId))
    .limit(500);

  if (rows.length === 0) return;

  const { sql } = require("drizzle-orm");
  await db
    .insert(userActivityRead)
    .values(rows.map((r) => ({ userId, activityLogId: r.id })))
    .onConflictDoNothing();
};

module.exports = { log, getTaskActivity, getProjectActivity, getUserActivity, markRead, archiveAll };
