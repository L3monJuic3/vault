FROM python:3.12-slim

WORKDIR /app

# Install dependencies first (cached layer)
COPY pyproject.toml .
RUN pip install --no-cache-dir -e .

# Copy app code
COPY app/ app/
COPY alembic/ alembic/
COPY alembic.ini .
COPY scripts/ scripts/

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
