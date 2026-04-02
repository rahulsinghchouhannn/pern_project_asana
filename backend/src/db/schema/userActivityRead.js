const { pgTable, uuid, timestamp, unique } = require("drizzle-orm/pg-core");
const { users } = require("./users");

const userActivityRead = pgTable(
  "user_activity_read",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    activityLogId: uuid("activity_log_id")
      .notNull()
      .references(() => require("./activityLogs").activityLogs.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at").defaultNow(),
  },
  (t) => ({
    uniqUserActivity: unique().on(t.userId, t.activityLogId),
  })
);

module.exports = { userActivityRead };
