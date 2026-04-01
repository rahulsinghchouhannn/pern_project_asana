const crypto = require("crypto");
const { eq, and, gt } = require("drizzle-orm");
const { db } = require("../db");
const { organizations, organizationMembers, invitations, users } = require("../db/schema");
const logger = require("../config/logger");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toSlug = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const uniqueSlug = async (baseName) => {
  const base = toSlug(baseName);
  let slug = base;
  let attempt = 0;

  while (true) {
    const [existing] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, slug))
      .limit(1);

    if (!existing) return slug;
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
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

  logger.info({ message: "Invitation created", orgId, invitedEmail: email });

  return invitation;
};

const acceptInvitation = async (token, userId) => {
  const now = new Date();

  const [invitation] = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.token, token),
        eq(invitations.status, "pending"),
        gt(invitations.expiresAt, now)
      )
    )
    .limit(1);

  if (!invitation) {
    const err = new Error("Invalid or expired invitation");
    err.statusCode = 400;
    throw err;
  }

  // Check not already a member
  const [existing] = await db
    .select({ id: organizationMembers.id })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, invitation.organizationId),
        eq(organizationMembers.userId, userId)
      )
    )
    .limit(1);

  if (!existing) {
    await db.insert(organizationMembers).values({
      organizationId: invitation.organizationId,
      userId,
      role: "member",
    });
  }

  await db
    .update(invitations)
    .set({ status: "accepted" })
    .where(eq(invitations.id, invitation.id));

  logger.info({ message: "Invitation accepted", orgId: invitation.organizationId, userId });

  return { organizationId: invitation.organizationId };
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

module.exports = {
  createOrganization,
  getUserOrganizations,
  switchOrganization,
  inviteUser,
  acceptInvitation,
  rejectInvitation,
  getOrgMembers,
};
