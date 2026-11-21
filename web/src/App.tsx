import { useCallback, useEffect, useState } from 'react';
import Header from './components/Header';
import SourceBar from './components/SourceBar';
import Kpis from './components/Kpis';
import Upcoming from './components/Upcoming';
import Alerts from './components/Alerts';
import { CostChart, SpendChart } from './components/Charts';
import { SubscriptionsTable, TransactionsTable } from './components/Tables';
import HowItWorks from './components/HowItWorks';
import { analyzeFile, fetchSample, type Analysis } from './lib/api';
import { fmtDate } from './lib/derive';

const AUTHOR = { name: 'Shreyas Peddireddy', site: 'https://shreyas-peddireddy.vercel.app', repo: 'https://github.com/Shreyas9265/Subscription-Expense-Guard' };

export default function App() {
  const [data, setData] = useState<Analysis | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSample = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      setData(await fetchSample());
      setFileName(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the sample statement.');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { void loadSample(); }, [loadSample]);

  const onFile = async (f: File) => {
    setBusy(true);
    setError(null);
    try {
      setData(await analyzeFile(f));
      setFileName(f.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That file could not be analyzed.');
    } finally {
      setBusy(false);
    }
  };

  const dates = data?.transactions.map((t) => t.date).sort() ?? [];
  const range: [string, string] | null = dates.length
    ? [fmtDate(dates[0], { month: 'short', year: 'numeric' }), fmtDate(dates[dates.length - 1], { month: 'short', year: 'numeric' })]
    : null;

  return (
    <>
      <Header />
      <main className="wrap pb-16">
        <SourceBar source={data?.source ?? 'sample'} fileName={fileName} busy={busy} error={error} onFile={onFile}
          onSample={loadSample} txnCount={data?.transactions.length ?? 0} range={range} />
        {!data ? (
          <div className="grid gap-3" aria-busy="true" aria-label="Loading analysis">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => <div key={i} className="card h-[108px] animate-pulse" />)}
            </div>
            <div className="card h-[320px] animate-pulse" />
          </div>
        ) : (
          <div className={`grid gap-4 transition-opacity ${busy ? 'opacity-60' : ''}`}>
            <Kpis a={data} />
            <div className="grid gap-4 lg:grid-cols-2">
              <Upcoming a={data} />
              <Alerts a={data} />
            </div>
            <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
              <SpendChart a={data} />
              <CostChart a={data} />
            </div>
            <SubscriptionsTable a={data} />
            <TransactionsTable a={data} />
          </div>
        )}
        <HowItWorks />
      </main>
      <footer className="border-t border-line">
        <div className="wrap flex flex-wrap items-center justify-between gap-3 py-6 text-sm text-muted">
          <span>Built by <a className="font-semibold text-ink" href={AUTHOR.site} target="_blank" rel="noopener">{AUTHOR.name}</a></span>
          <span className="flex gap-4">
            <a href={AUTHOR.repo} target="_blank" rel="noopener" className="text-muted hover:text-ink">Source on GitHub</a>
            <a href="/docs" target="_blank" rel="noopener" className="text-muted hover:text-ink">API docs</a>
          </span>
        </div>
      </footer>
    </>
  );
}
