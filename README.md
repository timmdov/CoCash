# CoCash — your next 30 days

A local, single-user cash-flow planner built with **React + TypeScript, FastAPI and SQLite**. Record a starting balance, income, expenses and monthly payments; inspect a 30-day forecast and simulate a purchase without saving it. All calculations use deterministic Python and integer HUF. **No Ollama, external AI API, banking connection or API key is needed.**

## Planned improvements — not implemented yet

The following additions are planned beyond the original AC1–AC8 specification. The current application and setup instructions below describe the existing version; none of these planned features is available yet.

1. **Edit and delete transactions.** Correct descriptions, amounts, dates and income/expense types. Recalculate forecasts after saved changes, and ask for confirmation before deletion.
2. **Manage recurring expenses.** Edit descriptions, amounts and payment days; pause/resume schedules; and delete schedules with confirmation. Paused schedules remain stored but are excluded from forecasts.
3. **Search and filter transactions.** Search descriptions and filter by income/expense type and date range. Filters affect only the displayed transaction list, never the forecast calculations.
4. **Agentic AI planning assistant using the hosted Google Gemini API.** Answer questions such as “Can I afford an 85,000 HUF purchase, and when within the next 30 days?” The assistant will select and call read-only application tools to inspect the profile and forecast, simulate purchases and compare dates, then explain the calculated results. Python will continue to perform all financial calculations. The agent will not create, edit or delete financial records. Show the tools used and their results, and handle missing configuration or model-service failures without preventing normal app use.

For the planned Gemini integration, keep the API key on the backend and out of source control and browser code. Explain in the interface that submitted questions and the financial context needed to answer them will be sent to Google. The exact model and configuration remain to be selected; the current version needs no API key.

Implementation work will include tests for the new workflows, regression checks for AC1–AC8, and verification that any database migration preserves existing records. Update setup instructions and verification results after implementation, and document the expanded scope in the specification for instructor review. Preserve `submission-2-v1` as the original baseline. These planned additions are separate from the instructor's later change request and do not complete the independent two-tool comparison requirement.

## Quick start

Requirements: Python 3.13, Node.js 22.13 or newer compatible 22.x, npm 10. Run from this repository's root. These versions were used for verification on macOS. Network is needed to install packages, not for normal app operation.

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.lock.txt
npm ci --prefix frontend
npm run build --prefix frontend
.venv/bin/uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

Open **http://127.0.0.1:8000**. API documentation: http://127.0.0.1:8000/docs. Stop with Ctrl+C; run the last command again to restart. Existing records survive. The first launch creates `data/cocash.sqlite3`, ignored by Git. `COCASH_DB=/absolute/path/file.sqlite3` selects another database. Use a separate file for demos; do not delete your real database to reset tests.

The app starts empty, with balance/buffer 0. Save your current balance **before today's scheduled entries**, then add entries. Dates are based on Europe/Budapest. Past transactions remain in history and do not affect the forecast. Monthly day 31 falls on the last day in shorter months. Entries and monthly schedules are separate; avoid manually duplicating the same planned payment. Simulations only change the preview; “Back to saved forecast” exits the preview.

## Development

Terminal 1:

```sh
.venv/bin/uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```

Terminal 2:

```sh
npm run dev --prefix frontend
```

Open the Vite URL (normally http://127.0.0.1:5173). `/api` is proxied to port 8000. Rebuild and restart the backend after production frontend changes. No environment secrets are required.

## Verification

```sh
.venv/bin/pytest -q
.venv/bin/ruff check backend comparison scripts
.venv/bin/ruff format --check backend comparison scripts
npm test --prefix frontend
npm run typecheck --prefix frontend
npm run build --prefix frontend
.venv/bin/python scripts/defect_demo.py
.venv/bin/python scripts/http_smoke.py
```

The smoke script requires permission to bind localhost sockets and a built frontend. It starts and stops its own server using a temporary database, exercises HTTP routes/assets and restarts the actual server process. Normal pytest tests never use your application database. The defect script intentionally runs a known faulty implementation, expects failures, then verifies production passes. It exits successfully only when both outcomes match expectations.

See [verification and AC traceability](docs/verification.md) and retained logs in [evidence](evidence/). Frontend component tests use mocked HTTP responses; they are not a substitute for a real browser walkthrough. Browser verification limitations are explicitly recorded.

## Structure and evidence

- [Specification](docs/specification.md): portable copy of supplied behavior; duplicate narrative condensed to meet the 4,000-character cap, AC1–AC8 unchanged.
- [Architecture](docs/architecture.md): data flow and interpretations; domain calculations in `backend/app/domain.py`, persistence in `db.py`, HTTP in `main.py`.
- [AI development record](docs/ai-use.md): three actual technical decisions, verification links, and student-review placeholders.
- [Second-tool brief](comparison/SECOND_TOOL_BRIEF.md): identical evaluation conditions for a genuinely independent implementation; comparison still pending.
- [Repository instructions](AGENTS.md): conventions actually used during implementation.
- [Milestone checklist](docs/submission-2.md): first-working-version handoff and later final-submission requirements.

## Milestone status and limits

This prepares **submission 2 / first working version**. Local Git history and tag `submission-2-v1` preserve the baseline. **No public GitHub repository has been created or published**; publication requires the student's authorization. Instructor approval of the original topic and the exact Moodle deadline must be confirmed by the student.

Final-submission work still requires the real second-tool comparison, the student's review of AI decisions, and the later instructor-issued change request. Nothing here claims those are complete. No invented defect discovery or personal student decisions are recorded.

Single-user local scope intentionally excludes authentication, edit/delete features, bank integration, uncertain-income prediction and schedule reconciliation. Back up the SQLite file while the application is stopped. Individual inputs are limited to ±1 trillion HUF (buffer nonnegative, expenses/income positive); extremely large aggregate totals beyond JavaScript's exact integer range are outside intended use. The interface includes responsive CSS, labels and keyboard focus styling; mobile layout and full visual/accessibility QA still require the manual checks in `docs/verification.md`.
