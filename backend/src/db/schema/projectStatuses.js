const {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
} = require("drizzle-orm/pg-core");
const { projects } = require("./projects");

const projectStatuses = pgTable("project_statuses", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 7 }).notNull().default("#E0E0E0"),
  position: integer("position").notNull().default(0),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

module.exports = { projectStatuses };
