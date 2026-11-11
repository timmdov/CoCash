# Independent second-tool comparison — pending

Candidate: AC4 calendar clamping. Codex implementation: `backend/app/domain.py::monthly_occurrence`.

Give the following brief to a genuinely separate AI tool (for example Gemini or Claude). Do not provide the Codex implementation first.

> Implement a standalone pure Python function `monthly_occurrence(year: int, month: int, day: int) -> datetime.date`. Inputs are valid calendar year/month and day 1–31, validated by the caller. A monthly payment scheduled on a day missing from a month occurs on that month's final day. Respect Gregorian leap-year rules. Use only the standard library, no I/O or global state. Return the code plus a short explanation of calendar handling and complexity. Do not build an app.

Save the unmodified response as `comparison/second_tool.py` and note tool, exact model if shown, date, prompt and whether the first result needed corrections. Then run from the repository root:

```sh
COCASH_CANDIDATE=comparison/second_tool.py .venv/bin/pytest -q comparison/test_month_end.py
.venv/bin/pytest -q comparison/test_month_end.py
```

Identical conditions: same Python environment, same eight public cases, valid inputs only, standard library only, no supplied Codex implementation. Evaluate correctness, month/leap-year behavior (including 1900/2000/2100 principles), readability, complexity, dependencies, and any revisions needed. Passing eight tests alone does not prove every date is correct. Record elapsed time only if actually measured.

| Item | Codex | Independent tool |
|---|---|---|
| Implementation | `app/domain.py` | Pending |
| Verification | `evidence/corrected-test-run.txt` | Pending |
| Calendar approach | `calendar.monthrange`, clamp requested day | Pending |
| Student assessment | Awaiting review | Awaiting real output |

Do not claim this comparison is complete until the independent output and evaluation exist. The isolated faulty teaching example is NOT a second AI tool.
