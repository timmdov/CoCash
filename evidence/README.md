# Recorded execution evidence

These logs were produced by commands in this development session on 11 November 2026 (Europe/Budapest), not written as hypothetical results. Re-running commands replaces logs where explicit redirection is used. Timings and absolute paths are environment-specific.

Environment: macOS arm64, Python 3.13, Node 22.13.1, npm 10.9.2. Dependency sets are recorded in `backend/requirements.lock.txt` and `frontend/package-lock.json`.

| File | Command / meaning |
|---|---|
| backend-tests.txt | `.venv/bin/pytest -q`: 33 passing tests |
| frontend-tests.txt | `npm test --prefix frontend`: 8 passing React tests |
| frontend-build.txt | `npm run build --prefix frontend`: TypeScript and production bundle |
| typescript.txt | `npm run typecheck --prefix frontend` |
| python-lint.txt | `.venv/bin/ruff check backend comparison scripts` |
| python-format.txt | `.venv/bin/ruff format --check backend comparison scripts` |
| frontend-format.txt | Prettier check of frontend source/configuration |
| python-dependencies.txt | `.venv/bin/pip check` (compatibility, not vulnerability scanning) |
| npm-audit.json | `npm audit --prefix frontend --json`: zero reported vulnerabilities |
| http-smoke.txt | `.venv/bin/python scripts/http_smoke.py`: actual server, static assets, API, SQLite and process restart |
| faulty-test-run.txt | Deliberately faulty month-end implementation: expected 4 failures / 4 passes |
| corrected-test-run.txt | Production month-end implementation: 8 passes |

`defect_demo.py` retains raw pytest output; traceback lines contain trailing spaces, intentionally preserved. The backend suite emits a dependency deprecation warning about Starlette's HTTPX TestClient adapter; no test failure is hidden or suppressed.

A clean `npm ci` from the lockfile was also executed, followed by the frontend tests/build. Browser QA was partial: see `docs/verification.md`. There is no claim of a complete visual/mobile/browser pass, independent second-tool execution, GitHub publication, Moodle submission or instructor approval.
