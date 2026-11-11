"""Run the SAME contract against labelled faulty and corrected implementations."""

import os
from pathlib import Path
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
for name, candidate, expected in [("faulty", "comparison/faulty_month_end.py", 1), ("corrected", "", 0)]:
    env = {**os.environ, "COCASH_CANDIDATE": candidate}
    result = subprocess.run(
        [sys.executable, "-m", "pytest", "-q", "comparison/test_month_end.py"],
        cwd=root,
        env=env,
        capture_output=True,
        text=True,
    )
    (root / "evidence" / f"{name}-test-run.txt").write_text(result.stdout + result.stderr)
    print(f"{name}: pytest exit {result.returncode}; expected {expected}")
    if result.returncode != expected:
        raise SystemExit("Unexpected result: inspect evidence logs.")
