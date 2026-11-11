from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

from app.domain import forecast, monthly_occurrence
from app.main import create_app

TODAY = date(2026, 1, 1)


@pytest.fixture
def client(tmp_path):
    with TestClient(create_app(tmp_path / "test.sqlite3", lambda: TODAY)) as client:
        yield client


def profile(client, balance=100000, buffer=20000):
    assert client.put("/api/profile", json={"balance": balance, "buffer": buffer}).status_code == 200


def transaction(client, amount, day, kind="expense"):
    return client.post(
        "/api/transactions",
        json={
            "description": "Test entry",
            "amount": amount,
            "type": kind,
            "date": (TODAY + timedelta(days=day - 1)).isoformat(),
        },
    )


def state(client):
    return client.get("/api/state").json()


def test_ac1_profile_reload_and_invalid_buffer(client):
    profile(client)
    assert state(client)["profile"] == {"balance": 100000, "buffer": 20000}
    before = state(client)
    response = client.put("/api/profile", json={"balance": 0, "buffer": -1})
    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"][-1] == "buffer"
    assert state(client) == before


def test_ac2_income_on_day10(client):
    profile(client)
    assert transaction(client, 50000, 10, "income").status_code == 201
    data = state(client)
    assert len(data["transactions"]) == 1
    assert [d["balance"] for d in data["forecast"]["days"]] == [100000] * 9 + [150000] * 21


@pytest.mark.parametrize(
    "field,value",
    [
        ("amount", 0),
        ("amount", -500),
        ("date", "2026-02-30"),
        ("type", "unsupported"),
        ("amount", 1.5),
        ("amount", True),
        ("amount", "500"),
        ("description", "   "),
    ],
)
def test_ac3_invalid_transaction_is_atomic(client, field, value):
    transaction(client, 100, 1)
    before = state(client)
    entry = {"description": "Test", "amount": 500, "date": "2026-01-02", "type": "expense"}
    entry[field] = value
    response = client.post("/api/transactions", json=entry)
    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"][-1] == field
    assert state(client) == before


@pytest.mark.parametrize(
    "year,month,expected", [(2026, 1, 31), (2026, 2, 28), (2028, 2, 29), (2026, 3, 31), (2026, 4, 30)]
)
def test_ac4_month_end(year, month, expected):
    assert monthly_occurrence(year, month, 31) == date(year, month, expected)
    start = date(year, month, 2)
    result = forecast(100000, 0, [], [{"amount": 80000, "day": 31}], start)
    charges = [d for d in result["days"] if d["change"]]
    assert charges == [
        {
            "date": date(year, month, expected).isoformat(),
            "balance": 20000,
            "change": -80000,
            "shortfall": 0,
        }
    ]


def test_ac4_recurring_persistence_and_window(client):
    response = client.post("/api/recurring", json={"description": "Rent", "amount": 80000, "day": 31})
    assert response.status_code == 201
    data = state(client)
    assert data["recurring"][0]["day"] == 31
    assert all(d["change"] == 0 for d in data["forecast"]["days"])  # Jan 31 is outside Jan 1–30.


def test_ac5_same_day_aggregation(client):
    profile(client)
    transaction(client, 80000, 3)
    transaction(client, 30000, 3, "income")
    result = state(client)["forecast"]
    assert [d["balance"] for d in result["days"]] == [100000] * 2 + [50000] * 28
    assert result["warnings"] == []


def test_ac6_risk_and_exact_threshold(client):
    profile(client)
    transaction(client, 85000, 5)
    warning = state(client)["forecast"]["warnings"][0]
    assert warning == {"date": "2026-01-05", "balance": 15000, "shortfall": 5000, "change": -85000}
    profile(client, buffer=15000)
    assert state(client)["forecast"]["warnings"] == []


@pytest.mark.parametrize("amount,balance,shortfall", [(70000, 30000, 0), (85000, 15000, 5000)])
@pytest.mark.parametrize("day", [1, 10, 30])
def test_ac7_simulation_never_persists(client, amount, balance, shortfall, day):
    profile(client)
    before = state(client)
    response = client.post(
        "/api/simulate", json={"amount": amount, "date": (TODAY + timedelta(days=day - 1)).isoformat()}
    )
    assert response.status_code == 200
    result = response.json()
    assert result["days"][day - 1]["balance"] == balance
    assert result["days"][day - 1]["shortfall"] == shortfall
    assert [d["balance"] for d in result["days"][: day - 1]] == [100000] * (day - 1)
    assert state(client) == before


@pytest.mark.parametrize("offset", [-1, 30])
def test_ac7_reject_outside_dates(client, offset):
    before = state(client)
    response = client.post(
        "/api/simulate", json={"amount": 100, "date": (TODAY + timedelta(days=offset)).isoformat()}
    )
    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"][-1] == "date"
    assert state(client) == before


def test_ac8_restart_and_buffer_regression(tmp_path):
    path = tmp_path / "persistent.sqlite3"
    with TestClient(create_app(path, lambda: TODAY)) as client:
        profile(client)
        transaction(client, 85000, 5)
        client.post("/api/recurring", json={"description": "Rent", "amount": 1000, "day": 31})
        before = state(client)
    with TestClient(create_app(path, lambda: TODAY)) as client:
        assert state(client) == before
        profile(client, buffer=10000)
        after = state(client)
        assert after["forecast"]["warnings"] == []
        assert after["transactions"] == before["transactions"]
        assert after["recurring"] == before["recurring"]
        assert [d["balance"] for d in after["forecast"]["days"]] == [
            d["balance"] for d in before["forecast"]["days"]
        ]


def test_past_and_future_entries_excluded(client):
    profile(client)
    transaction(client, 50000, 0)
    transaction(client, 50000, 31)
    data = state(client)
    assert len(data["transactions"]) == 2
    assert all(d["balance"] == 100000 for d in data["forecast"]["days"])


@pytest.mark.parametrize("day", [0, 32, 1.5, True])
def test_invalid_recurring_atomic(client, day):
    before = state(client)
    assert (
        client.post(
            "/api/recurring", json={"description": "Rent", "amount": 1000, "day": day}
        ).status_code
        == 422
    )
    assert state(client) == before


def test_year_boundary_and_short_month_multiple_occurrences():
    result = forecast(100000, 0, [], [{"amount": 1000, "day": 1}], date(2026, 12, 20))
    assert [d["date"] for d in result["days"] if d["change"]] == ["2027-01-01"]
    result = forecast(100000, 0, [], [{"amount": 1000, "day": 1}], date(2026, 2, 1))
    assert [d["date"] for d in result["days"] if d["change"]] == ["2026-02-01", "2026-03-01"]
