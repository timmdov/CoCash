# AI use and technical decision evidence

Tool: Codex, GPT-6-based agent as identified by the session. A more specific selectable model identifier was not exposed; do not invent it. Method: repository inspection, direct file edits, executable tests, observed browser checks and incremental Git commits. No subagents or independent second tool were used.

Three phases actually supported by AI: (1) analysis of the specification/homework and architecture; (2) backend/frontend implementation; (3) test creation, execution and defect evidence. `AGENTS.md` was created, read back, and used to guide separation of domain logic, isolated databases, test requirements and publication boundaries.

The decisions below are **engineering decisions made by the assistant**, proposed for the student's review. They are not fabricated personal judgments by the student. Before submission, review the linked code and results, then record whether you accept each choice and why in your own words.

## Case 1 — Deterministic forecast and explicit dates

Problem/context: AC2, AC4–AC6 need exact balances and calendar edge behavior. User instruction: implement the specification exactly, keep financial calculations deterministic and independently testable.

Suggestion: pure Python forecast; aggregate signed same-day entries, clamp monthly dates via `calendar.monthrange`, then evaluate end-of-day balance against the buffer. Inject today's date at the application boundary.

Assistant decision: accepted. It avoids external service uncertainty, floating-point rounding and machine-timezone dependent tests. The app does not need Ollama or an AI API.

Verification: `test_ac2_income_on_day10`, `test_ac4_month_end`, `test_ac5_same_day_aggregation`, `test_ac6_risk_and_exact_threshold`, `test_year_boundary_and_short_month_multiple_occurrences`; actual output in `evidence/backend-tests.txt`.

Limits: forecast reflects recorded entries only. Tests are representative examples, not exhaustive proof of all possible calendars/inputs.

Student decision and rationale: **pending review**.

## Case 2 — Read-only simulation and persistent state

Problem/context: AC7 must preview purchases without saving; AC8 must preserve data across restart and buffer changes. User instruction: real SQLite persistence, validation, no mocks in completed app workflows.

Suggestion: read one database snapshot, copy data into memory and calculate the simulated expense without calling persistence writes. Open/close SQLite connections per operation and constrain records.

Assistant decision: accepted. Keeping simulation without a write path is simpler and safer than inserting then rolling back. Snapshot reads prevent mixed versions of profile and entries in a response.

Verification: `test_ac7_simulation_never_persists` (days 1, 10, 30; safe/risky amounts), `test_ac7_reject_outside_dates`, `test_ac8_restart_and_buffer_regression`, `test_ac3_invalid_transaction_is_atomic`. Full structured state is compared before/after operations. Results: `evidence/backend-tests.txt`.

Limits: restart test creates a new app instance using the same SQLite file, not a physical machine reboot. Authentication and concurrent multi-user operation are excluded by specification.

Student decision and rationale: **pending review**.

## Case 3 — Verification must detect a known fault

Problem/context: green tests alone do not demonstrate defect detection. Homework requires retained faulty/corrected versions and actual test runs. User instruction explicitly permits a labelled isolated deliberate fault and forbids misrepresentation.

Suggestion: evaluate the same month-end contract against `date(year,month,day)` (deliberately faulty for missing days) and the production clamping function.

Assistant decision: accepted as a controlled teaching demonstration. This was NOT a naturally discovered production defect. The faulty module is isolated under `comparison/`, never imported by the app.

Verification: `scripts/defect_demo.py` expects pytest exit 1 on the faulty module and exit 0 on production. Evidence: `faulty-test-run.txt` and `corrected-test-run.txt`. Eight identical cases exercise Jan/Feb/Mar/Apr and Gregorian leap rules.

Limits: it demonstrates test sensitivity to this particular bug, not comprehensive mutation coverage. Frontend component tests use HTTP mocks; browser checks exercise the real app separately.

Student decision and rationale: **pending review**.

## Independent tools and MSc requirement

Independent two-tool implementation remains pending. Use `comparison/SECOND_TOOL_BRIEF.md`; the Codex implementation and shared evaluation harness are ready. Do not count two prompts to this same tool as two independent tools.

If enrolled in the MSc course, the rubric additionally allocates points for comparing two working methods. The student's course level has not been established. A fair later comparison could contrast test-first and implementation-first work with recorded observations; no such comparison is claimed here.
