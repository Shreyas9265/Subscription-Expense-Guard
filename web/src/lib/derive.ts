import type { Analysis, Anomaly, Subscription, Txn } from './api';

/** A weekly charge happens 52 times a year: its monthly equivalent is amount * 52 / 12. */
export const monthlyEquivalent = (s: Subscription) =>
  s.cadence === 'weekly' ? (s.last_amount * 52) / 12 : s.last_amount;

export const usd = (n: number, digits = 2) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits });

export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-US', opts);

/** "Today" for the forecast is the day after the statement's last transaction. */
export function statementEnd(a: Analysis) {
  const last = a.transactions.reduce((m, t) => (t.date > m ? t.date : m), '');
  return last || new Date().toISOString().slice(0, 10);
}

/** Bank-statement noise to drop from display names ("APPLE.COM/BILL", "SPOTIFY USA", "STARBUCKS #11203"). */
const NOISE = new Set(['com', 'bill', 'usa', 'subscr', 'subscription', 'pmts', 'mktplace', 'trip', 'inc', 'llc', 'ltd', 'co']);
const BRAND_CASE: Record<string, string> = { icloud: 'iCloud', chatgpt: 'ChatGPT', openai: 'OpenAI', hellofresh: 'HelloFresh' };

/** Turn a normalized merchant ("apple com bill icloud") into a readable name ("Apple iCloud"). */
export const titleCase = (s: string) => {
  const words = s.split(/\s+/).filter((w) => w && !NOISE.has(w) && !/^\d+$/.test(w));
  const cleaned = (words.length ? words : s.split(/\s+/)).map((w) => BRAND_CASE[w] ?? w.charAt(0).toUpperCase() + w.slice(1));
  return cleaned.join(' ');
};

/** Readable name for a subscription: the normalized merchant, title-cased. */
export const subName = (s: Pick<Subscription, 'normalized_merchant'>) => titleCase(s.normalized_merchant);

export type Upcoming = { sub: Subscription; date: string; amount: number };

/** Every charge expected in the next `days` days, repeating weekly ones. */
export function upcomingCharges(a: Analysis, days = 30): Upcoming[] {
  const start = new Date(statementEnd(a) + 'T00:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + days);
  const out: Upcoming[] = [];
  for (const s of a.subscriptions) {
    let d = new Date(s.next_charge + 'T00:00:00');
    const step = s.cadence === 'weekly' ? 7 : 30;
    while (d <= end) {
      if (d > start) out.push({ sub: s, date: d.toISOString().slice(0, 10), amount: s.last_amount });
      d = new Date(d);
      d.setDate(d.getDate() + step);
    }
  }
  return out.sort((x, y) => x.date.localeCompare(y.date));
}

export type AlertGroup = { key: string; type: Anomaly['type']; title: string; detail: string; date: string; txns: Txn[] };

/** Duplicate anomalies come one per charge; group them so each incident shows once. */
export function groupAlerts(a: Analysis): AlertGroup[] {
  const groups = new Map<string, AlertGroup>();
  for (const an of a.anomalies) {
    const t = an.transaction;
    const key = an.type === 'duplicate' ? `dup:${t.normalized_merchant}:${t.date}:${t.amount}` : `hike:${t.id}`;
    const g = groups.get(key);
    if (g) {
      g.txns.push(t);
      continue;
    }
    const name = titleCase(t.normalized_merchant);
    groups.set(key, {
      key,
      type: an.type,
      title: an.type === 'price_hike' ? `${name} price jumped to ${usd(t.amount)}` : `${name} charged twice`,
      detail: an.message,
      date: t.date,
      txns: [t],
    });
  }
  return [...groups.values()].sort((x, y) => y.date.localeCompare(x.date));
}

export type MonthRow = { month: string; label: string; total: number } & Record<string, number | string>;

/** Spend per month, split into the top `n` categories plus "Other". */
export function spendByMonth(txns: Txn[], n = 5) {
  const byCat = new Map<string, number>();
  for (const t of txns) byCat.set(t.category ?? 'Uncategorized', (byCat.get(t.category ?? 'Uncategorized') ?? 0) + t.amount);
  const ranked = [...byCat.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  const shown = ranked.slice(0, n);
  const hasOther = ranked.length > n;
  const months = new Map<string, MonthRow>();
  for (const t of txns) {
    const m = t.date.slice(0, 7);
    const row = months.get(m) ?? ({ month: m, label: fmtDate(m + '-01', { month: 'short' }), total: 0 } as MonthRow);
    const cat = t.category ?? 'Uncategorized';
    const key = shown.includes(cat) ? cat : 'Other';
    row[key] = ((row[key] as number) ?? 0) + t.amount;
    row.total += t.amount;
    months.set(m, row);
  }
  const rows = [...months.values()].sort((a, b) => a.month.localeCompare(b.month));
  for (const r of rows) for (const k of [...shown, ...(hasOther ? ['Other'] : [])]) r[k] = Math.round(((r[k] as number) ?? 0) * 100) / 100;
  return { rows, series: [...shown, ...(hasOther ? ['Other'] : [])] };
}

export const isRecurring = (a: Analysis) => {
  const set = new Set(a.subscriptions.map((s) => s.normalized_merchant));
  return (t: Txn) => set.has(t.normalized_merchant);
};
