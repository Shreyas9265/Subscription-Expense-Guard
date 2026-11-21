import { useMemo, useState } from 'react';
import type { Analysis, Subscription } from '../lib/api';
import { fmtDate, isRecurring, monthlyEquivalent, subName, usd } from '../lib/derive';

type SortKey = 'name' | 'cadence' | 'monthly' | 'yearly' | 'next' | 'charges';

const yearly = (s: Subscription) => monthlyEquivalent(s) * 12;

/** Every detected subscription; click a column header to sort. */
export function SubscriptionsTable({ a }: { a: Analysis }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'monthly', dir: -1 });
  const rows = useMemo(() => {
    const val = (s: Subscription): string | number => {
      switch (sort.key) {
        case 'name': return subName(s);
        case 'cadence': return s.cadence;
        case 'monthly': return monthlyEquivalent(s);
        case 'yearly': return yearly(s);
        case 'next': return s.next_charge;
        case 'charges': return s.charges;
      }
    };
    return [...a.subscriptions].sort((x, y) => (val(x) > val(y) ? 1 : val(x) < val(y) ? -1 : 0) * sort.dir);
  }, [a.subscriptions, sort]);

  const Th = ({ k, children, right }: { k: SortKey; children: string; right?: boolean }) => {
    const active = sort.key === k;
    return (
      <th scope="col" aria-sort={active ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'} className={`px-3 py-2.5 font-semibold ${right ? 'text-right' : 'text-left'}`}>
        <button type="button" className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-muted hover:text-ink"
          onClick={() => setSort({ key: k, dir: active ? (sort.dir === 1 ? -1 : 1) : k === 'name' || k === 'next' ? 1 : -1 })}>
          {children} {active ? (sort.dir === 1 ? '↑' : '↓') : ''}
        </button>
      </th>
    );
  };

  const totalMonthly = a.subscriptions.reduce((n, s) => n + monthlyEquivalent(s), 0);
  return (
    <section className="card min-w-0 p-5" aria-labelledby="st-h">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="st-h" className="m-0 text-lg font-bold">Subscriptions</h2>
        <span className="num text-sm text-muted">{usd(totalMonthly)}/mo · <b className="text-ink">{usd(totalMonthly * 12, 0)}/yr</b></span>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className="border-b border-line text-[12.5px]">
            <tr>
              <Th k="name">Merchant</Th>
              <Th k="cadence">Cadence</Th>
              <Th k="monthly" right>Per month</Th>
              <Th k="yearly" right>Per year</Th>
              <Th k="charges" right>Charges seen</Th>
              <Th k="next" right>Next charge</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.normalized_merchant} className="border-b border-line last:border-0 hover:bg-surface-2">
                <td className="px-3 py-2.5">
                  <span className="block font-semibold text-ink">{subName(s)}</span>
                  <span className="text-[12px] text-faint">{s.category ?? 'Uncategorized'} · as “{s.merchant}”</span>
                </td>
                <td className="px-3 py-2.5"><span className="chip">{s.cadence}</span></td>
                <td className="num px-3 py-2.5 text-right font-semibold text-ink">{usd(monthlyEquivalent(s))}</td>
                <td className="num px-3 py-2.5 text-right text-muted">{usd(yearly(s), 0)}</td>
                <td className="num px-3 py-2.5 text-right text-muted">{s.charges}</td>
                <td className="num px-3 py-2.5 text-right font-mono text-[13px] text-ink">{fmtDate(s.next_charge, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const PAGE = 15;

/** All transactions with search, a recurring-only filter, and paging. */
export function TransactionsTable({ a }: { a: Analysis }) {
  const [q, setQ] = useState('');
  const [onlyRecurring, setOnlyRecurring] = useState(false);
  const [page, setPage] = useState(0);
  const recurring = useMemo(() => isRecurring(a), [a]);
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return [...a.transactions]
      .reverse()
      .filter((t) => (!onlyRecurring || recurring(t)) && (!needle || `${t.merchant} ${t.category ?? ''}`.toLowerCase().includes(needle)));
  }, [a.transactions, q, onlyRecurring, recurring]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const current = Math.min(page, pages - 1);
  const shown = rows.slice(current * PAGE, current * PAGE + PAGE);

  return (
    <section className="card min-w-0 p-5" aria-labelledby="tx-h">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="tx-h" className="m-0 text-lg font-bold">Transactions</h2>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
            <input id="only-recurring" type="checkbox" checked={onlyRecurring} onChange={(e) => { setOnlyRecurring(e.target.checked); setPage(0); }} className="accent-[var(--brand)]" />
            Recurring only
          </label>
          <input id="tx-search" type="search" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search merchant or category"
            className="w-56 rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-faint" />
        </div>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-sm">
          <thead className="border-b border-line text-left text-[12.5px] text-muted">
            <tr>
              <th scope="col" className="px-3 py-2.5 font-semibold">Date</th>
              <th scope="col" className="px-3 py-2.5 font-semibold">Merchant</th>
              <th scope="col" className="px-3 py-2.5 font-semibold">Category</th>
              <th scope="col" className="px-3 py-2.5 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((t) => (
              <tr key={t.id} className="border-b border-line last:border-0 hover:bg-surface-2">
                <td className="num px-3 py-2 font-mono text-[13px] text-muted">{t.date}</td>
                <td className="px-3 py-2 text-ink">
                  {t.merchant}
                  {recurring(t) && <span className="chip ml-2 !py-0 !text-[11px]">recurring</span>}
                </td>
                <td className="px-3 py-2 text-muted">{t.category ?? '—'}</td>
                <td className="num px-3 py-2 text-right font-semibold text-ink">{usd(t.amount)}</td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan={4} className="px-3 py-8 text-center text-muted">No transactions match “{q}”.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm text-muted">
        <span className="num">{rows.length} transactions</span>
        <div className="flex items-center gap-2">
          <button type="button" className="btn !px-3 !py-1.5" disabled={current === 0} onClick={() => setPage(current - 1)}>← Prev</button>
          <span className="num">{current + 1} / {pages}</span>
          <button type="button" className="btn !px-3 !py-1.5" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>Next →</button>
        </div>
      </div>
    </section>
  );
}
