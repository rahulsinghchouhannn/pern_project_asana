const { eq, and, inArray, desc, asc, max, sql, like, count, gte, lte } = require("drizzle-orm");
const { db } = require("../db");
const {
  tasks,
  taskAssignees,
  taskTags,
  taskHistory,
  taskAttachments,
  users,
  projectStatuses,
} = require("../db/schema");
const { getBulkTaskFieldValues, getTaskFieldValues } = require("./customFieldService");
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

const insertHistory = (taskId, userId, action, fromValue, toValue) =>
  db.insert(taskHistory).values({
    taskId,
    userId,
    action,
    fromValue: fromValue != null ? String(fromValue) : null,
    toValue: toValue != null ? String(toValue) : null,
  });

// Fetch assignees and tags for a list of task ids
const fetchAssigneesForTasks = async (taskIds) => {
  if (taskIds.length === 0) return {};
  const rows = await db
    .select({
      taskId: taskAssignees.taskId,
      userId: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      assignedAt: taskAssignees.assignedAt,
    })
    .from(taskAssignees)
    .innerJoin(users, eq(taskAssignees.userId, users.id))
    .where(inArray(taskAssignees.taskId, taskIds))
    .limit(500);

  const map = {};
  rows.forEach((r) => {
    if (!map[r.taskId]) map[r.taskId] = [];
    map[r.taskId].push({ userId: r.userId, name: r.name, email: r.email, avatarUrl: r.avatarUrl, assignedAt: r.assignedAt });
  });
  return map;
};

const fetchTagsForTasks = async (taskIds) => {
  if (taskIds.length === 0) return {};
  const rows = await db
    .select()
    .from(taskTags)
    .where(inArray(taskTags.taskId, taskIds))
    .limit(1000);

  const map = {};
  rows.forEach((r) => {
    if (!map[r.taskId]) map[r.taskId] = [];
    map[r.taskId].push({ id: r.id, name: r.name, color: r.color });
  });
  return map;
};

const fetchSubtaskCountsForTasks = async (taskIds) => {
  if (taskIds.length === 0) return {};
  const rows = await db
    .select({
      parentTaskId: tasks.parentTaskId,
      subtaskCount: count(),
    })
    .from(tasks)
    .where(inArray(tasks.parentTaskId, taskIds))
    .groupBy(tasks.parentTaskId)
    .limit(500);

  const map = {};
  rows.forEach((r) => {
    map[r.parentTaskId] = Number(r.subtaskCount);
  });
  return map;
};

// ─── Create ───────────────────────────────────────────────────────────────────

const createTask = async (projectId, orgId, creatorId, data) => {
  // Compute position = max(position) + 1 for this status
  const [maxRow] = await db
    .select({ maxPos: max(tasks.position) })
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), eq(tasks.statusId, data.statusId)))
    .limit(1);

  const position = maxRow?.maxPos != null ? Number(maxRow.maxPos) + 1 : 0;

  const [task] = await db
    .insert(tasks)
    .values({
      projectId,
      organizationId: orgId,
      statusId: data.statusId,
      title: data.title,
      description: data.description ?? null,
      priority: data.priority ?? "none",
      startDate: data.startDate ? new Date(data.startDate) : null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      parentTaskId: data.parentTaskId ?? null,
      position,
      createdBy: creatorId,
    })
    .returning();

  const inserts = [insertHistory(task.id, creatorId, "created", null, task.title)];

  if (data.assigneeIds?.length) {
    inserts.push(
      db.insert(taskAssignees).values(
        data.assigneeIds.map((userId) => ({
          taskId: task.id,
          userId,
          assignedBy: creatorId,
        }))
      )
    );
  }

  if (data.tags?.length) {
    inserts.push(
      db.insert(taskTags).values(
        data.tags.map((tag) => ({
          taskId: task.id,
          name: tag.name,
          color: tag.color ?? "#E0E0E0",
        }))
      )
    );
  }

  await Promise.all(inserts);

  activityService.log({
    orgId,
    projectId,
    taskId: task.id,
    actorId: creatorId,
    action: "task_created",
    metadata: { taskTitle: task.title },
  }).catch((err) => logger.error({ message: "Failed to log task_created", err }));

  logger.info({ message: "Task created", taskId: task.id, projectId, creatorId });

  const fullTask = await getTaskById(task.id);
  emitToProject(projectId, "task:created", fullTask);
  return fullTask;
};

// ─── List by project ──────────────────────────────────────────────────────────

const getProjectTasks = async (projectId, filters = {}) => {
  const { statusId, assigneeId, priority, isCompleted, search, page = 1, limit = 50 } = filters;

  const conditions = [eq(tasks.projectId, projectId)];

  if (statusId) conditions.push(eq(tasks.statusId, statusId));
  if (priority) conditions.push(eq(tasks.priority, priority));
  if (isCompleted !== undefined) conditions.push(eq(tasks.isCompleted, isCompleted));
  if (search) conditions.push(like(tasks.title, `%${search}%`));

  // If filtering by assignee, get matching taskIds first
  let assigneeFilterIds = null;
  if (assigneeId) {
    const rows = await db
      .select({ taskId: taskAssignees.taskId })
      .from(taskAssignees)
      .where(eq(taskAssignees.userId, assigneeId))
      .limit(1000);
    assigneeFilterIds = rows.map((r) => r.taskId);
    if (assigneeFilterIds.length === 0) return [];
    conditions.push(inArray(tasks.id, assigneeFilterIds));
  }

  // Only fetch top-level tasks in the list view (no subtasks)
  conditions.push(sql`${tasks.parentTaskId} IS NULL`);

  const offset = (page - 1) * limit;

  const taskRows = await db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(asc(tasks.position), asc(tasks.createdAt))
    .limit(limit)
    .offset(offset);

  if (taskRows.length === 0) return [];

  const taskIds = taskRows.map((t) => t.id);
  const [assigneesMap, tagsMap, subtaskCountMap, customFieldValuesMap] = await Promise.all([
    fetchAssigneesForTasks(taskIds),
    fetchTagsForTasks(taskIds),
    fetchSubtaskCountsForTasks(taskIds),
    getBulkTaskFieldValues(taskIds),
  ]);

  return taskRows.map((t) => ({
    ...t,
    assignees: assigneesMap[t.id] ?? [],
    tags: tagsMap[t.id] ?? [],
    subtaskCount: subtaskCountMap[t.id] ?? 0,
    customFieldValues: customFieldValuesMap[t.id] ?? [],
  }));
};

// ─── Get by id ────────────────────────────────────────────────────────────────

const getTaskById = async (taskId) => {
  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  throwIf(!task, "Task not found", 404);

  const [assignees, tags, subtaskRows, history, attachments, customFieldValuesRows] = await Promise.all([
    db
      .select({
        userId: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
        assignedAt: taskAssignees.assignedAt,
      })
      .from(taskAssignees)
      .innerJoin(users, eq(taskAssignees.userId, users.id))
      .where(eq(taskAssignees.taskId, taskId))
      .limit(50),

    db
      .select()
      .from(taskTags)
      .where(eq(taskTags.taskId, taskId))
      .limit(50),

    db
      .select()
      .from(tasks)
      .where(eq(tasks.parentTaskId, taskId))
      .orderBy(asc(tasks.position))
      .limit(100),

    db
      .select({
        id: taskHistory.id,
        action: taskHistory.action,
        fromValue: taskHistory.fromValue,
        toValue: taskHistory.toValue,
        createdAt: taskHistory.createdAt,
        userId: users.id,
        userName: users.name,
        userAvatar: users.avatarUrl,
      })
      .from(taskHistory)
      .innerJoin(users, eq(taskHistory.userId, users.id))
      .where(eq(taskHistory.taskId, taskId))
      .orderBy(desc(taskHistory.createdAt))
      .limit(20),

    db
      .select()
      .from(taskAttachments)
      .where(eq(taskAttachments.taskId, taskId))
      .limit(50),

    getTaskFieldValues(taskId),
  ]);

  return {
    ...task,
    assignees,
    tags,
    subtasks: subtaskRows,
    history,
    attachments,
    customFieldValues: customFieldValuesRows,
  };
};

// ─── Update ───────────────────────────────────────────────────────────────────

const updateTask = async (taskId, userId, data) => {
  const [existing] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  throwIf(!existing, "Task not found", 404);

  const updates = { updatedAt: new Date() };
  const historyInserts = [];

  const trackField = (field, dbField, action) => {
    if (data[field] !== undefined && String(data[field]) !== String(existing[dbField ?? field])) {
      updates[field] = data[field];
      historyInserts.push(
        insertHistory(taskId, userId, action, existing[dbField ?? field], data[field])
      );
    }
  };

  if (data.title !== undefined && data.title !== existing.title) {
    updates.title = data.title;
    historyInserts.push(insertHistory(taskId, userId, "title_changed", existing.title, data.title));
  }
  if (data.description !== undefined && data.description !== existing.description) {
    updates.description = data.description;
    historyInserts.push(insertHistory(taskId, userId, "description_changed", existing.description, data.description));
  }
  if (data.statusId !== undefined && data.statusId !== existing.statusId) {
    updates.statusId = data.statusId;
    historyInserts.push(insertHistory(taskId, userId, "status_changed", existing.statusId, data.statusId));

    // Log activity + notify assignees + emit socket (fire-and-forget)
    db
      .select({ id: projectStatuses.id, name: projectStatuses.name })
      .from(projectStatuses)
      .where(inArray(projectStatuses.id, [existing.statusId, data.statusId]))
      .then(async (statusRows) => {
        const nameMap = {};
        statusRows.forEach((r) => { nameMap[r.id] = r.name; });
        await activityService.log({
          orgId: existing.organizationId,
          projectId: existing.projectId,
          taskId,
          actorId: userId,
          action: "status_changed",
          metadata: { from: nameMap[existing.statusId] ?? existing.statusId, to: nameMap[data.statusId] ?? data.statusId },
        });

        // Notify all assignees except the actor
        const assigneeRows = await db
          .select({ userId: taskAssignees.userId })
          .from(taskAssignees)
          .where(eq(taskAssignees.taskId, taskId));

        const recipients = assigneeRows.map((r) => r.userId).filter((id) => id !== userId);
        if (recipients.length > 0) {
          await notificationService.createBulk(recipients, {
            actorId: userId,
            orgId: existing.organizationId,
            type: "status_changed",
            title: `Status changed on "${existing.title}"`,
            entityType: "task",
            entityId: taskId,
          });
        }
      })
      .catch((err) => logger.error({ message: "Failed to handle status_changed side effects", err }));
  }
  if (data.priority !== undefined && data.priority !== existing.priority) {
    updates.priority = data.priority;
    historyInserts.push(insertHistory(taskId, userId, "priority_changed", existing.priority, data.priority));
  }
  if (data.dueDate !== undefined) {
    const newDate = data.dueDate ? new Date(data.dueDate).toISOString() : null;
    const oldDate = existing.dueDate ? existing.dueDate.toISOString() : null;
    if (newDate !== oldDate) {
      updates.dueDate = data.dueDate ? new Date(data.dueDate) : null;
      historyInserts.push(insertHistory(taskId, userId, "due_date_changed", oldDate, newDate));
    }
  }
  if (data.startDate !== undefined) {
    const newDate = data.startDate ? new Date(data.startDate).toISOString() : null;
    const oldDate = existing.startDate ? existing.startDate.toISOString() : null;
    if (newDate !== oldDate) {
      updates.startDate = data.startDate ? new Date(data.startDate) : null;
      historyInserts.push(insertHistory(taskId, userId, "start_date_changed", oldDate, newDate));
    }
  }
  if (data.position !== undefined && data.position !== existing.position) {
    updates.position = data.position;
  }

  if (Object.keys(updates).length > 1) {
    await db.update(tasks).set(updates).where(eq(tasks.id, taskId));
  }

  if (historyInserts.length > 0) {
    await Promise.all(historyInserts);
  }

  const fullTask = await getTaskById(taskId);
  emitToProject(existing.projectId, "task:updated", fullTask);
  return fullTask;
};

// ─── Delete ───────────────────────────────────────────────────────────────────

const deleteTask = async (taskId) => {
  const [task] = await db
    .select({ id: tasks.id, projectId: tasks.projectId })
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);
  throwIf(!task, "Task not found", 404);
  await db.delete(tasks).where(eq(tasks.id, taskId));
  logger.info({ message: "Task deleted", taskId });
  emitToProject(task.projectId, "task:deleted", { taskId });
};

// ─── Complete / Reopen ────────────────────────────────────────────────────────

const completeTask = async (taskId, userId) => {
  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  throwIf(!task, "Task not found", 404);

  await db
    .update(tasks)
    .set({ isCompleted: true, completedAt: new Date(), updatedAt: new Date() })
    .where(eq(tasks.id, taskId));

  await insertHistory(taskId, userId, "completed", "false", "true");

  activityService.log({
    orgId: task.organizationId,
    projectId: task.projectId,
    taskId,
    actorId: userId,
    action: "task_completed",
  }).catch((err) => logger.error({ message: "Failed to log task_completed", err }));

  const fullTask = await getTaskById(taskId);
  emitToProject(task.projectId, "task:updated", fullTask);
  return fullTask;
};

const reopenTask = async (taskId, userId) => {
  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  throwIf(!task, "Task not found", 404);

  await db
    .update(tasks)
    .set({ isCompleted: false, completedAt: null, updatedAt: new Date() })
    .where(eq(tasks.id, taskId));

  await insertHistory(taskId, userId, "reopened", "true", "false");
  const fullTask = await getTaskById(taskId);
  emitToProject(task.projectId, "task:updated", fullTask);
  return fullTask;
};

// ─── Assignees ────────────────────────────────────────────────────────────────

const addAssignee = async (taskId, userId, assignedBy) => {
  const [task] = await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.id, taskId)).limit(1);
  throwIf(!task, "Task not found", 404);

  await db.insert(taskAssignees).values({ taskId, userId, assignedBy });
  await insertHistory(taskId, assignedBy, "assigned", null, userId);

  // Log activity + notify assignee (fire-and-forget)
  db
    .select({ id: tasks.id, title: tasks.title, organizationId: tasks.organizationId, projectId: tasks.projectId })
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1)
    .then(async ([t]) => {
      if (!t) return;
      const [assignee] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      await activityService.log({
        orgId: t.organizationId,
        projectId: t.projectId,
        taskId,
        actorId: assignedBy,
        action: "task_assigned",
        metadata: { assigneeName: assignee?.name ?? userId },
      });

      // Notify the assigned user (skip if they assigned themselves)
      if (userId !== assignedBy) {
        await notificationService.create({
          recipientId: userId,
          actorId: assignedBy,
          orgId: t.organizationId,
          type: "task_assigned",
          title: `You were assigned to "${t.title}"`,
          entityType: "task",
          entityId: taskId,
        });
      }
    })
    .catch((err) => logger.error({ message: "Failed to handle task_assigned side effects", err }));

  const fullTask = await getTaskById(taskId);
  emitToProject(fullTask.projectId, "task:updated", fullTask);
  return fullTask;
};

const removeAssignee = async (taskId, userId, removedBy) => {
  await db
    .delete(taskAssignees)
    .where(and(eq(taskAssignees.taskId, taskId), eq(taskAssignees.userId, userId)));

  await insertHistory(taskId, removedBy ?? userId, "unassigned", userId, null);

  const fullTask = await getTaskById(taskId);
  emitToProject(fullTask.projectId, "task:updated", fullTask);
  return fullTask;
};

// ─── Position / Kanban ────────────────────────────────────────────────────────

const updateTaskPosition = async (taskId, statusId, position) => {
  await db
    .update(tasks)
    .set({ statusId, position, updatedAt: new Date() })
    .where(eq(tasks.id, taskId));
};

const bulkUpdatePositions = async (updates) => {
  await db.transaction(async (tx) => {
    await Promise.all(
      updates.map(({ taskId, statusId, position }) =>
        tx
          .update(tasks)
          .set({ statusId, position, updatedAt: new Date() })
          .where(eq(tasks.id, taskId))
      )
    );
  });

  // Derive projectId from the first task so we can broadcast the position change
  if (updates.length > 0) {
    const [row] = await db
      .select({ projectId: tasks.projectId })
      .from(tasks)
      .where(eq(tasks.id, updates[0].taskId))
      .limit(1);
    if (row?.projectId) {
      emitToProject(row.projectId, "task:positions_updated", { updates });
    }
  }
};

// ─── Subtasks / History ───────────────────────────────────────────────────────

const getSubtasks = async (parentTaskId) => {
  const rows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.parentTaskId, parentTaskId))
    .orderBy(asc(tasks.position))
    .limit(100);

  if (rows.length === 0) return [];

  const taskIds = rows.map((t) => t.id);
  const [assigneesMap, tagsMap] = await Promise.all([
    fetchAssigneesForTasks(taskIds),
    fetchTagsForTasks(taskIds),
  ]);

  return rows.map((t) => ({
    ...t,
    assignees: assigneesMap[t.id] ?? [],
    tags: tagsMap[t.id] ?? [],
  }));
};

const getTaskHistory = async (taskId, limit = 20) => {
  return db
    .select({
      id: taskHistory.id,
      action: taskHistory.action,
      fromValue: taskHistory.fromValue,
      toValue: taskHistory.toValue,
      createdAt: taskHistory.createdAt,
      userId: users.id,
      userName: users.name,
      userAvatar: users.avatarUrl,
    })
    .from(taskHistory)
    .innerJoin(users, eq(taskHistory.userId, users.id))
    .where(eq(taskHistory.taskId, taskId))
    .orderBy(desc(taskHistory.createdAt))
    .limit(limit);
};

// ─── My Tasks (cross-project, for current user) ───────────────────────────────

const getMyTasks = async (userId, orgId) => {
  // Get taskIds assigned to the user
  const assigneeRows = await db
    .select({ taskId: taskAssignees.taskId })
    .from(taskAssignees)
    .where(eq(taskAssignees.userId, userId))
    .limit(500);

  if (assigneeRows.length === 0) return [];

  const assignedTaskIds = assigneeRows.map((r) => r.taskId);

  const taskRows = await db
    .select()
    .from(tasks)
    .where(
      and(
        inArray(tasks.id, assignedTaskIds),
        eq(tasks.organizationId, orgId),
        sql`${tasks.parentTaskId} IS NULL`
      )
    )
    .orderBy(asc(tasks.dueDate), asc(tasks.createdAt))
    .limit(200);

  if (taskRows.length === 0) return [];

  const taskIds = taskRows.map((t) => t.id);
  const [assigneesMap, tagsMap] = await Promise.all([
    fetchAssigneesForTasks(taskIds),
    fetchTagsForTasks(taskIds),
  ]);

  return taskRows.map((t) => ({
    ...t,
    assignees: assigneesMap[t.id] ?? [],
    tags: tagsMap[t.id] ?? [],
  }));
};

// ─── Board (grouped by status) ────────────────────────────────────────────────

const getBoardTasks = async (projectId) => {
  const statuses = await db
    .select()
    .from(projectStatuses)
    .where(eq(projectStatuses.projectId, projectId))
    .orderBy(asc(projectStatuses.position));

  const taskRows = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), sql`${tasks.parentTaskId} IS NULL`))
    .orderBy(asc(tasks.position), asc(tasks.createdAt));

  if (taskRows.length === 0) {
    return statuses.map((s) => ({
      statusId: s.id,
      statusName: s.name,
      statusColor: s.color,
      position: s.position,
      tasks: [],
    }));
  }

  const taskIds = taskRows.map((t) => t.id);
  const [assigneesMap, tagsMap, subtaskCountMap, customFieldValuesMap] = await Promise.all([
    fetchAssigneesForTasks(taskIds),
    fetchTagsForTasks(taskIds),
    fetchSubtaskCountsForTasks(taskIds),
    getBulkTaskFieldValues(taskIds),
  ]);

  const enriched = taskRows.map((t) => ({
    ...t,
    assignees: assigneesMap[t.id] ?? [],
    tags: tagsMap[t.id] ?? [],
    subtaskCount: subtaskCountMap[t.id] ?? 0,
    customFieldValues: customFieldValuesMap[t.id] ?? [],
  }));

  const byStatus = {};
  enriched.forEach((t) => {
    if (!byStatus[t.statusId]) byStatus[t.statusId] = [];
    byStatus[t.statusId].push(t);
  });

  return statuses.map((s) => ({
    statusId: s.id,
    statusName: s.name,
    statusColor: s.color,
    position: s.position,
    tasks: byStatus[s.id] ?? [],
  }));
};

// ─── Calendar (tasks by month) ────────────────────────────────────────────────

const getCalendarTasks = async (projectId, year, month) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  const taskRows = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.projectId, projectId),
        sql`${tasks.parentTaskId} IS NULL`,
        sql`${tasks.dueDate} IS NOT NULL`,
        gte(tasks.dueDate, start),
        lte(tasks.dueDate, end)
      )
    )
    .orderBy(asc(tasks.dueDate), asc(tasks.position));

  if (taskRows.length === 0) return [];

  const taskIds = taskRows.map((t) => t.id);
  const assigneesMap = await fetchAssigneesForTasks(taskIds);

  return taskRows.map((t) => ({
    id: t.id,
    title: t.title,
    dueDate: t.dueDate,
    startDate: t.startDate,
    priority: t.priority,
    isCompleted: t.isCompleted,
    statusId: t.statusId,
    assignees: assigneesMap[t.id] ?? [],
  }));
};

// ─── Timeline (tasks with both dates) ────────────────────────────────────────

const getTimelineTasks = async (projectId) => {
  const taskRows = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.projectId, projectId),
        sql`${tasks.parentTaskId} IS NULL`,
        sql`${tasks.startDate} IS NOT NULL`,
        sql`${tasks.dueDate} IS NOT NULL`
      )
    )
    .orderBy(asc(tasks.startDate), asc(tasks.position));

  if (taskRows.length === 0) return [];

  const taskIds = taskRows.map((t) => t.id);
  const assigneesMap = await fetchAssigneesForTasks(taskIds);

  return taskRows.map((t) => ({
    id: t.id,
    title: t.title,
    startDate: t.startDate,
    dueDate: t.dueDate,
    assignees: assigneesMap[t.id] ?? [],
    statusId: t.statusId,
    priority: t.priority,
  }));
};

// ─── Update dates (for timeline drag/resize) ──────────────────────────────────

const updateTaskDates = async (taskId, userId, data) => {
  const [existing] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  throwIf(!existing, "Task not found", 404);

  const updates = { updatedAt: new Date() };
  const historyInserts = [];

  if (data.startDate !== undefined) {
    const newDate = data.startDate ? new Date(data.startDate).toISOString() : null;
    const oldDate = existing.startDate ? existing.startDate.toISOString() : null;
    if (newDate !== oldDate) {
      updates.startDate = data.startDate ? new Date(data.startDate) : null;
      historyInserts.push(insertHistory(taskId, userId, "start_date_changed", oldDate, newDate));
    }
  }

  if (data.dueDate !== undefined) {
    const newDate = data.dueDate ? new Date(data.dueDate).toISOString() : null;
    const oldDate = existing.dueDate ? existing.dueDate.toISOString() : null;
    if (newDate !== oldDate) {
      updates.dueDate = data.dueDate ? new Date(data.dueDate) : null;
      historyInserts.push(insertHistory(taskId, userId, "due_date_changed", oldDate, newDate));
    }
  }

  if (Object.keys(updates).length > 1) {
    await db.update(tasks).set(updates).where(eq(tasks.id, taskId));
  }

  if (historyInserts.length > 0) await Promise.all(historyInserts);

  const result = {
    id: taskId,
    startDate: updates.startDate !== undefined ? updates.startDate : existing.startDate,
    dueDate: updates.dueDate !== undefined ? updates.dueDate : existing.dueDate,
  };

  emitToProject(existing.projectId, "task:updated", { ...existing, ...result });
  return result;
};

module.exports = {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  deleteTask,
  completeTask,
  reopenTask,
  addAssignee,
  removeAssignee,
  updateTaskPosition,
  bulkUpdatePositions,
  getSubtasks,
  getTaskHistory,
  getMyTasks,
  getBoardTasks,
  getCalendarTasks,
  getTimelineTasks,
  updateTaskDates,
};
