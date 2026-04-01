const { db } = require("../db");
const { users } = require("../db/schema");
const { eq } = require("drizzle-orm");

const getUserById = async (id) => {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      isEmailVerified: users.isEmailVerified,
      lastActiveOrgId: users.lastActiveOrgId,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user ?? null;
};

const getAllUsers = async ({ limit = 10, offset = 0 } = {}) => {
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
    })
    .from(users)
    .limit(limit)
    .offset(offset);

  return result;
};

const updateUser = async (id, updates) => {
  const [updated] = await db
    .update(users)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      updatedAt: users.updatedAt,
    });

  return updated ?? null;
};

module.exports = { getUserById, getAllUsers, updateUser };
