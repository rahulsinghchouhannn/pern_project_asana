# Environment Setup

## Prerequisites

- Node.js 20 LTS ([nvm](https://github.com/nvm-sh/nvm) recommended)
- PostgreSQL 16+

## Using nvm

```bash
nvm install 20
nvm use 20
# Verify
node --version  # v20.x.x
```

## PostgreSQL Setup (Local)

### Option 1: Native install
```bash
# macOS
brew install postgresql@16
brew services start postgresql@16

# Ubuntu/Debian
sudo apt install postgresql-16
sudo systemctl start postgresql
```

### Option 2: Docker (single container, not full stack)
```bash
docker run -d \
  --name asana-postgres \
  -e POSTGRES_USER=asana \
  -e POSTGRES_PASSWORD=asana_password \
  -e POSTGRES_DB=asana_dev \
  -p 5432:5432 \
  postgres:16-alpine
```

### Create Database
```sql
CREATE USER asana WITH PASSWORD 'asana_password';
CREATE DATABASE asana_dev OWNER asana;
GRANT ALL PRIVILEGES ON DATABASE asana_dev TO asana;
```

## Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL=postgresql://asana:asana_password@localhost:5432/asana_dev
NODE_ENV=development
PORT=5000
JWT_SECRET=your-very-long-random-secret-here
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

## Frontend Environment

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:
```
VITE_API_URL=http://localhost:5000/api
```

## Drizzle Kit Usage

```bash
# Generate migration files from schema changes
npm run db:generate --workspace=backend

# Apply migrations to database
npm run db:push --workspace=backend

# Open Drizzle Studio (GUI for DB inspection)
npm run db:studio --workspace=backend

# Seed the database
npm run db:seed --workspace=backend
```

**IMPORTANT**: Always run `db:generate` after modifying any schema file in `backend/src/db/schema/`. Review the generated migration before running `db:push`.

## Running the Project

```bash
# Install all dependencies (from root)
npm install

# Run both frontend and backend
npm run dev

# Frontend only (http://localhost:5173)
npm run dev --workspace=frontend

# Backend only (http://localhost:5000)
npm run dev --workspace=backend
```
