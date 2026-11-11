# Submission 2 — first working version

Required by homework milestone 2: working main user workflow, source code, setup instructions, basic tests, and public GitHub project state/development history. This repository implements AC1–AC8 and prepares evidence beyond the minimum without inventing final-milestone work.

## Ready locally

- Real React/FastAPI/SQLite implementation and reproducible dependency locks.
- README setup/run/test instructions; acceptance traceability and actual execution logs.
- Three technical AI decision cases and AGENTS.md used in development.
- Explicitly labelled faulty-versus-corrected demonstration.
- Codex comparison candidate plus neutral brief and shared tests for another AI tool.
- Incremental Git history and annotated baseline tag `submission-2-v1`.

## Student actions before hand-in

1. Review the implementation and run the manual browser checklist. Full visual/mobile QA was limited by browser tooling, so do not claim it is complete yet.
2. Confirm instructor approval of the topic and check the exact deadline/submission location in Moodle. The PDF gives end of week 10 for this milestone, not a calendar deadline.
3. Authorize and create a **public** GitHub repository, then publish this history and tag. No repository has been published by the assistant. Choose a repository name/account before publication. Do not upload `.venv`, `node_modules`, SQLite data or secrets.
4. Submit the repository URL and source as required by Moodle. No Moodle upload has been performed.
5. Review the three AI decisions and record your own reasoning; placeholders are intentionally honest.

The supplied specification was 4,142 characters, exceeding the stated 4,000-character cap. `docs/specification.md` preserves all eight acceptance criteria verbatim and removes only the redundant normal/edge-case narrative section, which repeats scenarios/criteria and the past-transaction rule. The original supplied file is untouched. Review this condensed portable copy if updating the specification in Moodle; no submission was modified.

## Publication commands (after authorization and creating an empty public repo)

```sh
git remote add origin https://github.com/YOUR_ACCOUNT/cocash.git
git push -u origin main
git push origin submission-2-v1
```

These are instructions, not evidence that publication happened. To create a source zip from the preserved version:

```sh
git archive --format=zip --output=../cocash-submission-2.zip submission-2-v1
```

## Final submission (later)

- Actually obtain and evaluate the independent second-tool implementation.
- If enrolled in MSc, document a real comparison of two working methods as specified in the rubric.
- Receive the instructor's change request, implement it from the recorded first version, update affected requirements, verify regression and persistent data preservation.
- Prepare the 8–10 minute defence: selected requirement and verification, code behavior explanation without AI, and a small debugging/change task.

## Suggested defence practice now

Explain the journey from a React form to FastAPI validation, SQLite commit and refreshed forecast. Walk through `forecast`: signed changes, recurring occurrences, daily accumulation, strict below-buffer detection. Predict the day-3 80000 expense / 30000 income result from a 100000 balance. Explain why the month-end fault fails in February and why simulation has no write path. Run and interpret the AC8 regression test.
