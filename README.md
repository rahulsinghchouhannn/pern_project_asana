# Asana — PERN Stack Boilerplate

A production-grade, scalable PERN stack boilerplate for Asana.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS v4 |
| State | Redux Toolkit |
| Backend | Node.js + Express |
| Database | PostgreSQL 16 + Drizzle ORM |
| Validation | Zod (backend only) |
| Logging | Winston |
| Testing | Vitest (frontend) + Jest (backend) |

## Module System

| Side | Module system | Rule |
|------|--------------|------|
| **Frontend** | ES Modules | `import`/`export` only — never `require()` |
| **Backend** | CommonJS | `require()`/`module.exports` only — never `import`/`export` |

## Quick Start

### Prerequisites
- Node.js 20 LTS
- PostgreSQL 16+

### Setup

```bash
# Clone and install
git clone https://github.com/rahulsinghchouhannn/pern_project_asana.git
cd pern_project_asana
npm install

# Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit backend/.env with your DATABASE_URL and JWT_SECRET

# Push schema to database
npm run db:push

# Run development servers
npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:5000  
Health check: http://localhost:5000/health

## Available Scripts

| Script | Description |
|--------|------------|
| `npm run dev` | Start frontend + backend concurrently |
| `npm run build` | Build frontend for production |
| `npm run lint` | Lint frontend and backend |
| `npm run test` | Run all tests |
| `npm run db:generate` | Generate Drizzle migrations from schema |
| `npm run db:push` | Apply migrations to database |
| `npm run db:seed` | Seed the database |

## State Management

**Global store** — app-wide data only:
- Authenticated user + session token
- Global theme, notifications

**`useState` in page component** — page-specific data:
- List data, filters, pagination, form state

Never push page-specific data into the Redux store.

## API Response Shape

All responses use a uniform shape:

```json
// Success
{ "success": true, "data": { ... }, "error": null }

// Error
{ "success": false, "data": null, "error": "Error message here" }
```

## Logging

Logs are written to `backend/logs/` in NDJSON format:
- `combined.log` — all levels
- `error.log` — errors only

```bash
# Tail logs in development
tail -f backend/logs/combined.log | jq .
```

## Database

Uses Drizzle ORM with PostgreSQL. **Never write raw SQL.**

```bash
# After modifying schema files:
npm run db:generate  # generate migration
npm run db:push      # apply to database
```

See [docs/database-guide.md](docs/database-guide.md) for full workflow.

## Validation

Zod schemas live in `backend/src/validators/`. All routes that accept body input use the `validateRequest` middleware. Controllers read from `req.validated` — never `req.body`.

See [docs/validation-guide.md](docs/validation-guide.md) for details.

## Documentation

| Doc | Contents |
|-----|---------|
| [project-structure.md](docs/project-structure.md) | Directory tree and key locations |
| [coding-standards.md](docs/coding-standards.md) | Module system, patterns, rules |
| [git-workflow.md](docs/git-workflow.md) | Branch strategy, commit conventions |
| [environment-setup.md](docs/environment-setup.md) | Local setup, DATABASE_URL, drizzle-kit |
| [scaling-guidelines.md](docs/scaling-guidelines.md) | Component splitting, service scaling |
| [state-management.md](docs/state-management.md) | Redux store vs useState decision guide |
| [logging-guide.md](docs/logging-guide.md) | Log format, file locations, tailing |
| [database-guide.md](docs/database-guide.md) | Drizzle schema, migration workflow |
| [validation-guide.md](docs/validation-guide.md) | Zod schemas, validateRequest pattern |

## Phase 2 Context (NOT IMPLEMENTED)

> `<PROJECT_DESCRIPTION_PLACEHOLDER>`
>
> Add your feature set description here. This boilerplate provides the foundation —
> Phase 2 will implement the product features specific to Asana.

## Contributing

1. Branch from `dev`: `git checkout -b feature/your-feature dev`
2. Follow [Conventional Commits](https://www.conventionalcommits.org/)
3. Ensure tests pass: `npm run test`
4. Ensure lint passes: `npm run lint`
5. Open PR to `dev`

## License

MIT
