const { eq, and, asc, max, inArray } = require("drizzle-orm");
const { db } = require("../db");
const { projectSections, tasks } = require("../db/schema");
const { emitToProject } = require("../config/socket");
const logger = require("../config/logger");

const throwIf = (condition, message, statusCode = 400) => {
  if (condition) {
    const err = new Error(message);
    err.statusCode = statusCode;
    throw err;
  }
};

// ─── Create ───────────────────────────────────────────────────────────────────

const createSection = async (projectId, orgId, data) => {
  const [maxRow] = await db
    .select({ maxPos: max(projectSections.position) })
    .from(projectSections)
    .where(eq(projectSections.projectId, projectId))
    .limit(1);

  const position = maxRow?.maxPos != null ? Number(maxRow.maxPos) + 1 : 0;

  const [section] = await db
    .insert(projectSections)
    .values({
      projectId,
      organizationId: orgId,
      name: data.name ?? "Untitled section",
      position,
    })
    .returning();

  logger.info({ message: "Section created", sectionId: section.id, projectId });
  emitToProject(projectId, "section:created", section);
  return section;
};

// ─── List by project ──────────────────────────────────────────────────────────

const getSectionsByProject = async (projectId) => {
  return db
    .select()
    .from(projectSections)
    .where(eq(projectSections.projectId, projectId))
    .orderBy(asc(projectSections.position));
};

// ─── Update (rename / reposition) ────────────────────────────────────────────

const updateSection = async (sectionId, projectId, data) => {
  const [existing] = await db
    .select()
    .from(projectSections)
    .where(and(eq(projectSections.id, sectionId), eq(projectSections.projectId, projectId)))
    .limit(1);

  throwIf(!existing, "Section not found", 404);

  const updates = { updatedAt: new Date() };
  if (data.name !== undefined) updates.name = data.name;
  if (data.position !== undefined) updates.position = data.position;

  const [updated] = await db
    .update(projectSections)
    .set(updates)
    .where(eq(projectSections.id, sectionId))
    .returning();

  logger.info({ message: "Section updated", sectionId });
  emitToProject(projectId, "section:updated", updated);
  return updated;
};

// ─── Reorder (bulk position update) ──────────────────────────────────────────

const reorderSections = async (projectId, sectionIds) => {
  // Validate all section IDs belong to this project
  const existing = await db
    .select({ id: projectSections.id })
    .from(projectSections)
    .where(
      and(
        eq(projectSections.projectId, projectId),
        inArray(projectSections.id, sectionIds)
      )
    );

  throwIf(
    existing.length !== sectionIds.length,
    "One or more section IDs are invalid for this project",
    400
  );

  await db.transaction(async (tx) => {
    await Promise.all(
      sectionIds.map((id, index) =>
        tx
          .update(projectSections)
          .set({ position: index, updatedAt: new Date() })
          .where(eq(projectSections.id, id))
      )
    );
  });

  const reordered = await getSectionsByProject(projectId);
  emitToProject(projectId, "section:reordered", { sections: reordered });
  return reordered;
};

// ─── Delete section only (tasks become unsectioned) ───────────────────────────

const deleteSectionOnly = async (sectionId, projectId) => {
  const [existing] = await db
    .select()
    .from(projectSections)
    .where(and(eq(projectSections.id, sectionId), eq(projectSections.projectId, projectId)))
    .limit(1);

  throwIf(!existing, "Section not found", 404);

  // Tasks with this sectionId will be SET NULL due to the FK ON DELETE SET NULL.
  // We delete the section directly — the DB handles nulling the tasks.
  await db.delete(projectSections).where(eq(projectSections.id, sectionId));

  logger.info({ message: "Section deleted (tasks kept)", sectionId, projectId });
  emitToProject(projectId, "section:deleted", { sectionId, deletedTaskIds: [] });
};

// ─── Delete section and all its tasks ────────────────────────────────────────

const deleteSectionWithTasks = async (sectionId, projectId) => {
  const [existing] = await db
    .select()
    .from(projectSections)
    .where(and(eq(projectSections.id, sectionId), eq(projectSections.projectId, projectId)))
    .limit(1);

  throwIf(!existing, "Section not found", 404);

  // Collect task IDs before deletion for socket broadcast
  const taskRows = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(eq(tasks.sectionId, sectionId));

  const deletedTaskIds = taskRows.map((t) => t.id);

  await db.transaction(async (tx) => {
    if (deletedTaskIds.length > 0) {
      await tx.delete(tasks).where(eq(tasks.sectionId, sectionId));
    }
    await tx.delete(projectSections).where(eq(projectSections.id, sectionId));
  });

  logger.info({ message: "Section deleted with tasks", sectionId, projectId, deletedCount: deletedTaskIds.length });
  emitToProject(projectId, "section:deleted", { sectionId, deletedTaskIds });
};

// ─── Task count for a section ─────────────────────────────────────────────────

const getSectionTaskCount = async (sectionId) => {
  const rows = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(eq(tasks.sectionId, sectionId));
  return rows.length;
};

module.exports = {
  createSection,
  getSectionsByProject,
  updateSection,
  reorderSections,
  deleteSectionOnly,
  deleteSectionWithTasks,
  getSectionTaskCount,
};
