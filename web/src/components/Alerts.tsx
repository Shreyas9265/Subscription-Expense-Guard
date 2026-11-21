import type { Analysis } from '../lib/api';
import { fmtDate, groupAlerts, usd } from '../lib/derive';

const META: Record<string, { label: string; icon: string; color: string }> = {
  price_hike: { label: 'Price hike', icon: '▲', color: 'var(--serious)' },
  duplicate: { label: 'Duplicate charge', icon: '⧉', color: 'var(--critical)' },
};

/** Price hikes and duplicate charges, one card per incident. Status is icon + label, never color alone. */
export default function Alerts({ a }: { a: Analysis }) {
  const alerts = groupAlerts(a);
  return (
    <section className="card flex min-w-0 flex-col p-5" aria-labelledby="al-h">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="al-h" className="m-0 text-lg font-bold">Needs attention</h2>
        <span className="text-sm text-muted">{alerts.length} {alerts.length === 1 ? 'alert' : 'alerts'}</span>
      </div>
      <p className="m-0 mt-1 text-[13px] text-faint">Charges 25%+ above a merchant's average, and identical charges on the same day.</p>
      {alerts.length === 0 ? (
        <p className="m-0 mt-6 text-sm text-muted">✓ Nothing unusual in this statement.</p>
      ) : (
        <ul className="m-0 mt-4 grid list-none gap-2.5 p-0">
          {alerts.map((g) => {
            const m = META[g.type] ?? { label: g.type, icon: '!', color: 'var(--warning)' };
            const extra = g.txns[0].amount * (g.txns.length - 1);
            return (
              <li key={g.key} className="rounded-xl border border-line bg-surface-2 p-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] font-bold text-ink"
                    style={{
                      background: `color-mix(in srgb, ${m.color} 18%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${m.color} 55%, transparent)`,
                    }}
                  >
                    <span aria-hidden="true" style={{ color: m.color }}>{m.icon}</span>
                    {m.label}
                  </span>
                  <span className="num font-mono text-[12px] text-faint">
                    {fmtDate(g.date, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <p className="m-0 mt-2 text-sm font-semibold text-ink">{g.title}</p>
                <p className="m-0 mt-0.5 text-[13px] text-muted">
                  {g.type === 'duplicate'
                    ? `${g.txns.length} identical charges of ${usd(g.txns[0].amount)}: ${usd(extra)} you may be able to get back.`
                    : g.detail}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
