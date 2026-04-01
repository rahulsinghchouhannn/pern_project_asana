# Git Workflow

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `stagging` | Default/production branch — deploys automatically |
| `dev` | Integration branch for completed features |
| `feature/*` | New features (e.g., `feature/task-management`) |
| `hotfix/*` | Production bug fixes (e.g., `hotfix/auth-token-expiry`) |

## Commit Convention (Conventional Commits)

Format: `<type>(<scope>): <description>`

| Type | When to use |
|------|------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Tooling, config, dependency updates |
| `docs` | Documentation only |
| `refactor` | Code restructure with no behavior change |
| `test` | Adding or updating tests |
| `style` | Formatting, no logic change |

Examples:
```
feat(auth): add JWT refresh token endpoint
fix(users): handle null user in getMe controller
chore: update drizzle-orm to v0.31
docs: add database guide
test(auth): add expired token failure case
```

## PR Workflow

1. Create branch from `dev`: `git checkout -b feature/your-feature dev`
2. Develop with frequent commits
3. Push branch and open PR → `dev`
4. CI must pass before merge
5. Squash merge into `dev`
6. When `dev` is stable → PR to `stagging` triggers CD

## Husky Pre-commit Hook

Runs automatically on every commit:
- ESLint fix on staged files
- Prettier format on staged files

If the hook fails, fix the linting errors and re-commit.

## Initial Setup

```bash
git init
git branch -M stagging
git remote add origin https://github.com/rahulsinghchouhannn/pern_project_asana.git
git push -u origin stagging
```
