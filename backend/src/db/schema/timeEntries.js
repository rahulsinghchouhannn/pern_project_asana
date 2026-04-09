const { pgTable, uuid, integer, timestamp, varchar } = require("drizzle-orm/pg-core");
const { users } = require("./users");

const timeEntries = pgTable("time_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => require("./tasks").tasks.id, { onDelete: "cascade" }),
  customFieldId: uuid("custom_field_id")
    .notNull()
    .references(() => require("./customFields").customFields.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  durationMinutes: integer("duration_minutes").notNull(),
  loggedAt: timestamp("logged_at").defaultNow().notNull(),
  source: varchar("source", { length: 20 }).notNull().default("manual"),
});

module.exports = { timeEntries };
