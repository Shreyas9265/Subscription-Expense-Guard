const STEPS = [
  {
    n: '01',
    title: 'Ingest the CSV',
    body: 'Finds the date, merchant and amount columns by name (e.g. date / transaction_date / posted_date) and accepts ISO or US dates.',
    code: 'ingestion.parse_csv_to_transactions',
  },
  {
    n: '02',
    title: 'Normalize merchants',
    body: 'Lower-cases, strips punctuation and words like Inc / LLC / Ltd, so “NETFLIX.COM” and “Netflix Inc.” group together.',
    code: 'utils.normalize_merchant',
  },
  {
    n: '03',
    title: 'Detect cadence',
    body: 'A merchant with 3+ charges is a subscription when the average gap is 26–33 days (monthly) or 6–8 days (weekly).',
    code: 'utils.detect_subscription',
  },
  {
    n: '04',
    title: 'Flag anomalies',
    body: 'A charge more than 25% above that merchant’s average is a price hike; identical amounts on the same day are duplicates.',
    code: 'utils.detect_anomalies',
  },
  {
    n: '05',
    title: 'Forecast',
    body: 'Next charge = last charge + 30 days (monthly) or + 7 days (weekly). Monthly cost converts weekly charges × 52 ÷ 12.',
    code: 'next_charge',
  },
];

const DECISIONS = [
  {
    title: 'Stateless /analyze for serverless',
    body: 'Vercel functions don’t share memory, so an upload saved by one instance may be invisible to the next request. POST /analyze returns transactions, subscriptions and anomalies in one response, with nothing stored.',
  },
  {
    title: 'Same rules, two entry points',
    body: 'The REST endpoints (SQLAlchemy + SQLite, recomputed every 10 minutes by APScheduler) and /analyze call the same detection functions, so the dashboard and the API can’t disagree.',
  },
  {
    title: 'Explainable over clever',
    body: 'Rule-based detection with fixed thresholds means every flag can be explained in one sentence. A model would need labeled data this project doesn’t have.',
  },
  {
    title: 'Quality gates',
    body: 'GitHub Actions runs ruff, black and pytest on every push, including tests that the sample statement yields the expected subscriptions and no false positives.',
  },
];

const STACK = ['React 19', 'TypeScript', 'Vite', 'Tailwind CSS v4', 'Recharts', 'FastAPI', 'Pydantic', 'SQLAlchemy', 'APScheduler', 'pytest', 'Vercel'];

/** The interview section: the detection pipeline, the architecture and the design decisions. */
export default function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 pt-6" aria-labelledby="how-h">
      <p className="eyebrow m-0">Under the hood</p>
      <h2 id="how-h" className="m-0 mt-2 text-[clamp(24px,3vw,32px)] font-extrabold tracking-tight">How the detection works</h2>

      <ol className="m-0 mt-5 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-5">
        {STEPS.map((s) => (
          <li key={s.n} className="card relative grid content-start gap-2 p-4">
            <span className="font-mono text-[12px] font-semibold text-brand">{s.n}</span>
            <h3 className="m-0 text-[15px] font-bold">{s.title}</h3>
            <p className="m-0 text-[13.5px] leading-relaxed text-muted">{s.body}</p>
            <code className="mt-auto w-fit rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11.5px] text-faint">{s.code}</code>
          </li>
        ))}
      </ol>

      <div className="card mt-4 overflow-x-auto p-5">
        <h3 className="m-0 text-[15px] font-bold">Architecture</h3>
        <svg viewBox="0 0 860 150" className="mt-3 h-auto w-full min-w-[640px]" role="img"
          aria-label="Browser with React dashboard calls the Vercel edge, which serves static files from the CDN and routes /analyze and API calls to a FastAPI serverless function using the shared detection rules.">
          <defs>
            <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0L10 5L0 10z" fill="var(--faint)" />
            </marker>
          </defs>
          {[
            { x: 10, t: 'Browser', s: 'React + Recharts' },
            { x: 230, t: 'Vercel CDN', s: 'static dashboard' },
            { x: 450, t: 'FastAPI function', s: '/analyze · /subscriptions …' },
            { x: 670, t: 'Detection rules', s: 'normalize · cadence · anomalies' },
          ].map((b) => (
            <g key={b.t}>
              <rect x={b.x} y={40} width={180} height={70} rx={12} fill="var(--surface-2)" stroke="var(--line)" />
              <text x={b.x + 90} y={70} textAnchor="middle" fill="var(--ink)" fontSize="15" fontWeight="700" fontFamily="var(--f-body)">{b.t}</text>
              <text x={b.x + 90} y={92} textAnchor="middle" fill="var(--muted)" fontSize="12" fontFamily="var(--f-mono)">{b.s}</text>
            </g>
          ))}
          {[190, 410, 630].map((x) => (
            <line key={x} x1={x + 4} y1={75} x2={x + 36} y2={75} stroke="var(--faint)" strokeWidth="2" markerEnd="url(#arr)" />
          ))}
          <text x={300} y={130} textAnchor="middle" fill="var(--faint)" fontSize="11.5" fontFamily="var(--f-mono)">one origin, no CORS</text>
          <text x={540} y={130} textAnchor="middle" fill="var(--faint)" fontSize="11.5" fontFamily="var(--f-mono)">CSV in, JSON out, nothing stored</text>
        </svg>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {DECISIONS.map((d) => (
          <div key={d.title} className="card p-4">
            <h3 className="m-0 text-[15px] font-bold">{d.title}</h3>
            <p className="m-0 mt-1.5 text-[13.5px] leading-relaxed text-muted">{d.body}</p>
          </div>
        ))}
      </div>

      <ul className="m-0 mt-4 flex list-none flex-wrap gap-1.5 p-0" aria-label="Tech stack">
        {STACK.map((s) => <li key={s} className="chip">{s}</li>)}
      </ul>
    </section>
  );
}
