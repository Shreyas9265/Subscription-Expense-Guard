import type { Analysis } from '../lib/api';
import { groupAlerts, monthlyEquivalent, upcomingCharges, usd } from '../lib/derive';

/** The four numbers that matter, in plain words. */
export default function Kpis({ a }: { a: Analysis }) {
  const monthly = a.subscriptions.reduce((n, s) => n + monthlyEquivalent(s), 0);
  const next30 = upcomingCharges(a, 30).reduce((n, u) => n + u.amount, 0);
  const alerts = groupAlerts(a);
  const weekly = a.subscriptions.filter((s) => s.cadence === 'weekly').length;
  const tiles = [
    { label: 'Recurring per month', value: usd(monthly), note: `${usd(monthly * 12, 0)} a year` },
    { label: 'Subscriptions found', value: String(a.subscriptions.length), note: `${a.subscriptions.length - weekly} monthly · ${weekly} weekly` },
    { label: 'Due in next 30 days', value: usd(next30), note: `${upcomingCharges(a, 30).length} expected charges` },
    { label: 'Needs attention', value: String(alerts.length), note: alerts.length ? 'price hikes & duplicates' : 'nothing unusual', alert: alerts.length > 0 },
  ];
  return (
    <section aria-label="Summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="card grid gap-1 p-4">
          <span className="text-[13px] font-semibold text-muted">{t.label}</span>
          <span className={`num text-[clamp(24px,3vw,32px)] font-extrabold leading-tight tracking-tight ${t.alert ? 'text-critical' : 'text-ink'}`}>
            {t.alert && <span aria-hidden="true" className="mr-1.5 text-[0.7em]">⚠</span>}{t.value}
          </span>
          <span className="text-[12.5px] text-faint">{t.note}</span>
        </div>
      ))}
    </section>
  );
}
