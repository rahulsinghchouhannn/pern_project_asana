const { eq, and, asc } = require("drizzle-orm");
const { db } = require("../db");
const { comments, commentMentions, users, tasks, taskAssignees } = require("../db/schema");
const activityService = require("./activityService");
const notificationService = require("./notificationService");
const { emitToProject } = require("../config/socket");
const logger = require("../config/logger");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const throwIf = (condition, message, statusCode = 400) => {
  if (condition) {
    const err = new Error(message);
    err.statusCode = statusCode;
    throw err;
  }
};

// Parse @[Name](userId) mentions from content
const parseMentions = (content) => {
  const regex = /@\[([^\]]+)\]\(([a-f0-9-]+)\)/g;
  const mentions = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    mentions.push({ name: match[1], userId: match[2] });
  }
  return mentions;
};

const getCommentWithAuthor = async (commentId) => {
  const [row] = await db
    .select({
      id: comments.id,
      taskId: comments.taskId,
      content: comments.content,
      isEdited: comments.isEdited,
      editedAt: comments.editedAt,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      authorId: users.id,
      authorName: users.name,
      authorEmail: users.email,
      authorAvatar: users.avatarUrl,
    })
    .from(comments)
    .innerJoin(users, eq(comments.authorId, users.id))
    .where(eq(comments.id, commentId))
    .limit(1);

  return row ?? null;
};

// ─── Create ───────────────────────────────────────────────────────────────────

const createComment = async (taskId, authorId, orgId, content) => {
  const [comment] = await db
    .insert(comments)
    .values({ taskId, authorId, content })
    .returning();

  const mentions = parseMentions(content);

  if (mentions.length > 0) {
    await db.insert(commentMentions).values(
      mentions.map(({ userId }) => ({
        commentId: comment.id,
        mentionedUserId: userId,
      }))
    );
  }

  activityService
    .log({ orgId, taskId, actorId: authorId, action: "comment_added" })
    .catch((err) => logger.error({ message: "Failed to log comment_added activity", err }));

  // Notifications + socket emission (fire-and-forget)
  const commentData = await getCommentWithAuthor(comment.id);
  ;(async () => {
    try {
      const [taskRow] = await db
        .select({ title: tasks.title, projectId: tasks.projectId })
        .from(tasks)
        .where(eq(tasks.id, taskId))
        .limit(1);
      if (!taskRow) return;

      const [author] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, authorId))
        .limit(1);
      const authorName = author?.name ?? "Someone";

      // Notify assignees (except comment author)
      const assigneeRows = await db
        .select({ userId: taskAssignees.userId })
        .from(taskAssignees)
        .where(eq(taskAssignees.taskId, taskId));

      const assigneeRecipients = assigneeRows.map((r) => r.userId).filter((id) => id !== authorId);
      if (assigneeRecipients.length > 0) {
        await notificationService.createBulk(assigneeRecipients, {
          actorId: authorId,
          orgId,
          type: "comment_added",
          title: `${authorName} commented on "${taskRow.title}"`,
          entityType: "task",
          entityId: taskId,
        });
      }

      // Notify mentioned users (except author, and avoid duplicate if already notified as assignee)
      if (mentions.length > 0) {
        const notifiedSet = new Set(assigneeRecipients);
        const mentionRecipients = mentions
          .map((m) => m.userId)
          .filter((id) => id !== authorId && !notifiedSet.has(id));
        if (mentionRecipients.length > 0) {
          await notificationService.createBulk(mentionRecipients, {
            actorId: authorId,
            orgId,
            type: "mentioned",
            title: `${authorName} mentioned you in "${taskRow.title}"`,
            entityType: "task",
            entityId: taskId,
          });
        }
      }

      // Emit to project room
      emitToProject(taskRow.projectId, "comment:added", commentData);
    } catch (err) {
      logger.error({ message: "Failed to send comment notifications", err });
    }
  })();

  logger.info({ message: "Comment created", commentId: comment.id, taskId, authorId });

  return commentData;
};

// ─── Get task comments ────────────────────────────────────────────────────────

const getTaskComments = async (taskId) => {
  const rows = await db
    .select({
      id: comments.id,
      taskId: comments.taskId,
      content: comments.content,
      isEdited: comments.isEdited,
      editedAt: comments.editedAt,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      authorId: users.id,
      authorName: users.name,
      authorEmail: users.email,
      authorAvatar: users.avatarUrl,
    })
    .from(comments)
    .innerJoin(users, eq(comments.authorId, users.id))
    .where(eq(comments.taskId, taskId))
    .orderBy(asc(comments.createdAt));

  // Fetch mentions for all comments
  const commentIds = rows.map((r) => r.id);
  let mentionsMap = {};

  if (commentIds.length > 0) {
    const { inArray } = require("drizzle-orm");
    const mentionRows = await db
      .select({
        commentId: commentMentions.commentId,
        mentionedUserId: users.id,
        mentionedUserName: users.name,
      })
      .from(commentMentions)
      .innerJoin(users, eq(commentMentions.mentionedUserId, users.id))
      .where(inArray(commentMentions.commentId, commentIds));

    mentionRows.forEach((m) => {
      if (!mentionsMap[m.commentId]) mentionsMap[m.commentId] = [];
      mentionsMap[m.commentId].push({ userId: m.mentionedUserId, name: m.mentionedUserName });
    });
  }

  return rows.map((r) => ({ ...r, mentions: mentionsMap[r.id] ?? [] }));
};

// ─── Update ───────────────────────────────────────────────────────────────────

const updateComment = async (commentId, authorId, content) => {
  const [existing] = await db
    .select({ id: comments.id, authorId: comments.authorId })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);

  throwIf(!existing, "Comment not found", 404);
  throwIf(existing.authorId !== authorId, "Only the author can edit this comment", 403);

  await db
    .update(comments)
    .set({ content, isEdited: true, editedAt: new Date(), updatedAt: new Date() })
    .where(eq(comments.id, commentId));

  return getCommentWithAuthor(commentId);
};

// ─── Delete ───────────────────────────────────────────────────────────────────

const deleteComment = async (commentId, requesterId, requesterRole) => {
  const [existing] = await db
    .select({ id: comments.id, authorId: comments.authorId })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);

  throwIf(!existing, "Comment not found", 404);

  const isAuthor = existing.authorId === requesterId;
  const isPrivileged = requesterRole === "admin" || requesterRole === "owner";

  throwIf(!isAuthor && !isPrivileged, "Not authorized to delete this comment", 403);

  await db.delete(comments).where(eq(comments.id, commentId));

  logger.info({ message: "Comment deleted", commentId, requesterId });
};

module.exports = { createComment, getTaskComments, updateComment, deleteComment };
