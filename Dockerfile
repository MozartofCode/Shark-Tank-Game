# Tank Day API. Build from the repo root:  docker build -t tank-day-api .
FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:0.12 /uv /usr/local/bin/uv
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy PYTHONUNBUFFERED=1

WORKDIR /app/backend
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY backend/ ./
COPY pitches/ /app/pitches/
COPY scripts/ /app/scripts/

ENV PITCHES_DIR=/app/pitches \
    TRUST_PROXY_HEADERS=true \
    PORT=8000
EXPOSE 8000

RUN useradd --create-home app && mkdir -p /app/backend/data && chown -R app /app/backend/data
USER app

HEALTHCHECK --interval=30s --timeout=5s CMD python -c "import urllib.request,os;urllib.request.urlopen(f'http://127.0.0.1:{os.environ.get(\"PORT\",\"8000\")}/api/health')"
CMD ["sh", "-c", "uv run --no-sync uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --proxy-headers --forwarded-allow-ips='*'"]
