const { eq, and, inArray, asc } = require("drizzle-orm");
const { db } = require("../db");
const {
  customFields,
  customFieldValues,
  tasks,
  projectMembers,
  users,
} = require("../db/schema");
const logger = require("../config/logger");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const throwIf = (condition, message, statusCode = 400) => {
  if (condition) {
    const err = new Error(message);
    err.statusCode = statusCode;
    throw err;
  }
};

// ─── Field CRUD ───────────────────────────────────────────────────────────────

const createField = async (projectId, userId, data) => {
  const [field] = await db
    .insert(customFields)
    .values({
      projectId,
      name: data.name,
      type: data.type,
      options: data.options ?? null,
      position: data.position ?? 0,
      isRequired: data.isRequired ?? false,
      createdBy: userId,
    })
    .returning();

  logger.info({ message: "Custom field created", fieldId: field.id, projectId });
  return field;
};

const getProjectFields = async (projectId) => {
  return db
    .select()
    .from(customFields)
    .where(eq(customFields.projectId, projectId))
    .orderBy(asc(customFields.position), asc(customFields.createdAt));
};

const updateField = async (fieldId, data) => {
  const [existing] = await db
    .select()
    .from(customFields)
    .where(eq(customFields.id, fieldId))
    .limit(1);

  throwIf(!existing, "Custom field not found", 404);

  const updates = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.options !== undefined) updates.options = data.options;
  if (data.position !== undefined) updates.position = data.position;
  if (data.isRequired !== undefined) updates.isRequired = data.isRequired;

  // If type changes, delete existing values for that field
  if (data.type !== undefined && data.type !== existing.type) {
    updates.type = data.type;
    await db.delete(customFieldValues).where(eq(customFieldValues.customFieldId, fieldId));
    logger.info({ message: "Custom field type changed, values cleared", fieldId });
  }

  if (Object.keys(updates).length > 0) {
    const [updated] = await db
      .update(customFields)
      .set(updates)
      .where(eq(customFields.id, fieldId))
      .returning();
    return updated;
  }

  return existing;
};

const deleteField = async (fieldId) => {
  const [field] = await db
    .select({ id: customFields.id })
    .from(customFields)
    .where(eq(customFields.id, fieldId))
    .limit(1);

  throwIf(!field, "Custom field not found", 404);

  // Cascade deletes values via FK
  await db.delete(customFields).where(eq(customFields.id, fieldId));
  logger.info({ message: "Custom field deleted", fieldId });
};

const reorderFields = async (projectId, orderedIds) => {
  await db.transaction(async (tx) => {
    await Promise.all(
      orderedIds.map((id, index) =>
        tx
          .update(customFields)
          .set({ position: index })
          .where(
            and(
              eq(customFields.id, id),
              eq(customFields.projectId, projectId)
            )
          )
      )
    );
  });
};

// ─── Values ───────────────────────────────────────────────────────────────────

const setTaskFieldValue = async (taskId, customFieldId, valueData) => {
  // Verify field exists and belongs to the task's project
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
  throwIf(field.projectId !== task.projectId, "Field does not belong to this task's project", 400);

  // Validate value matches field type
  if (field.type === "dropdown" && valueData.valueOption != null) {
    const options = field.options ?? [];
    const validValues = options.map((o) => o.value);
    throwIf(
      !validValues.includes(valueData.valueOption),
      `Invalid dropdown option. Valid options: ${validValues.join(", ")}`,
      400
    );
  }

  if (field.type === "user" && valueData.valueUserId != null) {
    const [member] = await db
      .select({ userId: projectMembers.userId })
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, task.projectId),
          eq(projectMembers.userId, valueData.valueUserId)
        )
      )
      .limit(1);
    throwIf(!member, "User is not a member of this project", 400);
  }

  // Build value object — only store what's relevant to field type
  const valueRecord = {
    taskId,
    customFieldId,
    valueText: null,
    valueNumber: null,
    valueDate: null,
    valueUserId: null,
    valueOption: null,
  };

  switch (field.type) {
    case "text":
      valueRecord.valueText = valueData.valueText ?? null;
      break;
    case "number":
      valueRecord.valueNumber = valueData.valueNumber != null ? String(valueData.valueNumber) : null;
      break;
    case "date":
      valueRecord.valueDate = valueData.valueDate ? new Date(valueData.valueDate) : null;
      break;
    case "user":
      valueRecord.valueUserId = valueData.valueUserId ?? null;
      break;
    case "dropdown":
      valueRecord.valueOption = valueData.valueOption ?? null;
      break;
    case "estimated_time":
      valueRecord.valueNumber = valueData.valueNumber != null ? String(valueData.valueNumber) : null;
      break;
    // actual_time totals are managed by timeEntryService, not set directly
  }

  // Upsert
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

  let result;
  if (existing.length > 0) {
    const [updated] = await db
      .update(customFieldValues)
      .set({
        valueText: valueRecord.valueText,
        valueNumber: valueRecord.valueNumber,
        valueDate: valueRecord.valueDate,
        valueUserId: valueRecord.valueUserId,
        valueOption: valueRecord.valueOption,
      })
      .where(eq(customFieldValues.id, existing[0].id))
      .returning();
    result = updated;
  } else {
    const [inserted] = await db
      .insert(customFieldValues)
      .values(valueRecord)
      .returning();
    result = inserted;
  }

  // Return with field metadata
  return { ...result, field };
};

const getTaskFieldValues = async (taskId) => {
  const rows = await db
    .select({
      id: customFieldValues.id,
      taskId: customFieldValues.taskId,
      customFieldId: customFieldValues.customFieldId,
      valueText: customFieldValues.valueText,
      valueNumber: customFieldValues.valueNumber,
      valueDate: customFieldValues.valueDate,
      valueUserId: customFieldValues.valueUserId,
      valueOption: customFieldValues.valueOption,
      fieldName: customFields.name,
      fieldType: customFields.type,
      fieldOptions: customFields.options,
      fieldPosition: customFields.position,
      fieldIsRequired: customFields.isRequired,
    })
    .from(customFieldValues)
    .innerJoin(customFields, eq(customFieldValues.customFieldId, customFields.id))
    .where(eq(customFieldValues.taskId, taskId))
    .orderBy(asc(customFields.position));

  return rows;
};

const getProjectTaskFieldValues = async (projectId) => {
  const rows = await db
    .select({
      id: customFieldValues.id,
      taskId: customFieldValues.taskId,
      customFieldId: customFieldValues.customFieldId,
      valueText: customFieldValues.valueText,
      valueNumber: customFieldValues.valueNumber,
      valueDate: customFieldValues.valueDate,
      valueUserId: customFieldValues.valueUserId,
      valueOption: customFieldValues.valueOption,
    })
    .from(customFieldValues)
    .innerJoin(customFields, eq(customFieldValues.customFieldId, customFields.id))
    .innerJoin(tasks, eq(customFieldValues.taskId, tasks.id))
    .where(eq(tasks.projectId, projectId))
    .orderBy(asc(customFields.position));

  const map = {};
  rows.forEach((r) => {
    if (!map[r.taskId]) map[r.taskId] = [];
    map[r.taskId].push(r);
  });
  return map;
};

const getBulkTaskFieldValues = async (taskIds) => {
  if (taskIds.length === 0) return {};

  const rows = await db
    .select({
      id: customFieldValues.id,
      taskId: customFieldValues.taskId,
      customFieldId: customFieldValues.customFieldId,
      valueText: customFieldValues.valueText,
      valueNumber: customFieldValues.valueNumber,
      valueDate: customFieldValues.valueDate,
      valueUserId: customFieldValues.valueUserId,
      valueOption: customFieldValues.valueOption,
      fieldName: customFields.name,
      fieldType: customFields.type,
      fieldOptions: customFields.options,
      fieldPosition: customFields.position,
      fieldIsRequired: customFields.isRequired,
    })
    .from(customFieldValues)
    .innerJoin(customFields, eq(customFieldValues.customFieldId, customFields.id))
    .where(inArray(customFieldValues.taskId, taskIds))
    .orderBy(asc(customFields.position));

  const map = {};
  rows.forEach((r) => {
    if (!map[r.taskId]) map[r.taskId] = [];
    map[r.taskId].push(r);
  });
  return map;
};

module.exports = {
  createField,
  getProjectFields,
  updateField,
  deleteField,
  reorderFields,
  setTaskFieldValue,
  getTaskFieldValues,
  getBulkTaskFieldValues,
  getProjectTaskFieldValues,
};
