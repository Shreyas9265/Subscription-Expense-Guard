#!/usr/bin/env bash
# Deploy to Vercel (free Hobby plan): https://subscription-expense-guard.vercel.app
# Builds the React dashboard into public/ (served by the CDN at "/") next to the FastAPI
# serverless function (app + requirements + entry point), then deploys both.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$(mktemp -d)"
cp -R "$ROOT/app" "$OUT/app" && rm -rf "$OUT/app/tests"
grep -v uvicorn "$ROOT/requirements.txt" > "$OUT/requirements.txt"
cp "$ROOT/vercel/index.py" "$OUT/index.py"
(cd "$ROOT/web" && npm ci && npm run build)
cp -R "$ROOT/web/dist" "$OUT/public"
echo "3.12" > "$OUT/.python-version"
cd "$OUT" && npx vercel deploy --prod --yes --name expense-guard
