const { pgTable, uuid, varchar, unique } = require("drizzle-orm/pg-core");
const { roles } = require("./roles");

const rolePermissions = pgTable(
  "role_permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permission: varchar("permission", { length: 100 }).notNull(),
  },
  (t) => [unique().on(t.roleId, t.permission)]
);

module.exports = { rolePermissions };
