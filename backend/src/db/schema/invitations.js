const { pgTable, uuid, varchar, timestamp } = require("drizzle-orm/pg-core");
const { users } = require("./users");
const { organizations } = require("./organizations");
const { projects } = require("./projects");

const invitations = pgTable("invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" }),
  invitedEmail: varchar("invited_email", { length: 255 }).notNull(),
  invitedBy: uuid("invited_by")
    .notNull()
    .references(() => users.id),
  token: varchar("token", { length: 500 }).notNull().unique(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

module.exports = { invitations };
