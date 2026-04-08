const {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
} = require("drizzle-orm/pg-core");
const { projects } = require("./projects");
const { organizations } = require("./organizations");

const projectSections = pgTable("project_sections", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: varchar("name", { length: 255 }).notNull().default("Untitled section"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

module.exports = { projectSections };
