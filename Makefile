run:
	uvicorn app.main:app --reload

test:
	pytest -q

fmt:
	python -m black app || true
