import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import App from "./App";
import { request, type State } from "./api";

function fixture(): State {
  return {
    profile: { balance: 100000, buffer: 20000 },
    transactions: [],
    recurring: [],
    forecast: {
      today: "2026-01-01",
      buffer: 20000,
      warnings: [],
      days: Array.from({ length: 30 }, (_, i) => ({
        date: `2026-01-${String(i + 1).padStart(2, "0")}`,
        balance: 100000,
        change: 0,
        shortfall: 0,
      })),
    },
  };
}
afterEach(() => vi.unstubAllGlobals());
function respond(body: unknown) {
  return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
}
test("loads empty state, saves profile via API and refreshes forecast", async () => {
  const data = fixture();
  const mock = vi.fn((_url: string, options?: RequestInit) => {
    if (options?.method === "PUT") {
      data.profile = JSON.parse(String(options.body));
      return respond(data.profile);
    }
    return respond(data);
  });
  vi.stubGlobal("fetch", mock);
  render(<App />);
  const user = userEvent.setup();
  await screen.findByText("A fresh start.");
  const balance = screen.getByLabelText("Current balance (HUF)");
  await user.clear(balance);
  await user.type(balance, "120000");
  await user.click(screen.getByText("Save profile"));
  await screen.findByText("Financial profile saved.");
  expect(mock).toHaveBeenCalledWith(
    "/api/profile",
    expect.objectContaining({
      method: "PUT",
      body: JSON.stringify({ balance: 120000, buffer: 20000 }),
    }),
  );
  expect(screen.getByText("120,000 HUF")).toBeInTheDocument();
});
test("simulation displays risk and reset restores saved forecast", async () => {
  const data = fixture();
  const simulated = structuredClone(data.forecast);
  simulated.days = simulated.days.map((d) => ({
    ...d,
    balance: 15000,
    shortfall: 5000,
  }));
  simulated.warnings = simulated.days;
  const mock = vi.fn((url: string) =>
    respond(url.endsWith("simulate") ? simulated : data),
  );
  vi.stubGlobal("fetch", mock);
  render(<App />);
  await screen.findByText("A fresh start.");
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Purchase amount (HUF)"), "85000");
  await user.click(screen.getByText("Simulate purchase"));
  await screen.findByText("A little planning needed");
  expect(screen.getByText(/shortfall 5,000 HUF/)).toBeInTheDocument();
  expect(mock).toHaveBeenCalledTimes(2);
  await user.click(screen.getByText("Back to saved forecast"));
  expect(
    screen.getByText("You’re within your safety buffer"),
  ).toBeInTheDocument();
});
test("adds a transaction using the backend contract", async () => {
  const data = fixture();
  const mock = vi.fn((_url: string, options?: RequestInit) => {
    if (options?.method === "POST") {
      const entry = JSON.parse(String(options.body));
      data.transactions.push({ id: 1, ...entry });
      return respond(entry);
    }
    return respond(data);
  });
  vi.stubGlobal("fetch", mock);
  render(<App />);
  await screen.findByText("A fresh start.");
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Description"), "Salary");
  await user.selectOptions(screen.getByLabelText("Type"), "income");
  await user.type(screen.getByLabelText("Amount (HUF)"), "50000");
  await user.click(screen.getByText("Add entry"));
  await screen.findByText("Salary");
  expect(mock).toHaveBeenCalledWith(
    "/api/transactions",
    expect.objectContaining({
      body: JSON.stringify({
        description: "Salary",
        amount: 50000,
        type: "income",
        date: "2026-01-01",
      }),
    }),
  );
});
test("renders actionable backend validation errors", async () => {
  const mock = vi.fn((_url: string, options?: RequestInit) =>
    options?.method === "PUT"
      ? Promise.resolve(
          new Response(
            JSON.stringify({
              detail: [{ loc: ["body", "buffer"], msg: "Invalid buffer" }],
            }),
            { status: 422 },
          ),
        )
      : respond(fixture()),
  );
  vi.stubGlobal("fetch", mock);
  render(<App />);
  await screen.findByText("A fresh start.");
  await userEvent.click(screen.getByText("Save profile"));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "buffer: Invalid buffer",
  );
});
test("network failure offers retry and recovers", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockRejectedValueOnce(new Error("Connection unavailable"))
      .mockImplementation(() => respond(fixture())),
  );
  render(<App />);
  await screen.findByRole("alert");
  await userEvent.click(screen.getByText("Try again"));
  await screen.findByText("A fresh start.");
});
test("monthly expense form submits month-end day", async () => {
  const mock = vi.fn(() => respond(fixture()));
  vi.stubGlobal("fetch", mock);
  render(<App />);
  await screen.findByText("A fresh start.");
  const user = userEvent.setup();
  await user.click(screen.getByText("Monthly expense"));
  await user.type(screen.getByLabelText("Description"), "Rent");
  await user.type(screen.getByLabelText("Amount (HUF)"), "80000");
  const day = screen.getByLabelText("Day of month");
  await user.clear(day);
  await user.type(day, "31");
  await user.click(screen.getByText("Add monthly expense"));
  await screen.findByText("Entry saved. Forecast updated.");
  expect(mock).toHaveBeenCalledWith(
    "/api/recurring",
    expect.objectContaining({
      body: JSON.stringify({ description: "Rent", amount: 80000, day: 31 }),
    }),
  );
});
test("daily table exposes all 30 exact balances", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => respond(fixture())),
  );
  render(<App />);
  await screen.findByText("A fresh start.");
  await userEvent.click(screen.getByText("Explore the daily forecast"));
  expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(
    31,
  );
});
test("non-JSON server error retains HTTP status", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(new Response("Unavailable", { status: 503 }))),
  );
  await expect(request("state")).rejects.toThrow("Request failed (503)");
});
