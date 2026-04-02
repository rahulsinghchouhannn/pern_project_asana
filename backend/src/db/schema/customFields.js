const {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
} = require("drizzle-orm/pg-core");
const { projects } = require("./projects");
const { users } = require("./users");

const customFields = pgTable("custom_fields", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  options: jsonb("options"),
  position: integer("position").notNull().default(0),
  isRequired: boolean("is_required").default(false),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

module.exports = { customFields };
