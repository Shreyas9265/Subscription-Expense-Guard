# Contributing

Thanks for your interest in contributing to Subscription Expense Guard (SEA)!

## Development Setup
```bash
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt -r requirements-dev.txt
uvicorn app.main:app --reload
```

Run tests:
```bash
pytest -q
```

Format & lint (pre-commit):
```bash
pre-commit install
pre-commit run --all-files
```

## Branching
- Use feature branches: `feat/<short-desc>` or `fix/<short-desc>`
- Open PRs against `main`

## Code Style
- Python 3.11
- Black (line-length 100) and Ruff (fast lint)
- Keep modules small and typed where possible

## Commit Messages
- Use imperative tense, e.g., "Add forecast endpoint"
