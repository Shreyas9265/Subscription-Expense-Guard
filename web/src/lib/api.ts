export type Txn = {
  id: number;
  date: string;
  merchant: string;
  amount: number;
  category: string | null;
  currency: string;
  normalized_merchant: string;
};

export type Subscription = {
  normalized_merchant: string;
  merchant: string;
  category: string | null;
  cadence: 'monthly' | 'weekly';
  avg_amount: number;
  last_amount: number;
  charges: number;
  last_charge: string;
  next_charge: string;
};

export type Anomaly = { type: 'price_hike' | 'duplicate' | string; message: string; transaction: Txn };

export type Analysis = {
  source: 'sample' | 'upload';
  transactions: Txn[];
  subscriptions: Subscription[];
  anomalies: Anomaly[];
};

async function readError(r: Response) {
  try {
    const j = await r.json();
    return typeof j.detail === 'string' ? j.detail : `Request failed (${r.status})`;
  } catch {
    return `Request failed (${r.status})`;
  }
}

export async function fetchSample(): Promise<Analysis> {
  const r = await fetch('/analyze/sample');
  if (!r.ok) throw new Error(await readError(r));
  return r.json();
}

export async function analyzeFile(file: File): Promise<Analysis> {
  const body = new FormData();
  body.append('file', file);
  const r = await fetch('/analyze', { method: 'POST', body });
  if (!r.ok) throw new Error(await readError(r));
  return r.json();
}
