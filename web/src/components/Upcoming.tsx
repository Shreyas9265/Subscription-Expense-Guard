import type { Analysis } from '../lib/api';
import { fmtDate, statementEnd, subName, upcomingCharges, usd } from '../lib/derive';

/** The next 30 days of expected charges, as a dated list. */
export default function Upcoming({ a }: { a: Analysis }) {
  const items = upcomingCharges(a, 30);
  const total = items.reduce((n, u) => n + u.amount, 0);
  return (
    <section className="card flex min-w-0 flex-col p-5" aria-labelledby="up-h">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="up-h" className="m-0 text-lg font-bold">Coming up</h2>
        <span className="num text-sm text-muted">next 30 days · <b className="text-ink">{usd(total)}</b></span>
      </div>
      <p className="m-0 mt-1 text-[13px] text-faint">
        Forecast from each subscription's cadence, after {fmtDate(statementEnd(a), { month: 'long', day: 'numeric' })}.
      </p>
      {items.length === 0 ? (
        <p className="m-0 mt-6 text-sm text-muted">No recurring charges expected in the next 30 days.</p>
      ) : (
        <ol className="m-0 mt-4 grid list-none gap-1 p-0">
          {items.map((u, i) => (
            <li key={i} className="grid grid-cols-[58px_1fr_auto] items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-2">
              <span className="num text-center font-mono text-[12px] leading-tight text-muted">
                <span className="block text-[10px] uppercase tracking-wider">{fmtDate(u.date, { weekday: 'short' })}</span>
                {fmtDate(u.date)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">{subName(u.sub)}</span>
                <span className="text-[12px] text-faint">{u.sub.cadence} · {u.sub.category ?? 'Uncategorized'}</span>
              </span>
              <span className="num text-sm font-bold text-ink">{usd(u.amount)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
