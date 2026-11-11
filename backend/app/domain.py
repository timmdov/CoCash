"""Pure calendar and whole-HUF forecasting rules; no I/O."""

from calendar import monthrange
from datetime import date, timedelta
from typing import Iterable


def monthly_occurrence(year: int, month: int, day: int) -> date:
    return date(year, month, min(day, monthrange(year, month)[1]))


def forecast(
    balance: int, buffer: int, transactions: Iterable[dict], recurring: Iterable[dict], today: date
) -> dict:
    changes: dict[date, int] = {}
    end = today + timedelta(days=29)
    for entry in transactions:
        day = date.fromisoformat(entry["date"])
        if today <= day <= end:
            signed = entry["amount"] if entry["type"] == "income" else -entry["amount"]
            changes[day] = changes.get(day, 0) + signed
    months = {(today.year, today.month), (end.year, end.month)}
    for entry in recurring:
        for year, month in months:
            day = monthly_occurrence(year, month, entry["day"])
            if today <= day <= end:
                changes[day] = changes.get(day, 0) - entry["amount"]
    days = []
    for offset in range(30):
        day = today + timedelta(days=offset)
        change = changes.get(day, 0)
        balance += change
        days.append(
            {
                "date": day.isoformat(),
                "balance": balance,
                "change": change,
                "shortfall": max(0, buffer - balance),
            }
        )
    return {
        "today": today.isoformat(),
        "buffer": buffer,
        "days": days,
        "warnings": [day for day in days if day["shortfall"] > 0],
    }
