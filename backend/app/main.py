"""HTTP boundary. Dates and calculations are delegated to the domain module."""

import os
from contextlib import asynccontextmanager
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Annotated, Callable, Literal
from zoneinfo import ZoneInfo

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field

from .db import connection, initialize, snapshot
from .domain import forecast

# Bound individual inputs below JavaScript's exact integer limit with generous
# headroom for normal personal-finance use. Aggregate calculations stay in Python.
Money = Annotated[int, Field(strict=True, ge=1, le=1_000_000_000_000)]
Whole = Annotated[int, Field(strict=True, ge=-1_000_000_000_000, le=1_000_000_000_000)]
Description = Annotated[str, Field(min_length=1, max_length=120)]


class Input(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Profile(Input):
    balance: Whole
    buffer: Annotated[int, Field(strict=True, ge=0, le=1_000_000_000_000)]


class Transaction(Input):
    description: Description
    amount: Money
    type: Literal["income", "expense"]
    date: date


class Recurring(Input):
    description: Description
    amount: Money
    day: Annotated[int, Field(strict=True, ge=1, le=31)]


class Simulation(Input):
    amount: Money
    date: date


def budapest_today() -> date:
    return datetime.now(ZoneInfo("Europe/Budapest")).date()


def create_app(db_path: Path | None = None, clock: Callable[[], date] = budapest_today) -> FastAPI:
    path = db_path or Path(os.getenv("COCASH_DB", "data/cocash.sqlite3"))

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        initialize(path)
        yield

    app = FastAPI(title="CoCash API", version="0.1.0", lifespan=lifespan)

    def calculate(state: dict, today: date) -> dict:
        return forecast(
            **state["profile"],
            transactions=state["transactions"],
            recurring=state["recurring"],
            today=today,
        )

    @app.get("/api/state")
    def state():
        data = snapshot(path)
        return {**data, "forecast": calculate(data, clock())}

    @app.put("/api/profile")
    def save_profile(profile: Profile):
        with connection(path) as db:
            db.execute(
                "UPDATE profile SET balance=?,buffer=? WHERE id=1", (profile.balance, profile.buffer)
            )
        return profile

    @app.post("/api/transactions", status_code=201)
    def add_transaction(entry: Transaction):
        with connection(path) as db:
            row = db.execute(
                "INSERT INTO transactions(description,amount,type,date) VALUES(?,?,?,?)",
                (entry.description, entry.amount, entry.type, entry.date.isoformat()),
            )
            return {"id": row.lastrowid, **entry.model_dump()}

    @app.post("/api/recurring", status_code=201)
    def add_recurring(entry: Recurring):
        with connection(path) as db:
            row = db.execute(
                "INSERT INTO recurring(description,amount,day) VALUES(?,?,?)",
                (entry.description, entry.amount, entry.day),
            )
            return {"id": row.lastrowid, **entry.model_dump()}

    @app.post("/api/simulate")
    def simulate(purchase: Simulation):
        today = clock()
        if not today <= purchase.date <= today + timedelta(days=29):
            raise HTTPException(
                422,
                detail=[
                    {"loc": ["body", "date"], "msg": "Purchase date must be within the 30-day forecast."}
                ],
            )
        data = snapshot(path)
        data["transactions"].append(
            {"amount": purchase.amount, "type": "expense", "date": purchase.date.isoformat()}
        )
        return calculate(data, today)

    # Production build is served beside the API; development uses Vite's proxy.
    frontend = Path(__file__).resolve().parents[2] / "frontend" / "dist"
    if frontend.is_dir():
        app.mount("/", StaticFiles(directory=frontend, html=True), name="frontend")
    return app


app = create_app()
