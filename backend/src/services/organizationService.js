const crypto = require("crypto");
const { eq, and, desc } = require("drizzle-orm");
const { db } = require("../db");
const { organizations, organizationMembers, invitations, users, roles, rolePermissions, userRoles, projectMembers } = require("../db/schema");
const { ALL_PERMISSIONS, ADMIN_PERMISSIONS, MEMBER_PERMISSIONS } = require("../config/permissions");
const activityService = require("./activityService");
const notificationService = require("./notificationService");
const logger = require("../config/logger");

// ─── System role seeding ──────────────────────────────────────────────────────

const seedSystemRoles = async (orgId, creatorUserId) => {
  const systemRoles = [
    { name: "Owner", permissions: ALL_PERMISSIONS },
    { name: "Admin", permissions: ADMIN_PERMISSIONS },
    { name: "Member", permissions: MEMBER_PERMISSIONS },
  ];

  for (const { name, permissions } of systemRoles) {
    const [role] = await db
      .insert(roles)
      .values({ organizationId: orgId, name, isSystem: true })
      .returning();

    if (permissions.length > 0) {
      await db.insert(rolePermissions).values(
        permissions.map((p) => ({ roleId: role.id, permission: p }))
      );
    }

    // Assign the Owner role to the creator
    if (name === "Owner") {
      await db
        .insert(userRoles)
        .values({ userId: creatorUserId, organizationId: orgId, roleId: role.id })
        .onConflictDoNothing();
    }
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toSlug = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const uniqueSlug = async (baseName) => {
  const base = toSlug(baseName);

  const [existing] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, base))
    .limit(1);

  if (!existing) return base;

  // Append a 6-char random hex suffix — collision probability is negligible
  // and avoids any unbounded loop.
  return `${base}-${crypto.randomBytes(3).toString("hex")}`;
};

// ─── Organization operations ──────────────────────────────────────────────────

const createOrganization = async (userId, { name }) => {
  const slug = await uniqueSlug(name);

  const [org] = await db
    .insert(organizations)
    .values({ name, slug, createdBy: userId })
    .returning();

  await db.insert(organizationMembers).values({
    organizationId: org.id,
    userId,
    role: "owner",
  });

  await seedSystemRoles(org.id, userId);

  logger.info({ message: "Organization created", orgId: org.id, userId });

  return org;
};

const getUserOrganizations = async (userId) => {
  const rows = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      logoUrl: organizations.logoUrl,
      createdAt: organizations.createdAt,
      role: organizationMembers.role,
      joinedAt: organizationMembers.joinedAt,
    })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
    .where(eq(organizationMembers.userId, userId));

  return rows;
};

const switchOrganization = async (userId, orgId) => {
  const [membership] = await db
    .select({ role: organizationMembers.role })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, orgId),
        eq(organizationMembers.userId, userId)
      )
    )
    .limit(1);

  if (!membership) {
    const err = new Error("You are not a member of this organization");
    err.statusCode = 403;
    throw err;
  }

  await db
    .update(users)
    .set({ lastActiveOrgId: orgId, updatedAt: new Date() })
    .where(eq(users.id, userId));

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  return { ...org, role: membership.role };
};

const inviteUser = async (orgId, invitedBy, email) => {
  // Check for existing pending invitation
  const [pending] = await db
    .select({ id: invitations.id })
    .from(invitations)
    .where(
      and(
        eq(invitations.organizationId, orgId),
        eq(invitations.invitedEmail, email),
        eq(invitations.status, "pending")
      )
    )
    .limit(1);

  if (pending) {
    const err = new Error("An invitation is already pending for this email");
    err.statusCode = 400;
    throw err;
  }

  // Check if email belongs to an existing member
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    const [membership] = await db
      .select({ id: organizationMembers.id })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, orgId),
          eq(organizationMembers.userId, existingUser.id)
        )
      )
      .limit(1);

    if (membership) {
      const err = new Error("This user is already a member");
      err.statusCode = 400;
      throw err;
    }
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const [invitation] = await db
    .insert(invitations)
    .values({
      organizationId: orgId,
      invitedEmail: email,
      invitedBy,
      token,
      status: "pending",
      expiresAt,
    })
    .returning();

  activityService.log({
    orgId,
    actorId: invitedBy,
    action: "member_invited",
    metadata: { email },
  }).catch((err) => logger.error({ message: "Failed to log member_invited", err }));

  logger.info({ message: "Invitation created", orgId, invitedEmail: email });

  return invitation;
};

const getOrgInvitations = async (orgId) => {
  const rows = await db
    .select({
      id: invitations.id,
      invitedEmail: invitations.invitedEmail,
      status: invitations.status,
      expiresAt: invitations.expiresAt,
      createdAt: invitations.createdAt,
      invitedByName: users.name,
      invitedByEmail: users.email,
      invitedByAvatarUrl: users.avatarUrl,
    })
    .from(invitations)
    .innerJoin(users, eq(invitations.invitedBy, users.id))
    .where(eq(invitations.organizationId, orgId))
    .orderBy(desc(invitations.createdAt))
    .limit(100);

  return rows;
};

const resendInvitation = async (orgId, invitationId) => {
  const [invitation] = await db
    .select({ id: invitations.id, organizationId: invitations.organizationId })
    .from(invitations)
    .where(
      and(
        eq(invitations.id, invitationId),
        eq(invitations.organizationId, orgId)
      )
    )
    .limit(1);

  if (!invitation) {
    const err = new Error("Invitation not found");
    err.statusCode = 404;
    throw err;
  }

  const newToken = crypto.randomBytes(32).toString("hex");
  const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const [updated] = await db
    .update(invitations)
    .set({ token: newToken, expiresAt: newExpiresAt, status: "pending" })
    .where(eq(invitations.id, invitationId))
    .returning();

  logger.info({ message: "Invitation resent", orgId, invitationId });
  return updated;
};

const cancelInvitation = async (orgId, invitationId) => {
  const [invitation] = await db
    .select({ id: invitations.id, status: invitations.status })
    .from(invitations)
    .where(
      and(
        eq(invitations.id, invitationId),
        eq(invitations.organizationId, orgId)
      )
    )
    .limit(1);

  if (!invitation) {
    const err = new Error("Invitation not found");
    err.statusCode = 404;
    throw err;
  }

  if (invitation.status !== "pending") {
    const err = new Error("Only pending invitations can be cancelled");
    err.statusCode = 400;
    throw err;
  }

  await db.delete(invitations).where(eq(invitations.id, invitationId));

  logger.info({ message: "Invitation cancelled", orgId, invitationId });
  return { success: true };
};

const acceptInvitation = async (token, userId) => {
  const now = new Date();

  // Fetch by token only — status is checked explicitly below
  const [invitation] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.token, token))
    .limit(1);

  if (!invitation) {
    const err = new Error("Invalid invitation link");
    err.statusCode = 404;
    throw err;
  }

  // Idempotent: user already accepted this invite — just return success
  if (invitation.status === "accepted") {
    return {
      organizationId: invitation.organizationId,
      projectId: invitation.projectId ?? null,
    };
  }

  if (invitation.expiresAt <= now) {
    const err = new Error("Invitation link has expired. Please request a new invite.");
    err.statusCode = 410;
    throw err;
  }

  if (invitation.status !== "pending") {
    const err = new Error("Invalid invitation link");
    err.statusCode = 400;
    throw err;
  }

  await db.transaction(async (tx) => {
    // Upsert org member — safe even if user is already a member
    await tx
      .insert(organizationMembers)
      .values({ organizationId: invitation.organizationId, userId, role: "member" })
      .onConflictDoNothing();

    // Assign the Member system role in userRoles so permission checks work
    const [memberRole] = await tx
      .select({ id: roles.id })
      .from(roles)
      .where(
        and(
          eq(roles.organizationId, invitation.organizationId),
          eq(roles.name, "Member"),
          eq(roles.isSystem, true)
        )
      )
      .limit(1);

    if (memberRole) {
      await tx
        .insert(userRoles)
        .values({ userId, organizationId: invitation.organizationId, roleId: memberRole.id })
        .onConflictDoNothing();
    }

    // Upsert project member — safe even if user is already in the project
    if (invitation.projectId) {
      await tx
        .insert(projectMembers)
        .values({ projectId: invitation.projectId, userId, role: "member" })
        .onConflictDoNothing();
    }

    await tx
      .update(invitations)
      .set({ status: "accepted" })
      .where(eq(invitations.id, invitation.id));
  });

  activityService.log({
    orgId: invitation.organizationId,
    actorId: userId,
    action: "member_joined",
  }).catch((err) => logger.error({ message: "Failed to log member_joined", err }));

  notificationService.create({
    recipientId: userId,
    actorId: invitation.invitedBy,
    orgId: invitation.organizationId,
    type: "invitation",
    title: invitation.projectId
      ? "You've been added to a project"
      : "You joined a new organization",
    entityType: "project",
    entityId: invitation.projectId ?? null,
  }).catch((err) => logger.error({ message: "Failed to create invitation notification", err }));

  logger.info({ message: "Invitation accepted", orgId: invitation.organizationId, userId });

  return {
    organizationId: invitation.organizationId,
    projectId: invitation.projectId ?? null,
  };
};

const rejectInvitation = async (token) => {
  const [invitation] = await db
    .select({ id: invitations.id, status: invitations.status })
    .from(invitations)
    .where(eq(invitations.token, token))
    .limit(1);

  if (!invitation || invitation.status !== "pending") {
    const err = new Error("Invalid or already processed invitation");
    err.statusCode = 400;
    throw err;
  }

  await db
    .update(invitations)
    .set({ status: "rejected" })
    .where(eq(invitations.id, invitation.id));

  return { success: true };
};

const getOrgMembers = async (orgId) => {
  const rows = await db
    .select({
      memberId: organizationMembers.id,
      role: organizationMembers.role,
      joinedAt: organizationMembers.joinedAt,
      userId: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
    })
    .from(organizationMembers)
    .innerJoin(users, eq(organizationMembers.userId, users.id))
    .where(eq(organizationMembers.organizationId, orgId));

  return rows;
};

const removeMember = async (orgId, targetUserId, requestingUserId) => {
  if (targetUserId === requestingUserId) {
    const err = new Error("Cannot remove yourself from the organization");
    err.statusCode = 400;
    throw err;
  }

  const [membership] = await db
    .select({ id: organizationMembers.id })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, orgId),
        eq(organizationMembers.userId, targetUserId)
      )
    )
    .limit(1);

  if (!membership) {
    const err = new Error("User is not a member of this organization");
    err.statusCode = 404;
    throw err;
  }

  // Check if target is the last owner
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

    const isTargetOwner = owners.some((o) => o.userId === targetUserId);
    if (isTargetOwner && owners.length === 1) {
      const err = new Error("Cannot remove the last owner of the organization");
      err.statusCode = 400;
      throw err;
    }
  }

  await db
    .delete(organizationMembers)
    .where(eq(organizationMembers.id, membership.id));

  logger.info({ message: "Member removed", orgId, targetUserId });
  return { success: true };
};

module.exports = {
  createOrganization,
  getUserOrganizations,
  switchOrganization,
  inviteUser,
  getOrgInvitations,
  resendInvitation,
  cancelInvitation,
  acceptInvitation,
  rejectInvitation,
  getOrgMembers,
  removeMember,
};
