const {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
} = require("drizzle-orm/pg-core");
const { users } = require("./users");

const taskHistory = pgTable("task_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => require("./tasks").tasks.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  fromValue: text("from_value"),
  toValue: text("to_value"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

module.exports = { taskHistory };
