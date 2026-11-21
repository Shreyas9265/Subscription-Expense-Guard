import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Analysis } from '../lib/api';
import { monthlyEquivalent, spendByMonth, subName, usd } from '../lib/derive';

const SLOTS = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)'];
const colorFor = (series: string[], key: string) =>
  key === 'Other' ? 'var(--s-other)' : SLOTS[series.indexOf(key)] ?? 'var(--s-other)';
const axis = { fill: 'var(--faint)', fontSize: 12, fontFamily: 'var(--f-mono)' };

type TipProps = {
  active?: boolean;
  payload?: { name: string; value: number; color?: string; fill?: string }[];
  label?: string;
  total?: boolean;
};

function Tip({ active, payload, label, total }: TipProps) {
  if (!active || !payload?.length) return null;
  const sum = payload.reduce((n, p) => n + (p.value ?? 0), 0);
  const rows = payload.slice().reverse();
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-[13px] shadow-lg">
      <p className="m-0 mb-1 font-bold text-ink">{label}</p>
      {rows.map((p) => (
        <p key={p.name} className="m-0 flex items-center justify-between gap-5 text-muted">
          <span className="flex items-center gap-1.5">
            <i className="inline-block size-2.5 rounded-sm" style={{ background: p.color ?? p.fill }} />
            {p.name}
          </span>
          <span className="num font-semibold text-ink">{usd(p.value)}</span>
        </p>
      ))}
      {total && payload.length > 1 && (
        <p className="m-0 mt-1 flex justify-between gap-5 border-t border-line pt-1 font-bold text-ink">
          <span>Total</span>
          <span className="num">{usd(sum)}</span>
        </p>
      )}
    </div>
  );
}

/** Spend per month, stacked by the top categories (fixed slot order, "Other" in neutral gray). */
export function SpendChart({ a }: { a: Analysis }) {
  const { rows, series } = spendByMonth(a.transactions, 5);
  return (
    <section className="card min-w-0 p-5" aria-labelledby="sp-h">
      <h2 id="sp-h" className="m-0 text-lg font-bold">Monthly spending</h2>
      <p className="m-0 mt-1 text-[13px] text-faint">All transactions, by category. Hover a bar for the breakdown.</p>
      <ul className="m-0 mt-3 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-[12.5px] text-muted" aria-label="Legend">
        {series.map((s) => (
          <li key={s} className="flex items-center gap-1.5">
            <i className="inline-block size-2.5 rounded-sm" style={{ background: colorFor(series, s) }} />
            {s}
          </li>
        ))}
      </ul>
      <div className="mt-3 h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke="var(--line)" />
            <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
            <YAxis tick={axis} axisLine={false} tickLine={false} width={52} tickFormatter={(v) => `$${v}`} />
            <Tooltip cursor={{ fill: 'var(--surface-2)' }} content={<Tip total />} />
            {series.map((s, i) => (
              <Bar
                key={s}
                dataKey={s}
                name={s}
                stackId="m"
                fill={colorFor(series, s)}
                stroke="var(--chart-surface)"
                strokeWidth={2}
                radius={i === series.length - 1 ? [4, 4, 0, 0] : 0}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

/** What each subscription costs per month (weekly ones converted), largest first. */
export function CostChart({ a }: { a: Analysis }) {
  const data = a.subscriptions
    .map((s) => ({ name: subName(s), value: Math.round(monthlyEquivalent(s) * 100) / 100 }))
    .sort((x, y) => y.value - x.value);
  return (
    <section className="card min-w-0 p-5" aria-labelledby="co-h">
      <h2 id="co-h" className="m-0 text-lg font-bold">Cost per subscription</h2>
      <p className="m-0 mt-1 text-[13px] text-faint">Monthly equivalent; weekly charges × 52 ÷ 12.</p>
      <div className="mt-3" style={{ height: Math.max(180, data.length * 34 + 20) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 64, left: 4, bottom: 0 }} barCategoryGap="22%">
            <CartesianGrid horizontal={false} stroke="var(--line)" />
            <XAxis type="number" tick={axis} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
            <YAxis
              type="category"
              dataKey="name"
              width={150}
              tick={{ ...axis, fill: 'var(--muted)', fontFamily: 'var(--f-body)', fontSize: 12.5 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip cursor={{ fill: 'var(--surface-2)' }} content={<Tip />} />
            <Bar
              dataKey="value"
              name="Per month"
              fill="var(--s1)"
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
              label={{ position: 'right', formatter: (v: unknown) => usd(Number(v)), fill: 'var(--muted)', fontSize: 12, fontFamily: 'var(--f-mono)' }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
