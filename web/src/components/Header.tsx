import { useEffect, useState } from 'react';

const REPO = 'https://github.com/Shreyas9265/Subscription-Expense-Guard';

function readTheme(): 'light' | 'dark' {
  try {
    const t = localStorage.getItem('seg-theme');
    if (t === 'light' || t === 'dark') return t;
  } catch { /* storage blocked */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function Header() {
  const [theme, setTheme] = useState(readTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('seg-theme', theme); } catch { /* storage blocked */ }
  }, [theme]);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
      <div className="wrap flex items-center justify-between gap-4 py-3">
        <a href="#top" className="flex items-center gap-2.5 no-underline">
          <span className="grid size-8 place-items-center rounded-lg bg-brand text-brand-ink" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
              <path d="M12 3l7 2.6v5.2c0 4.4-3 7.9-7 9.6-4-1.7-7-5.2-7-9.6V5.6z" /><path d="M9 12l2.2 2.2L15.5 10" />
            </svg>
          </span>
          <span className="font-extrabold tracking-tight text-ink">Expense Guard</span>
        </a>
        <nav className="flex items-center gap-1.5 text-sm sm:gap-2">
          <a className="btn hidden !py-2 sm:inline-flex" href="#how">How it works</a>
          <a className="btn !py-2" href="/docs" target="_blank" rel="noopener">API docs</a>
          <a className="btn hidden !py-2 md:inline-flex" href={REPO} target="_blank" rel="noopener">GitHub ↗</a>
          <button type="button" className="btn !px-2.5 !py-2" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} title="Toggle theme">
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </nav>
      </div>
    </header>
  );
}
