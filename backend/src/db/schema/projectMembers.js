const {
  pgTable,
  uuid,
  varchar,
  timestamp,
  uniqueIndex,
} = require("drizzle-orm/pg-core");
const { users } = require("./users");
const { projects } = require("./projects");

const projectMembers = pgTable(
  "project_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 50 }).notNull().default("member"),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (t) => ({
    uniqueProjectUser: uniqueIndex("project_member_unique_idx").on(
      t.projectId,
      t.userId
    ),
  })
);

module.exports = { projectMembers };
