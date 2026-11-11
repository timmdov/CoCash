"""Short-lived SQLite connections with atomic commits and database constraints."""

import sqlite3
from contextlib import contextmanager
from pathlib import Path


@contextmanager
def connection(path: Path):
    db = sqlite3.connect(path)
    db.row_factory = sqlite3.Row
    try:
        with db:
            yield db
    finally:
        db.close()


def initialize(path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    with connection(path) as db:
        db.executescript("""
            CREATE TABLE IF NOT EXISTS profile (
                id INTEGER PRIMARY KEY CHECK(id=1),
                balance INTEGER NOT NULL,
                buffer INTEGER NOT NULL CHECK(buffer>=0));
            INSERT OR IGNORE INTO profile VALUES(1,0,0);
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY,
                description TEXT NOT NULL,
                amount INTEGER NOT NULL CHECK(amount>0),
                type TEXT NOT NULL CHECK(type IN ('income','expense')),
                date TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS recurring (
                id INTEGER PRIMARY KEY,
                description TEXT NOT NULL,
                amount INTEGER NOT NULL CHECK(amount>0),
                day INTEGER NOT NULL CHECK(day BETWEEN 1 AND 31));
        """)


def snapshot(path: Path) -> dict:
    with connection(path) as db:
        # One read transaction keeps the three collections consistent.
        db.execute("BEGIN")
        return {
            "profile": dict(db.execute("SELECT balance,buffer FROM profile").fetchone()),
            "transactions": [dict(r) for r in db.execute("SELECT * FROM transactions ORDER BY date,id")],
            "recurring": [dict(r) for r in db.execute("SELECT * FROM recurring ORDER BY day,id")],
        }
