# CoCash development rules

- Specification.md in the parent directory defines AC1–AC8; do not silently change them.
- React/TypeScript frontend, FastAPI backend, SQLite persistence. No AI runtime or banking integration.
- Keep all financial calculations in pure Python domain functions, using integer HUF and an injected date. Today is Europe/Budapest.
- Forecast exactly 30 days including today; aggregate same-day entries before testing balance < buffer. Clamp monthly expenses to month end. Exclude past transactions.
- Validate at the API boundary and constrain stored data. Invalid requests and simulations must not mutate records.
- Test domain rules and API persistence with isolated temporary databases. Add frontend integration checks for important workflows.
- Before recording a milestone, run pytest, Ruff, TypeScript checking, frontend tests and production build. Record actual output; never invent verification or tool-comparison evidence.
- Preserve a labelled first-working-version Git baseline. Do not publish without the user's authorization; do not invent the later instructor change request.
- Document technical decisions, evidence and limitations. Student endorsement and independent second-tool work must remain explicitly pending until supplied.
