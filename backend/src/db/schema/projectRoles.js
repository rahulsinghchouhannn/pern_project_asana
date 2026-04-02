const { pgTable, uuid, unique } = require("drizzle-orm/pg-core");
const { users } = require("./users");
const { projects } = require("./projects");
const { roles } = require("./roles");

const projectRoles = pgTable(
  "project_roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id),
  },
  (t) => [unique().on(t.userId, t.projectId)]
);

module.exports = { projectRoles };
