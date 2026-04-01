# Coding Standards

## Module System (MANDATORY — Never Mix)

### Frontend → ES Modules
```js
// ✅ Correct
import React from "react";
import { useSelector } from "react-redux";
export default MyComponent;
export { formatDate };

// ❌ Forbidden
const React = require("react");
module.exports = MyComponent;
```

### Backend → CommonJS
```js
// ✅ Correct
const express = require("express");
module.exports = router;

// ❌ Forbidden
import express from "express";
export default router;
// ❌ Never set "type":"module" in backend package.json
```

## Response Shapes

Every API response MUST use `successResponse` or `errorResponse` utilities:

```js
// ✅ Correct
const successResponse = require("../utils/successResponse");
const errorResponse = require("../utils/errorResponse");

res.status(200).json(successResponse(user));
res.status(400).json(errorResponse("Invalid input"));

// ❌ Forbidden — never construct manually
res.json({ success: true, data: user, error: null });
```

## Drizzle Query Patterns

```js
// ✅ Correct — use Drizzle query builders
const { eq } = require("drizzle-orm");
const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);

// ❌ Forbidden — no raw SQL
pool.query(`SELECT * FROM users WHERE id = '${id}'`);
db.execute(sql`SELECT * FROM users`);
```

## Zod Validator Rules

- All schemas live in `backend/src/validators/` — nowhere else
- Applied via `validateRequest` middleware — never inline
- Controllers read `req.validated` — never `req.body`

```js
// ✅ Correct route
router.post("/register", validateRequest(registerSchema), authController.register);

// ✅ Correct controller
const register = async (req, res) => {
  const user = await authService.register(req.validated); // ← req.validated
  res.status(201).json(successResponse(user));
};

// ❌ Forbidden
router.post("/register", (req, res) => {
  const data = registerSchema.parse(req.body); // ← inline schema use
});
```

## UI Component Rules

```jsx
// ✅ Correct — use ui/ components
import Button from "@/components/ui/Button";
<Button variant="primary" onClick={handleSubmit}>Submit</Button>

// ❌ Forbidden — raw HTML with inline styles
<button className="bg-blue-500 px-4 py-2 rounded">Submit</button>
```

## Layout Rules

```jsx
// ✅ Correct — wrap with Layout via Router
<Route element={<Layout />}>
  <Route path="/" element={<HomePage />} />
</Route>

// ❌ Forbidden — per-page wrapping
const HomePage = () => (
  <>
    <Navbar />
    <main>...</main>
    <Footer />
  </>
);
```

## Component Size Limit

Maximum 1500 lines per component file. If exceeded, split into sub-components:
```
components/Dashboard/
  Dashboard.jsx
  DashboardHeader.jsx
  DashboardSidebar.jsx
```
