const {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
} = require("drizzle-orm/pg-core");
const { users } = require("./users");
const { organizations } = require("./organizations");

const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#6C63FF"),
  isPrivate: boolean("is_private").default(false),
  isArchived: boolean("is_archived").default(false),
  isCompleted: boolean("is_completed").default(false),
  defaultView: varchar("default_view", { length: 50 }).default("list"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

module.exports = { projects };
