const {
  pgTable,
  uuid,
  timestamp,
  unique,
} = require("drizzle-orm/pg-core");
const { users } = require("./users");

// tasks is required lazily to avoid circular dependency
const taskAssignees = pgTable(
  "task_assignees",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => require("./tasks").tasks.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
    assignedBy: uuid("assigned_by").references(() => users.id),
  },
  (t) => [unique().on(t.taskId, t.userId)]
);

module.exports = { taskAssignees };
