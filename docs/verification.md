# Acceptance verification

The automated suite uses an injected date of 2026-01-01 and isolated SQLite files. It does not depend on the current calendar date. Run commands from README. Actual command output is retained in `evidence/`.

| AC | Implemented behavior | Automated verification |
|---|---|---|
| AC1 | Save/reload balance and buffer; reject negative buffer | `test_ac1_profile_reload_and_invalid_buffer`; React save/refresh test |
| AC2 | Day-10 income affects days 10–30 only and persists | `test_ac2_income_on_day10`; live HTTP smoke; React entry submission test |
| AC3 | Positive integer amounts, actual dates and supported types; atomic rejection | `test_ac3_invalid_transaction_is_atomic` (8 cases); API error display test |
| AC4 | Month-end clamping, leap years, persisted schedules and active window only | `test_ac4_month_end` (5 cases), `test_ac4_recurring_persistence_and_window`; monthly form test |
| AC5 | Aggregate same-day income/expense before evaluating daily risk | `test_ac5_same_day_aggregation` |
| AC6 | Below-buffer warning includes date, balance and shortfall; equality is safe | `test_ac6_risk_and_exact_threshold`; simulation UI warning |
| AC7 | Safe/risky purchases on days 1/10/30; no writes; outside dates rejected | `test_ac7_simulation_never_persists` (6 cases), `test_ac7_reject_outside_dates`; React simulation/reset; live HTTP smoke |
| AC8 | Data persists on restart; buffer change affects warnings only | `test_ac8_restart_and_buffer_regression`; live HTTP test restarts a real server process |

Additional cases cover historical/future exclusion, invalid recurring days, year boundaries and two monthly occurrences within a 30-day period spanning a short February.

## Recorded results

- Backend: 33 passing tests (`backend-tests.txt`); one upstream Starlette/HTTPX adapter deprecation warning is retained, not suppressed.
- React component/API-contract tests: 8 passing (`frontend-tests.txt`). These use fetch mocks, clearly distinguished from live HTTP verification.
- TypeScript, production build, Ruff lint/format and dependency consistency: see corresponding logs.
- Real HTTP smoke: production HTML/JS/CSS, profiles, income, recurring expenses, simulations, invalid write atomicity and server-process restart (`http-smoke.txt`).
- Deliberately faulty comparison: eight cases, four fail and four pass. Corrected production function: eight pass. `faulty-test-run.txt` and `corrected-test-run.txt` retain actual pytest output. The deliberate bug is direct date construction without month-end clamping, isolated from production.
- Dependency audit: frontend report in `npm-audit.json`; the audited set reported zero known vulnerabilities. This is not a proof of security. No backend advisory scan is claimed; `pip check` checks dependency compatibility only.
- Browser: native Chrome loaded the production app and its accessibility tree showed the dashboard, 30-day window, empty state and labelled forms. Profile saves produced real success messages and changed the dashboard. Test input tools were inconsistent, browser host access was unavailable, and screenshot capture became blank. Full browser workflow and visual/mobile QA are therefore **not certified complete**.

## Reproducible manual browser checklist — pending full student pass

Use a fresh database for each scenario (unique `COCASH_DB` filename) and the run command from README. “Day 1” means the date shown by the app; “day 10” is nine calendar days later. Avoid crossing midnight while checking a scenario.

1. Save 100000 HUF balance and 20000 buffer. Reload; expect both unchanged. Stop/restart server; expect the same values.
2. Add income 50000 dated day 10. Expect the entry to appear; expand the table: days 1–9 are 100000, days 10–30 are 150000. All 30 rows must be reachable by scrolling.
3. Fresh database/profile: add expense 80000 and income 30000 on day 3. Expect 50000 starting day 3 and no transient same-day warning.
4. Fresh database/profile: simulate 70000 on day 10; expect 30000 and no warning. Simulate 85000; expect 15000, first warning day 10 and 5000 shortfall. “Back to saved forecast” restores 100000. Reload and verify no purchase entry was stored.
5. Add monthly expense 80000 on day 31. Expect the applicable last day within the current window to show the charge (or no charge if no occurrence lies within the window). Deterministic automated tests cover Jan/Feb/leap-Feb/Mar/Apr independently of the current month.
6. Reject amount 0, negative buffer and out-of-window simulation through browser validation. The API tests additionally verify impossible dates and unsupported types because native controls may prevent typing these.
7. On desktop and a 390px-wide viewport, check all labels, buttons, chart, table scroll and forms; expect no clipped controls or horizontal page overflow. Tab through fields; expect visible focus. Check the exact table with a screen reader; the chart has an accessible description.
8. Stop the server, reload and confirm an actionable error/retry. Start it again and retry; expect recovery. Exercise loading and success feedback.

Record your browser/version, viewport, date and observed result after actually completing these steps. Do not mark them passed based only on the existence of this checklist.
