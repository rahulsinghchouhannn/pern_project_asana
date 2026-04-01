# Logging Guide

## Library: Winston

The backend uses Winston for structured logging. Never use `console.log` in production code.

## Log Files

| File | Contents | Location |
|------|---------|----------|
| `combined.log` | All log levels (info, warn, error) | `backend/logs/combined.log` |
| `error.log` | Error level only | `backend/logs/error.log` |

The `backend/logs/` directory is:
- Auto-created at server startup (no manual setup needed)
- Listed in `.gitignore` (not committed to git)

## Log Format (NDJSON)

Each log entry is a single JSON line:

```json
{"level":"info","service":"asana-api","timestamp":"2024-01-01T12:00:00.000Z","message":{"method":"GET","path":"/api/users","statusCode":200,"duration":"3ms"}}
```

Fields:
- `level`: `info` | `warn` | `error`
- `service`: always `asana-api`
- `timestamp`: ISO 8601
- `message`: log payload (object or string)

## Using the Logger

```js
const logger = require("../config/logger");

// ✅ Correct
logger.info("Server started on port 5000");
logger.warn("Rate limit approaching for IP", { ip: "1.2.3.4" });
logger.error("Database connection failed", { error: err.message });

// ❌ Forbidden in production
console.log("Server started");
console.error("Something went wrong");
```

## Request Logging

Every API request is automatically logged by the `requestLogger` middleware:

```json
{"level":"info","service":"asana-api","timestamp":"...","message":{"method":"POST","path":"/api/auth/login","statusCode":200,"duration":"45ms"}}
```

## Tailing Logs in Development

```bash
# Tail all logs
tail -f backend/logs/combined.log

# Tail errors only
tail -f backend/logs/error.log

# Pretty-print with jq
tail -f backend/logs/combined.log | jq .

# Filter by level
tail -f backend/logs/combined.log | jq 'select(.level == "error")'
```

## Console Output in Development

When `NODE_ENV !== "production"`, logs also print to the console using Winston's simple format. This is configured automatically in `backend/src/config/logger.js`.
