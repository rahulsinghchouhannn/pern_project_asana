const { pgTable, uuid, varchar, jsonb, timestamp } = require("drizzle-orm/pg-core");
const { users } = require("./users");
const { organizations } = require("./organizations");

const activityLogs = pgTable("activity_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  projectId: uuid("project_id").references(() => require("./projects").projects.id),
  taskId: uuid("task_id").references(() => require("./tasks").tasks.id),
  actorId: uuid("actor_id")
    .notNull()
    .references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

module.exports = { activityLogs };
