const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { eq, and, gt } = require("drizzle-orm");
const { db } = require("../db");
const {
  users,
  refreshTokens,
  invitations,
  organizationMembers,
} = require("../db/schema");
const organizationService = require("./organizationService");
const logger = require("../config/logger");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const safeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  avatarUrl: user.avatarUrl,
  isEmailVerified: user.isEmailVerified,
  lastActiveOrgId: user.lastActiveOrgId,
  createdAt: user.createdAt,
});

// ─── Token generation ─────────────────────────────────────────────────────────

/**
 * Generates JWT access token (15 min) + random refresh token (7 days).
 * Stores refresh token in DB. JWT payload contains ONLY { userId, email }.
 */
const generateTokens = async (userId, email) => {
  const accessToken = jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const rawRefresh = crypto.randomBytes(64).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(refreshTokens).values({ userId, token: rawRefresh, expiresAt });

  return { accessToken, refreshToken: rawRefresh };
};

// ─── Auth operations ──────────────────────────────────────────────────────────

const register = async ({ name, email, password }) => {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    const err = new Error("Email already in use");
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash })
    .returning();

  // Create personal workspace and set as active org
  const org = await organizationService.createOrganization(user.id, {
    name: `${name}'s Workspace`,
  });

  await db
    .update(users)
    .set({ lastActiveOrgId: org.id, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  const { accessToken, refreshToken } = await generateTokens(user.id, user.email);

  logger.info({ message: "User registered", userId: user.id });

  return {
    user: { ...safeUser(user), lastActiveOrgId: org.id },
    accessToken,
    refreshToken,
  };
};

const login = async ({ email, password }) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user || !user.passwordHash) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  const { accessToken, refreshToken } = await generateTokens(user.id, user.email);
  const orgs = await organizationService.getUserOrganizations(user.id);

  logger.info({ message: "User logged in", userId: user.id });

  return {
    user: safeUser(user),
    accessToken,
    refreshToken,
    organizations: orgs,
  };
};

const requestMagicLink = async (email) => {
  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Don't reveal whether the email exists
  if (!user) return { sent: true };

  // Find any org the user belongs to (required for invitation FK)
  const [membership] = await db
    .select({ organizationId: organizationMembers.organizationId })
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, user.id))
    .limit(1);

  if (!membership) return { sent: true };

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db.insert(invitations).values({
    organizationId: membership.organizationId,
    invitedEmail: email,
    invitedBy: user.id,
    token,
    status: "pending",
    expiresAt,
  });

  logger.info({ message: "Magic link requested", email });

  // Production: send email with link. For now, return token directly.
  return { sent: true, token };
};

const verifyMagicLink = async (token) => {
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
    const err = new Error("Invalid or expired magic link");
    err.statusCode = 400;
    throw err;
  }

  await db
    .update(invitations)
    .set({ status: "accepted" })
    .where(eq(invitations.id, invitation.id));

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, invitation.invitedEmail))
    .limit(1);

  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const { accessToken, refreshToken } = await generateTokens(user.id, user.email);
  const orgs = await organizationService.getUserOrganizations(user.id);

  logger.info({ message: "Magic link verified", userId: user.id });

  return {
    user: safeUser(user),
    accessToken,
    refreshToken,
    organizations: orgs,
  };
};

const refreshAccessToken = async (rawRefreshToken) => {
  const now = new Date();

  const [stored] = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.token, rawRefreshToken),
        gt(refreshTokens.expiresAt, now)
      )
    )
    .limit(1);

  if (!stored) {
    const err = new Error("Invalid or expired refresh token");
    err.statusCode = 401;
    throw err;
  }

  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, stored.userId))
    .limit(1);

  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  return { accessToken };
};

const logout = async (rawRefreshToken) => {
  await db
    .delete(refreshTokens)
    .where(eq(refreshTokens.token, rawRefreshToken));

  logger.info({ message: "Refresh token deleted on logout" });
};

module.exports = {
  register,
  login,
  requestMagicLink,
  verifyMagicLink,
  refreshAccessToken,
  logout,
  generateTokens,
};
