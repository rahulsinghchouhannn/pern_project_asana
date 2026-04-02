const {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
} = require("drizzle-orm/pg-core");
const { users } = require("./users");

const taskAttachments = pgTable("task_attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => require("./tasks").tasks.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: varchar("file_url", { length: 500 }).notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

module.exports = { taskAttachments };
