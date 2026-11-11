"""Identical cases for production, labelled fault and future independent tool."""

import importlib.util
import os
from datetime import date
from pathlib import Path

import pytest

from app.domain import monthly_occurrence as production

candidate = os.getenv("COCASH_CANDIDATE")
if candidate:
    spec = importlib.util.spec_from_file_location("candidate", Path(candidate))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    monthly_occurrence = module.monthly_occurrence
else:
    monthly_occurrence = production


@pytest.mark.parametrize(
    "year,month,day,expected",
    [
        (2026, 1, 31, date(2026, 1, 31)),
        (2026, 2, 31, date(2026, 2, 28)),
        (2028, 2, 31, date(2028, 2, 29)),
        (2026, 3, 31, date(2026, 3, 31)),
        (2026, 4, 31, date(2026, 4, 30)),
        (2100, 2, 29, date(2100, 2, 28)),
        (2000, 2, 29, date(2000, 2, 29)),
        (2026, 2, 1, date(2026, 2, 1)),
    ],
)
def test_month_end_contract(year, month, day, expected):
    assert monthly_occurrence(year, month, day) == expected
