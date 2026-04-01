const {
  pgTable,
  uuid,
  varchar,
  timestamp,
  uniqueIndex,
} = require("drizzle-orm/pg-core");
const { users } = require("./users");
const { organizations } = require("./organizations");

const organizationMembers = pgTable(
  "organization_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 50 }).notNull().default("member"),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (t) => ({
    uniqueOrgUser: uniqueIndex("org_member_unique_idx").on(
      t.organizationId,
      t.userId
    ),
  })
);

module.exports = { organizationMembers };
