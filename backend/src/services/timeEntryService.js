const { eq, and, desc, sql } = require("drizzle-orm");
const { db } = require("../db");
const {
  timeEntries,
  customFieldValues,
  customFields,
  tasks,
  users,
} = require("../db/schema");
const logger = require("../config/logger");

const throwIf = (condition, message, statusCode = 400) => {
  if (condition) {
    const err = new Error(message);
    err.statusCode = statusCode;
    throw err;
  }
};

// ─── Internal: recompute and store total in customFieldValues ─────────────────

const syncActualTotal = async (taskId, customFieldId) => {
  const result = await db
    .select({ total: sql`COALESCE(SUM(${timeEntries.durationMinutes}), 0)` })
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.taskId, taskId),
        eq(timeEntries.customFieldId, customFieldId)
      )
    );

  const total = Number(result[0]?.total ?? 0);

  const existing = await db
    .select({ id: customFieldValues.id })
    .from(customFieldValues)
    .where(
      and(
        eq(customFieldValues.taskId, taskId),
        eq(customFieldValues.customFieldId, customFieldId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(customFieldValues)
      .set({ valueNumber: String(total) })
      .where(eq(customFieldValues.id, existing[0].id));
  } else {
    await db.insert(customFieldValues).values({
      taskId,
      customFieldId,
      valueNumber: String(total),
    });
  }

  return total;
};

// ─── Add a time entry ─────────────────────────────────────────────────────────

const addTimeEntry = async (taskId, customFieldId, userId, durationMinutes, source = "manual") => {
  throwIf(!durationMinutes || durationMinutes <= 0, "Duration must be a positive number", 400);

  const [task] = await db
    .select({ projectId: tasks.projectId })
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);
  throwIf(!task, "Task not found", 404);

  const [field] = await db
    .select()
    .from(customFields)
    .where(eq(customFields.id, customFieldId))
    .limit(1);
  throwIf(!field, "Custom field not found", 404);
  throwIf(field.type !== "actual_time", "Field is not an actual_time field", 400);
  throwIf(
    field.projectId !== task.projectId,
    "Field does not belong to this task's project",
    400
  );

  const [entry] = await db
    .insert(timeEntries)
    .values({
      taskId,
      customFieldId,
      userId: userId ?? null,
      durationMinutes: Math.round(durationMinutes),
      source,
    })
    .returning();

  await syncActualTotal(taskId, customFieldId);

  logger.info({ message: "Time entry added", entryId: entry.id, taskId, durationMinutes, source });
  return entry;
};

// ─── Get entries for a task/field with user info ──────────────────────────────

const getTaskTimeEntries = async (taskId, customFieldId) => {
  const rows = await db
    .select({
      id: timeEntries.id,
      taskId: timeEntries.taskId,
      customFieldId: timeEntries.customFieldId,
      userId: timeEntries.userId,
      durationMinutes: timeEntries.durationMinutes,
      loggedAt: timeEntries.loggedAt,
      source: timeEntries.source,
      userName: users.name,
      userAvatarUrl: users.avatarUrl,
    })
    .from(timeEntries)
    .leftJoin(users, eq(timeEntries.userId, users.id))
    .where(
      and(
        eq(timeEntries.taskId, taskId),
        eq(timeEntries.customFieldId, customFieldId)
      )
    )
    .orderBy(desc(timeEntries.loggedAt));

  return rows;
};

module.exports = { addTimeEntry, getTaskTimeEntries };
