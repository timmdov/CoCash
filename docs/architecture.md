# Architecture and engineering decisions

React/TypeScript → HTTP `/api/*` → FastAPI validation → SQLite repository / pure Python forecast.

- `backend/app/domain.py`: calendar clamping, aggregation, 30 daily balances and warnings. No I/O, randomness or model calls.
- `backend/app/db.py`: schema, transaction-scoped connections, consistent read snapshot. Database checks protect positive amounts, valid transaction types, nonnegative buffer and days 1–31.
- `backend/app/main.py`: typed request models, API routes and injectable clock. Real clock uses Europe/Budapest. `/docs` exposes the API contract.
- `frontend/src/api.ts`: request/response types and field-specific server errors.
- `frontend/src/App.tsx`: forms, summaries, chart, accessible daily table, history and simulation. All forecast calculations come from the backend.

## Clarified interpretations (ACs unchanged)

The current balance is the starting balance before today's scheduled entries. Today’s entries are applied exactly once; past entries remain in history and never affect the forecast. This assumes the user does not record a payment both as already reflected in the starting balance and as a scheduled entry today.

Recurring expenses are active monthly schedules with no start/end date, consistent with the specification. A manual entry and recurring expense are distinct; there is no automatic reconciliation. If a 30-day period spans a short February, a monthly payment can occur twice within the window.

Initial profile is 0 HUF balance / 0 HUF buffer. Negative balances are allowed, negative buffers are not. An optional UI description is implemented as a required short label for readable records. Individual numeric inputs are limited to 1 trillion HUF to avoid accidental extreme values in a personal-finance app; integer HUF is required. Python aggregates are exact integers, while the browser uses JS numbers: extraordinarily large aggregate totals above 2^53−1 are outside intended use.

Simulation reads a consistent snapshot, adds one expense to the in-memory collection and calculates again. There are no insert/update calls in the simulation endpoint. A saved change clears the preview so it cannot silently remain stale.

The production frontend is served by FastAPI after building; Vite development proxies `/api` to FastAPI. This keeps browser requests same-origin. The app is single-user and local, bound to 127.0.0.1. It has no authentication, external AI, banking integration, edit/delete workflows or multi-user support. Keep database files out of Git.

## References consulted

- [FastAPI lifespan testing](https://fastapi.tiangolo.com/advanced/testing-events/): TestClient context managers run startup/shutdown, so tests exercise database initialization.
- [Vite proxy configuration](https://vite.dev/config/server-options/#server-proxy): development proxy keeps API URLs consistent with production.

## Later change request

The instructor has not issued it. Start from the `submission-2-v1` tag once supplied, identify affected ACs and code, add regression tests and verify database preservation. Do not invent a change now.
