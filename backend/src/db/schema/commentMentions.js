const { pgTable, uuid, timestamp } = require("drizzle-orm/pg-core");
const { users } = require("./users");

const commentMentions = pgTable("comment_mentions", {
  id: uuid("id").defaultRandom().primaryKey(),
  commentId: uuid("comment_id")
    .notNull()
    .references(() => require("./comments").comments.id, { onDelete: "cascade" }),
  mentionedUserId: uuid("mentioned_user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

module.exports = { commentMentions };
