const { pgTable, uuid, unique } = require("drizzle-orm/pg-core");
const { users } = require("./users");
const { organizations } = require("./organizations");
const { roles } = require("./roles");

const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id),
  },
  (t) => [unique().on(t.userId, t.organizationId)]
);

module.exports = { userRoles };
