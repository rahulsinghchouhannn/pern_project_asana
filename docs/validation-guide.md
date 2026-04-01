# Validation Guide

## Library: Zod (backend only)

Zod is used exclusively on the backend. It is NOT installed in the frontend.

## Schema Location

ALL Zod schemas live in `backend/src/validators/`. Never define them anywhere else.

```
validators/
  authValidator.js    ← registerSchema, loginSchema, refreshTokenSchema
  userValidator.js    ← updateProfileSchema, changePasswordSchema
  index.js            ← re-exports all schemas
```

## Creating a Validator

```js
// backend/src/validators/taskValidator.js
const { z } = require("zod");

const createTaskSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }).max(255),
  description: z.string().max(1000).optional(),
  dueDate: z.string().datetime({ message: "Invalid date format" }).optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
});

module.exports = { createTaskSchema, updateTaskSchema };
```

Re-export in `validators/index.js`:
```js
const taskValidators = require("./taskValidator");
module.exports = { ...taskValidators, ...require("./authValidator"), ... };
```

## Using validateRequest Middleware

```js
// In route file
const { validateRequest } = require("../middleware/validateRequest");
const { createTaskSchema } = require("../validators/taskValidator");

router.post("/", authMiddleware, validateRequest(createTaskSchema), taskController.create);

// Validate params
router.get("/:id", validateRequest(idParamSchema, "params"), taskController.getById);

// Validate query
router.get("/", validateRequest(paginationSchema, "query"), taskController.list);
```

## The req.validated Pattern

After `validateRequest` runs successfully, parsed data is attached to `req.validated`.
Controllers MUST read from `req.validated` — never from `req.body` directly.

```js
// ✅ Correct controller
const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.create(req.user.id, req.validated);
  res.status(201).json(successResponse(task));
});

// ❌ Forbidden
const createTask = async (req, res) => {
  const { title } = req.body;  // bypasses validation
};
```

## Error Response Format

When validation fails, `validateRequest` returns:
```json
{
  "success": false,
  "data": null,
  "error": "Title is required, Description must be at most 1000 characters"
}
```

Multiple errors are joined with `, `. The HTTP status is always `400`.

## Rules

- Never install zod in the frontend
- Never define Zod schemas inside controllers, services, routes, or middleware
- Never call `.parse()` directly in routes — always use `validateRequest` middleware
- Always export plain schema objects (not pre-called `.parse()` results)
