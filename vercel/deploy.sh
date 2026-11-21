#!/usr/bin/env bash
# Deploy a self-seeding live demo to Vercel (free Hobby plan): https://subscription-expense-guard.vercel.app/docs
# Builds a clean serverless bundle (app + requirements + entry point) and deploys it.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$(mktemp -d)"
cp -R "$ROOT/app" "$OUT/app" && rm -rf "$OUT/app/tests"
grep -v uvicorn "$ROOT/requirements.txt" > "$OUT/requirements.txt"
cp "$ROOT/vercel/index.py" "$OUT/index.py"
echo "3.12" > "$OUT/.python-version"
cd "$OUT" && npx vercel deploy --prod --yes --name expense-guard
