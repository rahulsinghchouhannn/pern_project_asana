const {
  pgTable,
  uuid,
  varchar,
} = require("drizzle-orm/pg-core");

const taskTags = pgTable("task_tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => require("./tasks").tasks.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 7 }).default("#E0E0E0"),
});

module.exports = { taskTags };
