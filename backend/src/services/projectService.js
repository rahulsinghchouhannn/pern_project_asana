const { eq, and, inArray, count } = require("drizzle-orm");
const { db } = require("../db");
const { projects, projectMembers, projectStatuses, users, organizationMembers } = require("../db/schema");
const activityService = require("./activityService");
const { hasPermission } = require("./permissionService");
const { PERMISSIONS } = require("../config/permissions");
const logger = require("../config/logger");

// ─── Default statuses seeded on project creation ─────────────────────────────

const DEFAULT_STATUSES = [
  { name: "To do",  color: "#E0E0E0", position: 0, isDefault: true  },
  { name: "Doing",  color: "#5C93E6", position: 1, isDefault: false },
  { name: "Done",   color: "#41B060", position: 2, isDefault: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const throwIf = (condition, message, statusCode = 403) => {
  if (condition) {
    const err = new Error(message);
    err.statusCode = statusCode;
    throw err;
  }
};

const getMemberRole = async (projectId, userId) => {
  const [membership] = await db
    .select({ role: projectMembers.role })
    .from(projectMembers)
    .where(
      and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId))
    )
    .limit(1);
  return membership?.role ?? null;
};

// ─── Project CRUD ─────────────────────────────────────────────────────────────

const createProject = async (orgId, userId, data) => {
  const [project] = await db
    .insert(projects)
    .values({
      organizationId: orgId,
      name: data.name,
      description: data.description ?? null,
      color: data.color ?? "#6C63FF",
      isPrivate: data.isPrivate ?? false,
      defaultView: data.defaultView ?? "list",
      views: data.views ?? ["overview", "list", "board", "timeline", "dashboard"],
      createdBy: userId,
    })
    .returning();

  // Add creator as owner member
  await db.insert(projectMembers).values({
    projectId: project.id,
    userId,
    role: "owner",
  });

  // Seed default statuses
  await db.insert(projectStatuses).values(
    DEFAULT_STATUSES.map((s) => ({ ...s, projectId: project.id }))
  );

  const statuses = await db
    .select()
    .from(projectStatuses)
    .where(eq(projectStatuses.projectId, project.id))
    .limit(50);

  activityService.log({
    orgId,
    projectId: project.id,
    actorId: userId,
    action: "project_created",
    metadata: { projectName: project.name },
  }).catch((err) => logger.error({ message: "Failed to log project_created", err }));

  logger.info({ message: "Project created", projectId: project.id, userId });

  return { ...project, statuses, membersCount: 1 };
};

const getOrgProjects = async (orgId, userId) => {
  const allProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.organizationId, orgId))
    .limit(200);

  if (allProjects.length === 0) return [];

  const projectIds = allProjects.map((p) => p.id);

  // Fetch user's project memberships and org role in parallel
  const [memberships, [orgMembership]] = await Promise.all([
    db
      .select({ projectId: projectMembers.projectId })
      .from(projectMembers)
      .where(
        and(
          inArray(projectMembers.projectId, projectIds),
          eq(projectMembers.userId, userId)
        )
      )
      .limit(500),
    db
      .select({ role: organizationMembers.role })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, orgId),
          eq(organizationMembers.userId, userId)
        )
      )
      .limit(1),
  ]);

  const memberProjectIds = new Set(memberships.map((m) => m.projectId));
  const isPrivileged = ["owner", "admin"].includes(orgMembership?.role);

  // Owners/admins see all projects.
  // Regular members only see projects they are explicitly added to.
  const visibleProjects = isPrivileged
    ? allProjects
    : allProjects.filter((p) => memberProjectIds.has(p.id));

  if (visibleProjects.length === 0) return [];

  // Batch member counts
  const visibleIds = visibleProjects.map((p) => p.id);
  const countRows = await db
    .select({
      projectId: projectMembers.projectId,
      membersCount: count(),
    })
    .from(projectMembers)
    .where(inArray(projectMembers.projectId, visibleIds))
    .groupBy(projectMembers.projectId)
    .limit(200);

  const countMap = Object.fromEntries(
    countRows.map((r) => [r.projectId, Number(r.membersCount)])
  );

  return visibleProjects.map((p) => ({
    ...p,
    membersCount: countMap[p.id] ?? 0,
  }));
};

const getProjectById = async (projectId, userId) => {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  throwIf(!project, "Project not found", 404);

  if (project.isPrivate) {
    const role = await getMemberRole(projectId, userId);
    throwIf(!role, "You do not have access to this project", 403);
  }

  const [statuses, countRows] = await Promise.all([
    db
      .select()
      .from(projectStatuses)
      .where(eq(projectStatuses.projectId, projectId))
      .limit(50),
    db
      .select({ membersCount: count() })
      .from(projectMembers)
      .where(eq(projectMembers.projectId, projectId))
      .limit(1),
  ]);

  return {
    ...project,
    statuses,
    membersCount: Number(countRows[0]?.membersCount ?? 0),
  };
};

const updateProject = async (projectId, userId, data, orgId) => {
  const [project] = await db
    .select({ organizationId: projects.organizationId })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  throwIf(!project, "Project not found", 404);
  throwIf(project.organizationId !== orgId, "Project not found", 404);

  const allowed = await hasPermission(
    userId,
    orgId,
    PERMISSIONS.UPDATE_PROJECT,
    projectId
  );
  throwIf(!allowed, "You do not have permission to update this project.", 403);

  const [updated] = await db
    .update(projects)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(projects.id, projectId))
    .returning();

  throwIf(!updated, "Project not found", 404);
  return updated;
};

const archiveProject = async (projectId, userId, orgId) => {
  const [project] = await db
    .select({ organizationId: projects.organizationId })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  throwIf(!project, "Project not found", 404);
  throwIf(project.organizationId !== orgId, "Project not found", 404);

  const role = await getMemberRole(projectId, userId);
  const hasArchivePermission = await hasPermission(
    userId,
    orgId,
    PERMISSIONS.ARCHIVE_PROJECT,
    projectId
  );
  // Match delete flow: explicit archive_project, or legacy project owner/editor.
  throwIf(
    !hasArchivePermission && (!role || !["owner", "editor"].includes(role)),
    "Insufficient permissions",
    403
  );

  const [updated] = await db
    .update(projects)
    .set({ isArchived: true, updatedAt: new Date() })
    .where(eq(projects.id, projectId))
    .returning();

  return updated;
};

const completeProject = async (projectId, userId) => {
  const role = await getMemberRole(projectId, userId);
  throwIf(!role || !["owner", "editor"].includes(role), "Insufficient permissions");

  const [updated] = await db
    .update(projects)
    .set({ isCompleted: true, updatedAt: new Date() })
    .where(eq(projects.id, projectId))
    .returning();

  return updated;
};

const deleteProject = async (projectId, userId) => {
  const [project] = await db
    .select({ id: projects.id, organizationId: projects.organizationId })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  throwIf(!project, "Project not found", 404);

  const role = await getMemberRole(projectId, userId);
  const hasDeletePermission = await hasPermission(
    userId,
    project.organizationId,
    PERMISSIONS.DELETE_PROJECT,
    projectId
  );
  throwIf(role !== "owner" && !hasDeletePermission, "Insufficient permissions to delete this project", 403);

  await db.delete(projects).where(eq(projects.id, projectId));
  logger.info({ message: "Project deleted", projectId, userId });
};

// ─── Members ──────────────────────────────────────────────────────────────────

const addMember = async (projectId, addedBy, data) => {
  const adderRole = await getMemberRole(projectId, addedBy);
  throwIf(
    !adderRole || !["owner", "editor"].includes(adderRole),
    "Insufficient permissions to add members"
  );

  const [member] = await db
    .insert(projectMembers)
    .values({
      projectId,
      userId: data.userId,
      role: data.role ?? "member",
    })
    .returning();

  return member;
};

const removeMember = async (projectId, removedBy, targetUserId) => {
  const removerRole = await getMemberRole(projectId, removedBy);
  throwIf(removerRole !== "owner", "Only the project owner can remove members");

  await db
    .delete(projectMembers)
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, targetUserId)
      )
    );
};

const getProjectMembers = async (projectId) => {
  const rows = await db
    .select({
      id: projectMembers.id,
      role: projectMembers.role,
      joinedAt: projectMembers.joinedAt,
      userId: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
    })
    .from(projectMembers)
    .innerJoin(users, eq(projectMembers.userId, users.id))
    .where(eq(projectMembers.projectId, projectId))
    .limit(100);

  return rows;
};

// ─── Statuses ─────────────────────────────────────────────────────────────────

const getProjectStatuses = async (projectId) => {
  return db
    .select()
    .from(projectStatuses)
    .where(eq(projectStatuses.projectId, projectId))
    .limit(50);
};

const createStatus = async (projectId, userId, data) => {
  const role = await getMemberRole(projectId, userId);
  throwIf(!role || !["owner", "editor"].includes(role), "Insufficient permissions");

  const [status] = await db
    .insert(projectStatuses)
    .values({
      projectId,
      name: data.name,
      color: data.color ?? "#E0E0E0",
      position: data.position ?? 0,
    })
    .returning();

  return status;
};

const updateStatus = async (statusId, data) => {
  const [updated] = await db
    .update(projectStatuses)
    .set(data)
    .where(eq(projectStatuses.id, statusId))
    .returning();

  throwIf(!updated, "Status not found", 404);
  return updated;
};

const deleteStatus = async (statusId, projectId) => {
  // Note: when the tasks module is added, reject if any tasks reference this status
  await db
    .delete(projectStatuses)
    .where(
      and(
        eq(projectStatuses.id, statusId),
        eq(projectStatuses.projectId, projectId)
      )
    );
};

const reorderStatuses = async (projectId, orderedIds) => {
  await Promise.all(
    orderedIds.map((id, index) =>
      db
        .update(projectStatuses)
        .set({ position: index })
        .where(
          and(
            eq(projectStatuses.id, id),
            eq(projectStatuses.projectId, projectId)
          )
        )
    )
  );

  return getProjectStatuses(projectId);
};

module.exports = {
  createProject,
  getOrgProjects,
  getProjectById,
  updateProject,
  archiveProject,
  completeProject,
  deleteProject,
  addMember,
  removeMember,
  getProjectMembers,
  getProjectStatuses,
  createStatus,
  updateStatus,
  deleteStatus,
  reorderStatuses,
};
