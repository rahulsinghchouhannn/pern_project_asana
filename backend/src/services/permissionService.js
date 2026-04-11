const { eq, and } = require("drizzle-orm");
const { db } = require("../db");
const {
  roles,
  rolePermissions,
  userRoles,
  projectRoles,
  organizationMembers,
} = require("../db/schema");
const errorResponse = require("../utils/errorResponse");
const logger = require("../config/logger");

// ─── Core permission queries ──────────────────────────────────────────────────

const getUserPermissions = async (userId, orgId, projectId = null) => {
  // Project-level override: single JOIN across projectRoles → rolePermissions
  if (projectId) {
    const projectPerms = await db
      .select({ permission: rolePermissions.permission })
      .from(projectRoles)
      .innerJoin(rolePermissions, eq(projectRoles.roleId, rolePermissions.roleId))
      .where(
        and(
          eq(projectRoles.userId, userId),
          eq(projectRoles.projectId, projectId)
        )
      );

    if (projectPerms.length > 0) {
      return new Set(projectPerms.map((p) => p.permission));
    }
  }

  // Org-level role: single JOIN across userRoles → rolePermissions
  const orgPerms = await db
    .select({ permission: rolePermissions.permission })
    .from(userRoles)
    .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(userRoles.organizationId, orgId)
      )
    );

  return new Set(orgPerms.map((p) => p.permission));
};

const hasPermission = async (userId, orgId, permission, projectId = null) => {
  const perms = await getUserPermissions(userId, orgId, projectId);
  return perms.has(permission);
};

// ─── Middleware factory ───────────────────────────────────────────────────────

/**
 * @param {string} permission
 * @param {{ projectIdParam?: string; deniedMessage?: string }} [options]
 *   projectIdParam — express param name whose value is the project UUID (e.g. "id" on /projects/:id)
 */
const requirePermission = (permission, options = {}) => async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { orgId } = req.org;
    const { projectIdParam, deniedMessage } = options;
    const projectId =
      req.params.projectId ||
      (projectIdParam && req.params[projectIdParam] ? req.params[projectIdParam] : null) ||
      null;

    const perms = await getUserPermissions(userId, orgId, projectId);

    if (!perms.has(permission)) {
      return res
        .status(403)
        .json(errorResponse(deniedMessage || "Insufficient permissions"));
    }

    next();
  } catch (err) {
    logger.error({ message: "requirePermission error", err });
    return res.status(403).json(errorResponse("Permission check failed"));
  }
};

// ─── Role management ──────────────────────────────────────────────────────────

const getOrgRoles = async (orgId) => {
  const orgRoles = await db
    .select()
    .from(roles)
    .where(eq(roles.organizationId, orgId));

  const result = [];
  for (const role of orgRoles) {
    const perms = await db
      .select({ permission: rolePermissions.permission })
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, role.id));

    result.push({ ...role, permissions: perms.map((p) => p.permission) });
  }

  return result;
};

const createRole = async (orgId, name, permissions) => {
  const [role] = await db
    .insert(roles)
    .values({ organizationId: orgId, name, isSystem: false })
    .returning();

  if (permissions && permissions.length > 0) {
    await db.insert(rolePermissions).values(
      permissions.map((p) => ({ roleId: role.id, permission: p }))
    );
  }

  logger.info({ message: "Role created", roleId: role.id, orgId });
  return { ...role, permissions: permissions || [] };
};

const updateRole = async (roleId, name, permissions) => {
  const [existing] = await db
    .select()
    .from(roles)
    .where(eq(roles.id, roleId))
    .limit(1);

  if (!existing) {
    const err = new Error("Role not found");
    err.statusCode = 404;
    throw err;
  }

  if (existing.isSystem && name && name !== existing.name) {
    const err = new Error("Cannot rename system roles");
    err.statusCode = 400;
    throw err;
  }

  if (name && !existing.isSystem) {
    await db.update(roles).set({ name }).where(eq(roles.id, roleId));
  }

  if (permissions !== undefined) {
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
    if (permissions.length > 0) {
      await db.insert(rolePermissions).values(
        permissions.map((p) => ({ roleId, permission: p }))
      );
    }
  }

  const updatedPerms = await db
    .select({ permission: rolePermissions.permission })
    .from(rolePermissions)
    .where(eq(rolePermissions.roleId, roleId));

  return {
    ...existing,
    name: name && !existing.isSystem ? name : existing.name,
    permissions: updatedPerms.map((p) => p.permission),
  };
};

const deleteRole = async (roleId, orgId) => {
  const [existing] = await db
    .select()
    .from(roles)
    .where(eq(roles.id, roleId))
    .limit(1);

  if (!existing) {
    const err = new Error("Role not found");
    err.statusCode = 404;
    throw err;
  }

  if (existing.isSystem) {
    const err = new Error("Cannot delete system roles");
    err.statusCode = 400;
    throw err;
  }

  // Reassign users of this role to the Member system role
  const [memberRole] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(
      and(
        eq(roles.organizationId, orgId),
        eq(roles.name, "Member"),
        eq(roles.isSystem, true)
      )
    )
    .limit(1);

  if (memberRole) {
    await db
      .update(userRoles)
      .set({ roleId: memberRole.id })
      .where(eq(userRoles.roleId, roleId));
  }

  await db.delete(roles).where(eq(roles.id, roleId));

  logger.info({ message: "Role deleted", roleId });
  return { success: true };
};

const assignOrgRole = async (userId, orgId, roleId) => {
  // Resolve the Owner system role for this org
  const [ownerRole] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(
      and(
        eq(roles.organizationId, orgId),
        eq(roles.name, "Owner"),
        eq(roles.isSystem, true)
      )
    )
    .limit(1);

  // Prevent manually assigning the Owner role to anyone
  if (ownerRole && ownerRole.id === roleId) {
    const err = new Error("The Owner role cannot be manually assigned");
    err.statusCode = 400;
    throw err;
  }

  // Prevent changing the role of the last owner
  if (ownerRole) {
    const owners = await db
      .select({ userId: userRoles.userId })
      .from(userRoles)
      .where(
        and(
          eq(userRoles.organizationId, orgId),
          eq(userRoles.roleId, ownerRole.id)
        )
      );

    const isCurrentlyOwner = owners.some((o) => o.userId === userId);
    if (isCurrentlyOwner && owners.length === 1) {
      const err = new Error("Cannot change the role of the last owner");
      err.statusCode = 400;
      throw err;
    }
  }

  const [assignedRole] = await db
    .select({ name: roles.name })
    .from(roles)
    .where(eq(roles.id, roleId))
    .limit(1);

  if (!assignedRole) {
    const err = new Error("Role not found");
    err.statusCode = 404;
    throw err;
  }

  await db
    .insert(userRoles)
    .values({ userId, organizationId: orgId, roleId })
    .onConflictDoUpdate({
      target: [userRoles.userId, userRoles.organizationId],
      set: { roleId },
    });

  await db
    .update(organizationMembers)
    .set({ role: assignedRole.name.toLowerCase() })
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, orgId)
      )
    );

  logger.info({ message: "Org role assigned", userId, orgId, roleId });
  return { success: true };
};

const assignProjectRole = async (userId, projectId, roleId) => {
  await db
    .insert(projectRoles)
    .values({ userId, projectId, roleId })
    .onConflictDoUpdate({
      target: [projectRoles.userId, projectRoles.projectId],
      set: { roleId },
    });

  logger.info({ message: "Project role assigned", userId, projectId, roleId });
  return { success: true };
};

const removeProjectRole = async (userId, projectId) => {
  await db
    .delete(projectRoles)
    .where(
      and(
        eq(projectRoles.userId, userId),
        eq(projectRoles.projectId, projectId)
      )
    );

  logger.info({ message: "Project role removed", userId, projectId });
  return { success: true };
};

const getMyPermissions = async (userId, orgId, projectId = null) => {
  const perms = await getUserPermissions(userId, orgId, projectId);
  return Array.from(perms);
};

module.exports = {
  getUserPermissions,
  hasPermission,
  requirePermission,
  getOrgRoles,
  createRole,
  updateRole,
  deleteRole,
  assignOrgRole,
  assignProjectRole,
  removeProjectRole,
  getMyPermissions,
};
