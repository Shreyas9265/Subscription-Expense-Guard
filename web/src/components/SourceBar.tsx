import { useRef, useState } from 'react';

type Props = {
  source: 'sample' | 'upload';
  fileName: string | null;
  busy: boolean;
  error: string | null;
  onFile: (f: File) => void;
  onSample: () => void;
  txnCount: number;
  range: [string, string] | null;
};

/** Hero + data source: the bundled sample statement, or the visitor's own CSV (analyzed, never stored). */
export default function SourceBar({ source, fileName, busy, error, onFile, onSample, txnCount, range }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const pick = (files: FileList | null) => { if (files?.[0]) onFile(files[0]); };

  return (
    <section id="top" className="grid gap-6 pb-6 pt-8 lg:grid-cols-[1.3fr_1fr] lg:items-end lg:pt-12">
      <div className="min-w-0">
        <p className="eyebrow m-0">Personal finance · FastAPI + React</p>
        <h1 className="m-0 mt-2 text-[clamp(30px,4.4vw,46px)] font-extrabold leading-[1.05] tracking-tight text-ink [text-wrap:balance]">
          Find every subscription hiding in your bank statement.
        </h1>
        <p className="m-0 mt-3 max-w-[56ch] text-[15.5px] leading-relaxed text-muted">
          Drop in a CSV export. Expense Guard spots recurring charges, forecasts what's coming next, and flags price hikes and duplicate charges.
        </p>
      </div>

      <div
        className={`card grid gap-3 p-4 transition-colors ${drag ? 'border-brand bg-brand-soft' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files); }}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="eyebrow">Data source</span>
          {source === 'upload'
            ? <span className="chip !border-brand !bg-brand-soft !text-brand">Your file</span>
            : <span className="chip">Sample data</span>}
        </div>
        <p className="m-0 text-sm text-ink">
          {source === 'upload'
            ? <><b className="font-bold">{fileName}</b> · analyzed in one request, nothing stored</>
            : <><b className="font-bold">6-month sample statement</b> (synthetic, for the demo)</>}
          {range && <span className="text-muted"> · {txnCount} transactions, {range[0]} – {range[1]}</span>}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => input.current?.click()}>
            {busy ? 'Analyzing…' : '⤒ Upload CSV'}
          </button>
          {source === 'upload' && <button type="button" className="btn" onClick={onSample} disabled={busy}>Back to sample</button>}
          <a className="btn" href="/sample/demo_transactions.csv" download>Download sample CSV</a>
        </div>
        <p className="m-0 text-xs text-faint">or drag a file here · needs <code className="font-mono">date</code>, <code className="font-mono">merchant</code> and <code className="font-mono">amount</code> columns · up to 2 MB</p>
        {error && <p role="alert" className="m-0 rounded-lg border border-critical/40 bg-critical/10 px-3 py-2 text-sm text-ink">⚠ {error}</p>}
        <input ref={input} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { pick(e.target.files); e.target.value = ''; }} />
      </div>
    </section>
  );
}
