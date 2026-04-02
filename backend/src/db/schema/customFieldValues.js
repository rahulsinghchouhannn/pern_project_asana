const {
  pgTable,
  uuid,
  text,
  varchar,
  numeric,
  timestamp,
  uniqueIndex,
} = require("drizzle-orm/pg-core");
const { users } = require("./users");

const customFieldValues = pgTable(
  "custom_field_values",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => require("./tasks").tasks.id, { onDelete: "cascade" }),
    customFieldId: uuid("custom_field_id")
      .notNull()
      .references(() => require("./customFields").customFields.id, { onDelete: "cascade" }),
    valueText: text("value_text"),
    valueNumber: numeric("value_number"),
    valueDate: timestamp("value_date"),
    valueUserId: uuid("value_user_id").references(() => users.id),
    valueOption: varchar("value_option", { length: 255 }),
  },
  (t) => ({
    uniqueTaskField: uniqueIndex("custom_field_value_unique_idx").on(
      t.taskId,
      t.customFieldId
    ),
  })
);

module.exports = { customFieldValues };
