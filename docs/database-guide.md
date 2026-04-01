# Database Guide

## Stack: PostgreSQL + Drizzle ORM

- **Database**: PostgreSQL 16
- **ORM**: Drizzle ORM (node-postgres driver)
- **Migration tool**: drizzle-kit
- **Schema location**: `backend/src/db/schema/`

## Schema Conventions

### One file per domain
```
db/schema/
  users.js       ← users table
  tasks.js       ← tasks table (add in Phase 2)
  index.js       ← re-exports all tables
```

### Required columns for every table
```js
id:        uuid("id").defaultRandom().primaryKey()
createdAt: timestamp("created_at").defaultNow().notNull()
updatedAt: timestamp("updated_at").defaultNow().notNull()
```

### Example table definition
```js
const { pgTable, uuid, varchar, timestamp } = require("drizzle-orm/pg-core");

const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  userId: uuid("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

module.exports = { tasks };
```

### Re-export from index.js
```js
// db/schema/index.js
const { users } = require("./users");
const { tasks } = require("./tasks");
module.exports = { users, tasks };
```

## Migration Workflow

**NEVER hand-write SQL migration files.** Always use drizzle-kit.

```bash
# 1. Edit schema file(s) in backend/src/db/schema/
# 2. Generate migration
npm run db:generate --workspace=backend

# 3. Review the generated file in backend/src/db/migrations/
# 4. Apply to database
npm run db:push --workspace=backend
```

### Adding a new table (end-to-end)

1. Create `backend/src/db/schema/tasks.js`
2. Export from `backend/src/db/schema/index.js`
3. Run `npm run db:generate --workspace=backend`
4. Review migration in `backend/src/db/migrations/`
5. Run `npm run db:push --workspace=backend`
6. Create `backend/src/services/taskService.js`
7. Create `backend/src/validators/taskValidator.js`
8. Create `backend/src/controllers/taskController.js`
9. Create `backend/src/routes/taskRoutes.js`
10. Mount in `backend/src/routes/index.js`

## Query Patterns

```js
// SELECT with condition
const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);

// INSERT returning
const [created] = await db.insert(tasks).values(data).returning();

// UPDATE
await db.update(tasks).set({ title: "new" }).where(eq(tasks.id, id));

// DELETE
await db.delete(tasks).where(eq(tasks.id, id));

// Paginated list
const list = await db.select().from(tasks).limit(10).offset(0);

// Transaction
await db.transaction(async (tx) => {
  const [task] = await tx.insert(tasks).values(taskData).returning();
  await tx.insert(taskActivities).values({ taskId: task.id, action: "created" });
});
```

## Rules

- All DB access goes through the service layer — never in controllers or middleware
- Always use `.limit()` on list queries
- Use Drizzle's `eq()`, `and()`, `or()`, `inArray()` for conditions
- Never return raw DB objects — map to response shape in service
- `pool.query()` raw SQL is forbidden
