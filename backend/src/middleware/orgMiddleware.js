const { eq, and } = require("drizzle-orm");
const { db } = require("../db");
const { organizationMembers } = require("../db/schema");
const errorResponse = require("../utils/errorResponse");

/**
 * Reads x-org-id header, verifies req.user is a member of that org,
 * and attaches req.org = { orgId, role }.
 */
const orgMiddleware = async (req, res, next) => {
  const orgId = req.headers["x-org-id"];

  if (!orgId) {
    return res.status(400).json(errorResponse("x-org-id header is required"));
  }

  try {
    const [membership] = await db
      .select({ role: organizationMembers.role })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, orgId),
          eq(organizationMembers.userId, req.user.userId)
        )
      )
      .limit(1);

    if (!membership) {
      return res
        .status(403)
        .json(errorResponse("You are not a member of this organization"));
    }

    req.org = { orgId, role: membership.role };
    next();
  } catch {
    return res.status(403).json(errorResponse("Organization access denied"));
  }
};

/**
 * Factory: only allows members with role in allowedRoles.
 * Usage: requireOrgRole(["owner", "admin"])
 */
const requireOrgRole = (allowedRoles) => (req, res, next) => {
  if (!req.org) {
    return res.status(403).json(errorResponse("Organization context missing"));
  }
  if (!allowedRoles.includes(req.org.role)) {
    return res
      .status(403)
      .json(errorResponse("Insufficient role for this action"));
  }
  next();
};

module.exports = { orgMiddleware, requireOrgRole };
