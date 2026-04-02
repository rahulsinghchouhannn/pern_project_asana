const { db } = require("../db");
const {
  tasks,
  projects,
  projectStatuses,
  taskAssignees,
  users,
  activityLogs,
  organizationMembers,
} = require("../db/schema");
const { eq, and, lt, gte, lte, count, sql, inArray, isNull } = require("drizzle-orm");

// ─── helpers ──────────────────────────────────────────────────────────────────

const buildTaskFilters = (orgId, { projectId, userId, startDate, endDate } = {}) => {
  const conditions = [eq(tasks.organizationId, orgId)];
  if (projectId) conditions.push(eq(tasks.projectId, projectId));
  if (startDate) conditions.push(gte(tasks.createdAt, new Date(startDate)));
  if (endDate) conditions.push(lte(tasks.createdAt, new Date(endDate)));
  return and(...conditions);
};

// ─── getOrgDashboard ──────────────────────────────────────────────────────────

const getOrgDashboard = async (orgId, filters = {}) => {
  const baseFilter = buildTaskFilters(orgId, filters);
  const now = new Date();

  // Total tasks
  const [{ total }] = await db
    .select({ total: count() })
    .from(tasks)
    .where(baseFilter);

  // Completed tasks
  const [{ completed }] = await db
    .select({ completed: count() })
    .from(tasks)
    .where(and(baseFilter, eq(tasks.isCompleted, true)));

  // Overdue tasks
  const [{ overdue }] = await db
    .select({ overdue: count() })
    .from(tasks)
    .where(and(baseFilter, eq(tasks.isCompleted, false), lt(tasks.dueDate, now)));

  const totalTasks = Number(total);
  const completedTasks = Number(completed);
  const overdueTasks = Number(overdue);
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Tasks by priority
  const priorityRows = await db
    .select({ priority: tasks.priority, cnt: count() })
    .from(tasks)
    .where(baseFilter)
    .groupBy(tasks.priority);

  const tasksByPriority = { none: 0, low: 0, medium: 0, high: 0, urgent: 0 };
  for (const row of priorityRows) {
    const key = row.priority ?? "none";
    tasksByPriority[key] = Number(row.cnt);
  }

  // Tasks by status (join with projectStatuses)
  const statusRows = await db
    .select({
      statusName: projectStatuses.name,
      statusColor: projectStatuses.color,
      cnt: count(),
    })
    .from(tasks)
    .innerJoin(projectStatuses, eq(tasks.statusId, projectStatuses.id))
    .where(baseFilter)
    .groupBy(projectStatuses.id, projectStatuses.name, projectStatuses.color);

  const tasksByStatus = statusRows.map((r) => ({
    statusName: r.statusName,
    statusColor: r.statusColor,
    count: Number(r.cnt),
  }));

  // Tasks by project
  const projectRows = await db
    .select({
      projectName: projects.name,
      total: count(),
      completed: sql`SUM(CASE WHEN ${tasks.isCompleted} = true THEN 1 ELSE 0 END)`,
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(baseFilter)
    .groupBy(projects.id, projects.name);

  const tasksByProject = projectRows.map((r) => ({
    projectName: r.projectName,
    total: Number(r.total),
    completed: Number(r.completed),
  }));

  // Recent activity (last 10)
  const recentActivityRows = await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      metadata: activityLogs.metadata,
      createdAt: activityLogs.createdAt,
      actorId: activityLogs.actorId,
      actorName: users.name,
      actorAvatar: users.avatarUrl,
    })
    .from(activityLogs)
    .innerJoin(users, eq(activityLogs.actorId, users.id))
    .where(eq(activityLogs.organizationId, orgId))
    .orderBy(sql`${activityLogs.createdAt} DESC`)
    .limit(10);

  // Tasks due this week
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const dueSoonRows = await db
    .select()
    .from(tasks)
    .where(
      and(
        baseFilter,
        eq(tasks.isCompleted, false),
        gte(tasks.dueDate, now),
        lte(tasks.dueDate, weekEnd)
      )
    )
    .limit(20);

  return {
    totalTasks,
    completedTasks,
    overdueTasks,
    completionRate,
    tasksByPriority,
    tasksByStatus,
    tasksByProject,
    recentActivity: recentActivityRows,
    tasksDueThisWeek: dueSoonRows,
  };
};

// ─── getProjectDashboard ──────────────────────────────────────────────────────

const getProjectDashboard = async (projectId) => {
  const now = new Date();

  // Total + completed
  const [{ total }] = await db
    .select({ total: count() })
    .from(tasks)
    .where(eq(tasks.projectId, projectId));

  const [{ completed }] = await db
    .select({ completed: count() })
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), eq(tasks.isCompleted, true)));

  const totalTasks = Number(total);
  const completedTasks = Number(completed);
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Tasks by status
  const statusRows = await db
    .select({
      statusId: projectStatuses.id,
      statusName: projectStatuses.name,
      color: projectStatuses.color,
      cnt: count(),
    })
    .from(tasks)
    .innerJoin(projectStatuses, eq(tasks.statusId, projectStatuses.id))
    .where(eq(tasks.projectId, projectId))
    .groupBy(projectStatuses.id, projectStatuses.name, projectStatuses.color);

  const tasksByStatus = statusRows.map((r) => ({
    statusId: r.statusId,
    statusName: r.statusName,
    color: r.color,
    count: Number(r.cnt),
  }));

  // Tasks by priority
  const priorityRows = await db
    .select({ priority: tasks.priority, cnt: count() })
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .groupBy(tasks.priority);

  const tasksByPriority = { none: 0, low: 0, medium: 0, high: 0, urgent: 0 };
  for (const row of priorityRows) {
    const key = row.priority ?? "none";
    tasksByPriority[key] = Number(row.cnt);
  }

  // Overdue count
  const [{ overdue }] = await db
    .select({ overdue: count() })
    .from(tasks)
    .where(
      and(
        eq(tasks.projectId, projectId),
        eq(tasks.isCompleted, false),
        lt(tasks.dueDate, now)
      )
    );

  // Unassigned (tasks with no entry in taskAssignees)
  const assignedTaskIds = await db
    .select({ taskId: taskAssignees.taskId })
    .from(taskAssignees)
    .innerJoin(tasks, eq(taskAssignees.taskId, tasks.id))
    .where(eq(tasks.projectId, projectId));

  const assignedIds = assignedTaskIds.map((r) => r.taskId);

  let unassignedCount = totalTasks;
  if (assignedIds.length > 0) {
    const [{ assigned }] = await db
      .select({ assigned: count() })
      .from(tasks)
      .where(
        and(
          eq(tasks.projectId, projectId),
          inArray(tasks.id, assignedIds)
        )
      );
    unassignedCount = totalTasks - Number(assigned);
  }

  // Member workload: tasks per assignee
  const workloadRows = await db
    .select({
      userId: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
      taskCount: count(),
    })
    .from(taskAssignees)
    .innerJoin(tasks, eq(taskAssignees.taskId, tasks.id))
    .innerJoin(users, eq(taskAssignees.userId, users.id))
    .where(eq(tasks.projectId, projectId))
    .groupBy(users.id, users.name, users.avatarUrl)
    .orderBy(sql`COUNT(*) DESC`);

  // Recent activity
  const recentActivityRows = await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      metadata: activityLogs.metadata,
      createdAt: activityLogs.createdAt,
      actorId: activityLogs.actorId,
      actorName: users.name,
      actorAvatar: users.avatarUrl,
    })
    .from(activityLogs)
    .innerJoin(users, eq(activityLogs.actorId, users.id))
    .where(eq(activityLogs.projectId, projectId))
    .orderBy(sql`${activityLogs.createdAt} DESC`)
    .limit(10);

  return {
    completionRate,
    tasksByStatus,
    tasksByPriority,
    overdueCount: Number(overdue),
    unassignedCount,
    memberWorkload: workloadRows.map((r) => ({
      userId: r.userId,
      name: r.name,
      avatarUrl: r.avatarUrl,
      taskCount: Number(r.taskCount),
    })),
    recentActivity: recentActivityRows,
  };
};

module.exports = { getOrgDashboard, getProjectDashboard };
