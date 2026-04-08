const {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
} = require("drizzle-orm/pg-core");
const { projects } = require("./projects");
const { organizations } = require("./organizations");
const { users } = require("./users");
const { projectStatuses } = require("./projectStatuses");
const { projectSections } = require("./projectSections");

const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  parentTaskId: uuid("parent_task_id").references(() => tasks.id, {
    onDelete: "cascade",
  }),
  statusId: uuid("status_id")
    .notNull()
    .references(() => projectStatuses.id),
  sectionId: uuid("section_id").references(() => projectSections.id, {
    onDelete: "set null",
  }),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  priority: varchar("priority", { length: 50 }).default("none"),
  startDate: timestamp("start_date"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  taskType: varchar("task_type", { length: 50 }).notNull().default("task"),
  isCompleted: boolean("is_completed").default(false),
  position: integer("position").notNull().default(0),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

module.exports = { tasks };
