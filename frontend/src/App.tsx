import { useEffect, useState, type FormEvent } from "react";
import { request, type Forecast, type State } from "./api";

const money = (value: number) =>
  `${new Intl.NumberFormat("en-US").format(value)} HUF`;
const dateLabel = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
const number = (data: FormData, key: string) => Number(data.get(key));

function Chart({ forecast }: { forecast: Forecast }) {
  const values = forecast.days.map((d) => d.balance);
  const low = Math.min(...values, forecast.buffer, 0);
  const high = Math.max(...values, forecast.buffer, 1);
  const y = (value: number) => 170 - ((value - low) / (high - low)) * 140;
  const points = values
    .map((value, i) => `${30 + i * 24},${y(value)}`)
    .join(" ");
  return (
    <svg
      viewBox="0 0 760 210"
      role="img"
      aria-label="30-day projected balance chart. Exact values are in the daily forecast table."
    >
      {[0, 1, 2, 3].map((i) => (
        <line
          key={i}
          x1="30"
          x2="726"
          y1={30 + i * 47}
          y2={30 + i * 47}
          stroke="#e4e9e3"
        />
      ))}
      <line
        x1="30"
        x2="726"
        y1={y(forecast.buffer)}
        y2={y(forecast.buffer)}
        stroke="#ad6d26"
        strokeDasharray="5 5"
      />
      <polygon
        points={`30,180 ${points} 726,180`}
        fill="#198267"
        opacity=".08"
      />
      <polyline
        points={points}
        fill="none"
        stroke="#16735a"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {forecast.days.map(
        (day, i) =>
          day.shortfall > 0 && (
            <circle
              key={day.date}
              cx={30 + i * 24}
              cy={y(day.balance)}
              r="3"
              fill="#b34a2c"
            />
          ),
      )}
      <text x="30" y="204">
        {dateLabel(forecast.days[0].date)}
      </text>
      <text x="726" y="204" textAnchor="end">
        {dateLabel(forecast.days[29].date)}
      </text>
    </svg>
  );
}

export default function App() {
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [simulation, setSimulation] = useState<Forecast | null>(null);
  const [tab, setTab] = useState<"transaction" | "recurring">("transaction");
  async function load() {
    setState(await request<State>("state"));
  }
  useEffect(() => {
    load().catch((e) =>
      setError(e instanceof Error ? e.message : "Could not load your data."),
    );
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>, path: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const body =
        path === "profile"
          ? { balance: number(data, "balance"), buffer: number(data, "buffer") }
          : path === "simulate"
            ? { amount: number(data, "amount"), date: data.get("date") }
            : path === "recurring"
              ? {
                  description: data.get("description"),
                  amount: number(data, "amount"),
                  day: number(data, "day"),
                }
              : {
                  description: data.get("description"),
                  amount: number(data, "amount"),
                  type: data.get("type"),
                  date: data.get("date"),
                };
      if (path === "simulate") {
        setSimulation(await request<Forecast>(path, "POST", body));
        setMessage("Simulation ready. Your records have not changed.");
      } else {
        await request(path, path === "profile" ? "PUT" : "POST", body);
        setSimulation(null);
        await load();
        setMessage(
          path === "profile"
            ? "Financial profile saved."
            : "Entry saved. Forecast updated.",
        );
        if (path !== "profile") form.reset();
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!state)
    return (
      <main className="initial">
        <div className="brand">
          CoCash<span>●</span>
        </div>
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button
              onClick={() => {
                setError("");
                load().catch((e) => setError(e.message));
              }}
            >
              Try again
            </button>
          </>
        ) : (
          <p role="status">Loading your financial overview…</p>
        )}
      </main>
    );
  const forecast = simulation ?? state.forecast;
  const minimum = Math.min(...forecast.days.map((d) => d.balance));
  const firstWarning = forecast.warnings[0];
  const lastDate = forecast.days[29].date;
  return (
    <>
      <header>
        <a className="brand" href="/">
          CoCash<span>●</span>
        </a>
        <span className="header-note">A little clarity for what’s ahead.</span>
        <span className="local-badge">Local workspace</span>
      </header>
      <main>
        <div className="page-heading">
          <div>
            <p className="eyebrow">YOUR MONEY, LOOKING FORWARD</p>
            <h1>Your next 30 days.</h1>
            <p>Plan the everyday. Make room for what matters.</p>
          </div>
          <div className="date-pill">
            {dateLabel(forecast.today)} — {dateLabel(lastDate)}
            <small>Europe / Budapest · including today</small>
          </div>
        </div>
        <div className="feedback" aria-live="polite">
          {message && (
            <p className="success" role="status">
              {message}
            </p>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="stats">
          <article>
            <p>Current balance</p>
            <strong>{money(state.profile.balance)}</strong>
            <small>Your starting point</small>
          </article>
          <article>
            <p>Lowest projected balance</p>
            <strong className={minimum < forecast.buffer ? "danger" : ""}>
              {money(minimum)}
            </strong>
            <small>
              {simulation
                ? "With your simulated purchase"
                : "Across the next 30 days"}
            </small>
          </article>
          <article>
            <p>Safety buffer</p>
            <strong>{money(state.profile.buffer)}</strong>
            <small>A little breathing room</small>
          </article>
        </div>
        <div className="workspace">
          <div className="primary">
            <section className="card forecast">
              <div className="section-title">
                <div>
                  <p className="eyebrow">THE BIG PICTURE</p>
                  <h2>Balance forecast</h2>
                </div>
                <span className="legend">
                  <i /> Balance <b /> Buffer
                </span>
              </div>
              {simulation && (
                <div className="simulation-banner">
                  Previewing a purchase{" "}
                  <button type="button" onClick={() => setSimulation(null)}>
                    Back to saved forecast
                  </button>
                </div>
              )}
              <Chart forecast={forecast} />
              <div className={firstWarning ? "notice warning" : "notice safe"}>
                <strong>
                  {firstWarning
                    ? "A little planning needed"
                    : "You’re within your safety buffer"}
                </strong>
                <p>
                  {firstWarning
                    ? `${dateLabel(firstWarning.date)}: projected balance ${money(firstWarning.balance)}, shortfall ${money(firstWarning.shortfall)}. ${forecast.warnings.length} day(s) below your buffer.`
                    : "No projected day falls below your buffer. This forecast uses only the entries you have recorded."}
                </p>
              </div>
              <details>
                <summary>
                  Explore the daily forecast <span>30 days</span>
                </summary>
                <div className="table-scroll">
                  <table>
                    <caption className="sr-only">
                      Daily forecast balances and shortfalls
                    </caption>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Net change</th>
                        <th>Balance</th>
                        <th>Shortfall</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecast.days.map((day) => (
                        <tr
                          key={day.date}
                          className={day.shortfall ? "risk-row" : ""}
                        >
                          <td>{dateLabel(day.date)}</td>
                          <td>{money(day.change)}</td>
                          <td>{money(day.balance)}</td>
                          <td>{day.shortfall ? money(day.shortfall) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </section>
            <section className="card">
              <div className="section-title">
                <div>
                  <p className="eyebrow">WHAT’S COMING & WHAT’S BEEN</p>
                  <h2>Your entries</h2>
                </div>
                <span className="count">
                  {state.transactions.length + state.recurring.length}
                </span>
              </div>
              {!state.transactions.length && !state.recurring.length ? (
                <div className="empty">
                  <span>↗</span>
                  <h3>A fresh start.</h3>
                  <p>
                    Add your income and expenses to bring your forecast to life.
                  </p>
                </div>
              ) : (
                <ul className="entries">
                  {state.transactions.map((entry) => (
                    <li key={`t${entry.id}`}>
                      <span className={`entry-icon ${entry.type}`}>
                        {entry.type === "income" ? "↙" : "↗"}
                      </span>
                      <div>
                        <strong>{entry.description}</strong>
                        <small>
                          {dateLabel(entry.date)}{" "}
                          {entry.date < forecast.today
                            ? "· History · excluded from forecast"
                            : `· ${entry.type}`}
                        </small>
                      </div>
                      <b>
                        {entry.type === "income" ? "+" : "−"}
                        {money(entry.amount)}
                      </b>
                    </li>
                  ))}
                  {state.recurring.map((entry) => (
                    <li key={`r${entry.id}`}>
                      <span className="entry-icon">↻</span>
                      <div>
                        <strong>{entry.description}</strong>
                        <small>
                          Monthly · day {entry.day} · adjusted at month end
                        </small>
                      </div>
                      <b>−{money(entry.amount)}</b>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
          <aside>
            <section className="card">
              <h2>Your starting point</h2>
              <p className="hint">
                Enter your balance before today’s scheduled entries. Past
                entries stay in history.
              </p>
              <form
                onSubmit={(e) => submit(e, "profile")}
                key={`${state.profile.balance}-${state.profile.buffer}`}
              >
                <label>
                  Current balance (HUF)
                  <input
                    name="balance"
                    type="number"
                    step="1"
                    min="-1000000000000"
                    max="1000000000000"
                    required
                    defaultValue={state.profile.balance}
                  />
                </label>
                <label>
                  Safety buffer (HUF)
                  <input
                    name="buffer"
                    type="number"
                    step="1"
                    min="0"
                    max="1000000000000"
                    required
                    defaultValue={state.profile.buffer}
                  />
                </label>
                <button className="secondary" disabled={busy}>
                  Save profile
                </button>
              </form>
            </section>
            <section className="card">
              <h2>Plan a cash flow</h2>
              <div className="tabs" role="group" aria-label="Entry category">
                <button
                  aria-pressed={tab === "transaction"}
                  onClick={() => setTab("transaction")}
                >
                  One-time
                </button>
                <button
                  aria-pressed={tab === "recurring"}
                  onClick={() => setTab("recurring")}
                >
                  Monthly expense
                </button>
              </div>
              <form
                key={tab}
                onSubmit={(e) =>
                  submit(
                    e,
                    tab === "transaction" ? "transactions" : "recurring",
                  )
                }
              >
                <label>
                  Description
                  <input
                    name="description"
                    placeholder={
                      tab === "transaction"
                        ? "e.g. Salary or groceries"
                        : "e.g. Rent"
                    }
                    maxLength={120}
                    required
                  />
                </label>
                {tab === "transaction" && (
                  <label>
                    Type
                    <select name="type">
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </label>
                )}
                <label>
                  Amount (HUF)
                  <input
                    name="amount"
                    type="number"
                    min="1"
                    max="1000000000000"
                    step="1"
                    placeholder="0"
                    required
                  />
                </label>
                {tab === "transaction" ? (
                  <label>
                    Date
                    <input
                      name="date"
                      type="date"
                      defaultValue={forecast.today}
                      required
                    />
                  </label>
                ) : (
                  <label>
                    Day of month
                    <input
                      name="day"
                      type="number"
                      min="1"
                      max="31"
                      step="1"
                      defaultValue="1"
                      required
                    />
                  </label>
                )}
                <button disabled={busy}>
                  Add {tab === "transaction" ? "entry" : "monthly expense"}{" "}
                  <span>＋</span>
                </button>
              </form>
            </section>
            <section className="card simulator">
              <p className="eyebrow">TRY BEFORE YOU SPEND</p>
              <h2>Can it fit?</h2>
              <p className="hint">
                Try a purchase and see the impact. Nothing is saved.
              </p>
              <form onSubmit={(e) => submit(e, "simulate")}>
                <label>
                  Purchase amount (HUF)
                  <input
                    name="amount"
                    type="number"
                    min="1"
                    max="1000000000000"
                    step="1"
                    required
                    placeholder="0"
                  />
                </label>
                <label>
                  Purchase date
                  <input
                    name="date"
                    type="date"
                    min={forecast.today}
                    max={lastDate}
                    defaultValue={forecast.today}
                    required
                  />
                </label>
                <button disabled={busy}>
                  Simulate purchase <span>→</span>
                </button>
              </form>
            </section>
          </aside>
        </div>
        <footer>
          <span>CoCash · Small plans. More peace of mind.</span>
          <span>Manual entries · Whole HUF · Stored on this device</span>
        </footer>
      </main>
    </>
  );
}
