# Scaling Guidelines

## Component File Size Limit

**Maximum: 1500 lines per component file.**

When a component reaches or exceeds 1500 lines, split it immediately into sub-components using the same-name subfolder pattern.

## Splitting Strategy

### Before (single file — too large)
```
components/
  Dashboard.jsx  ← 2000 lines ❌
```

### After (split into subfolder)
```
components/
  Dashboard/
    Dashboard.jsx         ← main component, imports sub-components
    DashboardHeader.jsx   ← header section
    DashboardSidebar.jsx  ← sidebar section
    DashboardTable.jsx    ← data table section
```

### Naming Rules
- Subfolder name = component name (PascalCase)
- Main file imports and composes sub-components
- Sub-components live in the same folder
- Each sub-component has a single clear responsibility

## When to Split

Split when:
- File approaches 1500 lines
- A section has independent state/logic
- A section could be reused elsewhere
- The component renders distinct UI regions

Do NOT split:
- Prematurely (under ~500 lines)
- Just to reduce file count
- When sub-components have no independent meaning

## Service Layer Scaling

When a service file grows large, split by subdomain:
```
services/
  auth/
    authService.js
    tokenService.js
  tasks/
    taskService.js
    taskCommentService.js
```

## Route Scaling

Group routes by feature version or domain:
```
routes/
  v1/
    authRoutes.js
    taskRoutes.js
    userRoutes.js
  index.js  ← mounts /v1 prefix
```

## Store Scaling (Redux)

Add new slices per feature — never add feature-specific state to `appSlice`:
```
store/
  slices/
    authSlice.js
    appSlice.js
    taskSlice.js      ← add per-feature
    projectSlice.js
```
