const crypto = require("crypto");
const { eq, and } = require("drizzle-orm");
const { db } = require("../db");
const {
  invitations,
  projectMembers,
  organizationMembers,
  roles,
  userRoles,
  users,
  projects,
} = require("../db/schema");
const emailService = require("./emailService");
const activityService = require("./activityService");
const logger = require("../config/logger");

// ─── Project Invitation ───────────────────────────────────────────────────────

/**
 * Creates a project invitation and sends the invite email.
 * Validates that no pending invite already exists for this project+email,
 * and that the user is not already a project member.
 */
const sendProjectInvitation = async (projectId, orgId, invitedBy, email) => {
  // Guard: user already a project member
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    const [isMember] = await db
      .select({ id: projectMembers.id })
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, existingUser.id)
        )
      )
      .limit(1);

    if (isMember) {
      const err = new Error("This user is already a project member");
      err.statusCode = 400;
      throw err;
    }
  }

  // Fetch project name + inviter name for the email
  const [project] = await db
    .select({ name: projects.name })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  const [inviter] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, invitedBy))
    .limit(1);

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Check for an existing pending invite — refresh it instead of rejecting
  const [existingPending] = await db
    .select({ id: invitations.id })
    .from(invitations)
    .where(
      and(
        eq(invitations.projectId, projectId),
        eq(invitations.invitedEmail, email),
        eq(invitations.status, "pending")
      )
    )
    .limit(1);

  let invitation;
  if (existingPending) {
    // Overwrite the stale pending record with a fresh token + expiry
    [invitation] = await db
      .update(invitations)
      .set({ token, expiresAt, invitedBy })
      .where(eq(invitations.id, existingPending.id))
      .returning();
  } else {
    // No pending invite (first-time, expired, or previously accepted/rejected)
    [invitation] = await db
      .insert(invitations)
      .values({
        organizationId: orgId,
        projectId,
        invitedEmail: email,
        invitedBy,
        token,
        status: "pending",
        expiresAt,
      })
      .returning();
  }

  // ── CASE 1: Existing user → grant membership immediately ──────────────────
  if (existingUser) {
    // Upsert org member — safe even if already a member
    await db
      .insert(organizationMembers)
      .values({ organizationId: orgId, userId: existingUser.id, role: "member" })
      .onConflictDoNothing();

    // Assign the Member system role so permission checks work
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
        .insert(userRoles)
        .values({ userId: existingUser.id, organizationId: orgId, roleId: memberRole.id })
        .onConflictDoNothing();
    }

    // Add as project member — unique index prevents duplicates
    await db
      .insert(projectMembers)
      .values({ projectId, userId: existingUser.id, role: "member" })
      .onConflictDoNothing();

    // Mark invitation as accepted since membership is granted immediately
    await db
      .update(invitations)
      .set({ status: "accepted" })
      .where(eq(invitations.id, invitation.id));

    logger.info({
      message: "Existing user granted immediate project membership",
      projectId,
      userId: existingUser.id,
      email,
    });
  }
  // CASE 2: Email not registered yet — invitation stays pending.
  // Membership will be granted at registration time (see authService.register).

  // Fire-and-forget email — never fail the request if email sending fails
  emailService
    .sendProjectInvitation({
      toEmail: email,
      inviterName: inviter?.name ?? "A team member",
      projectName: project?.name ?? "a project",
      inviteToken: token,
    })
    .catch((err) =>
      logger.error({ message: "Failed to send project invitation email", err: err.message })
    );

  activityService
    .log({
      orgId,
      projectId,
      actorId: invitedBy,
      action: "member_invited",
      metadata: { email, projectName: project?.name },
    })
    .catch((err) =>
      logger.error({ message: "Failed to log project invite activity", err })
    );

  logger.info({ message: "Project invitation created", projectId, invitedEmail: email });

  return invitation;
};

// ─── Public token info ────────────────────────────────────────────────────────

/**
 * Returns basic invitation info for a given token.
 * Used by the frontend accept page to determine the UX branch
 * (existing user vs new user, login vs register).
 * No auth required — only non-sensitive fields are returned.
 */
const getInvitationByToken = async (token) => {
  const now = new Date();

  const [invitation] = await db
    .select({
      id: invitations.id,
      invitedEmail: invitations.invitedEmail,
      status: invitations.status,
      expiresAt: invitations.expiresAt,
      projectId: invitations.projectId,
      organizationId: invitations.organizationId,
    })
    .from(invitations)
    .where(eq(invitations.token, token))
    .limit(1);

  if (!invitation) {
    const err = new Error("Invitation not found");
    err.statusCode = 404;
    throw err;
  }

  if (invitation.status !== "pending") {
    return { ...invitation, valid: false, reason: "already_processed" };
  }

  if (invitation.expiresAt < now) {
    return { ...invitation, valid: false, reason: "expired" };
  }

  return { ...invitation, valid: true };
};

module.exports = {
  sendProjectInvitation,
  getInvitationByToken,
};
