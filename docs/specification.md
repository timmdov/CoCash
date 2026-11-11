CoCash: 30-Day Cash-Flow Forecaster

1. Project Objective

CoCash is a personal finance web application that forecasts a user's daily account balance for the next 30 days and warns when the balance falls below a configurable safety buffer. Users can simulate planned purchases without modifying their financial records.

Stack: React frontend, FastAPI backend, SQLite database. Financial calculations use deterministic Python operations and whole HUF amounts.

2. User Role

Local User: A single user who manages their balance, safety buffer, transactions, and recurring expenses, views forecasts, and simulates purchases.

Frontend and backend are separate. Authentication and multi-user functionality are outside the initial scope.

3. Main User Scenarios

1) Set the current balance and safety buffer.
2) Record income, expenses, and monthly recurring payments.
3) View projected daily balances for 30 days, including today.
4) Receive warnings about potential cash shortages.
5) Simulate purchases without saving them.

4. Acceptance Criteria

AC1 - Financial Profile: Given a balance of 100000 HUF and buffer of 20000 HUF, both are saved and displayed after reloading. Negative buffers are rejected.

AC2 - Transactions: Given a balance of 100000 HUF and no other transactions, adding income of 50000 HUF on day 10 produces 150000 HUF on days 10-30. Days 1-9 remain at 100000 HUF. The transaction is saved and displayed.

AC3 - Invalid Input: A transaction with amount 0 or -500, an impossible date (2026-02-30), or an unsupported type is rejected with a field-specific error. Existing records remain unchanged.

AC4 - Recurring Expenses: A monthly expense of 80000 HUF scheduled for the 31st occurs on Jan 31, Feb 28 (Feb 29 in leap years), Mar 31, and Apr 30. Only occurrences within the active 30-day forecast are included.

AC5 - Forecasting: Given a balance of 100000 HUF, an expense of 80000 HUF and income of 30000 HUF both on day 3, days 1-2 show 100000 HUF and day 3 shows 50000 HUF. Same-day transactions are combined before evaluating the daily balance.

AC6 - Risk Detection: Given a balance of 100000 HUF, buffer of 20000 HUF, and expense of 85000 HUF on day 5, a warning identifies day 5, projected balance 15000 HUF, and shortfall 5000 HUF. A balance exactly equal to the buffer produces no warning.

AC7 - Purchase Simulation: Given a balance of 100000 HUF, buffer of 20000 HUF, and no scheduled transactions, simulating a purchase of 70000 HUF on day 10 produces a safe balance of 30000 HUF. A purchase of 85000 HUF produces a warning at 15000 HUF. Stored records remain unchanged. Dates outside the forecast are rejected.

AC8 - Persistence and Regression: After restarting the application, the saved profile and transactions remain unchanged. Changing the safety buffer recalculates risk warnings without modifying stored transactions.

5. Invalid Input Handling

Zero or negative transaction amounts, impossible dates, unsupported types, negative buffers, and simulation dates outside the forecast period are rejected with descriptive errors. Invalid operations do not change stored data.

6. Uncertainties and Resolutions

- Forecast: 30 calendar days, including today (day 1).
- Date handling: Europe/Budapest timezone with an injectable clock for testing.
- Safety threshold: Warnings occur only below the buffer.
- Financial data: Manually entered; no banking integration.
- Past transactions: Stored but excluded from forecasts because the current balance already reflects them.
- Recurring payments: Scheduled and manual transactions are separate; automatic reconciliation is excluded.
- Calculations: Integer HUF; uncertain income is not predicted.
- Verification: Each acceptance criterion will have automated pytest tests, with UI tests for key workflows.