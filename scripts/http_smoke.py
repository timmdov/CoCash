"""Real HTTP + SQLite + production asset check using a disposable database."""

import os
from pathlib import Path
import re
import socket
import subprocess
import sys
import tempfile
import time
from datetime import date, timedelta

import httpx

ROOT = Path(__file__).resolve().parents[1]


def start(path, port):
    process = subprocess.Popen(
        [
            sys.executable,
            "-m",
            "uvicorn",
            "app.main:app",
            "--app-dir",
            "backend",
            "--host",
            "127.0.0.1",
            "--port",
            str(port),
        ],
        cwd=ROOT,
        env={**os.environ, "COCASH_DB": str(path)},
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    for _ in range(100):
        try:
            if httpx.get(f"http://127.0.0.1:{port}/api/state", timeout=0.5).status_code == 200:
                return process
        except httpx.HTTPError:
            pass
        if process.poll() is not None:
            raise RuntimeError(f"Server exited {process.returncode}")
        time.sleep(0.05)
    process.terminate()
    process.wait(timeout=5)
    raise RuntimeError("Server startup timed out")


def main():
    with tempfile.TemporaryDirectory(prefix="cocash-smoke-") as folder:
        with socket.socket() as probe:
            probe.bind(("127.0.0.1", 0))
            port = probe.getsockname()[1]
        path = Path(folder) / "smoke.sqlite3"
        process = start(path, port)
        with httpx.Client(base_url=f"http://127.0.0.1:{port}") as client:
            try:
                page = client.get("/")
                assert page.status_code == 200 and "CoCash" in page.text
                assets = re.findall(r'(?:src|href)="(/assets/[^\"]+)"', page.text)
                assert len(assets) >= 2
                for asset in assets:
                    assert client.get(asset).status_code == 200
                print("PASS: production HTML and bundled JS/CSS served over HTTP")
                assert (
                    client.put("/api/profile", json={"balance": 100000, "buffer": 20000}).status_code
                    == 200
                )
                initial = client.get("/api/state").json()
                today = date.fromisoformat(initial["forecast"]["today"])
                purchase_date = (today + timedelta(days=9)).isoformat()
                result = client.post(
                    "/api/simulate", json={"amount": 85000, "date": purchase_date}
                ).json()
                assert result["days"][9]["balance"] == 15000
                assert result["warnings"][0]["shortfall"] == 5000
                assert client.get("/api/state").json() == initial
                print("PASS: AC7 risky simulation and no persisted changes")
                assert (
                    client.post(
                        "/api/transactions",
                        json={
                            "description": "Salary",
                            "type": "income",
                            "amount": 50000,
                            "date": purchase_date,
                        },
                    ).status_code
                    == 201
                )
                state = client.get("/api/state").json()
                assert state["forecast"]["days"][9]["balance"] == 150000
                assert (
                    client.post(
                        "/api/recurring", json={"description": "Rent", "amount": 80000, "day": 31}
                    ).status_code
                    == 201
                )
                before = client.get("/api/state").json()
                assert (
                    client.post(
                        "/api/transactions",
                        json={
                            "description": "Invalid",
                            "type": "expense",
                            "amount": -1,
                            "date": purchase_date,
                        },
                    ).status_code
                    == 422
                )
                assert client.get("/api/state").json() == before
                print("PASS: AC2 income, AC4 recurring persistence, AC3 rejected write is atomic")
            finally:
                process.terminate()
                process.wait(timeout=5)
            process = start(path, port)
            try:
                assert client.get("/api/state").json() == before
                print("PASS: AC8 real server-process restart preserves all state")
            finally:
                process.terminate()
                process.wait(timeout=5)


if __name__ == "__main__":
    main()
