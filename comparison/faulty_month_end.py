"""DELIBERATELY FAULTY teaching example; never imported by production code."""

from datetime import date


def monthly_occurrence(year: int, month: int, day: int) -> date:
    # Fault: assumes every requested day exists in the month.
    return date(year, month, day)
