# ─────────────────────────────────────────────────────────────
# Stage 1 — build the Tailwind CSS
# We use the official standalone binary so no Node toolchain is
# needed, and we build here rather than on the host so the image
# is self-contained.
# ─────────────────────────────────────────────────────────────
FROM debian:bookworm-slim AS css-build

ARG TAILWINDCSS_VERSION=v3.4.17

RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /src

RUN curl -fsSL -o /usr/local/bin/tailwindcss \
      "https://github.com/tailwindlabs/tailwindcss/releases/download/${TAILWINDCSS_VERSION}/tailwindcss-linux-x64" \
 && chmod +x /usr/local/bin/tailwindcss

COPY tailwind.config.js tailwind.input.css ./
COPY app/templates ./app/templates
COPY app/static/js  ./app/static/js

RUN mkdir -p app/static/css \
 && tailwindcss -c tailwind.config.js -i tailwind.input.css \
      -o app/static/css/tailwind.css --minify


# ─────────────────────────────────────────────────────────────
# Stage 2 — runtime
# ─────────────────────────────────────────────────────────────
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# WeasyPrint's runtime dependencies + fonts.
# Without fonts the PDF comes out with tofu boxes.
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      libpango-1.0-0 \
      libpangoft2-1.0-0 \
      libharfbuzz0b \
      libcairo2 \
      libgdk-pixbuf-2.0-0 \
      libffi8 \
      shared-mime-info \
      fontconfig \
      fonts-liberation \
      fonts-dejavu-core \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt gunicorn

COPY app ./app
COPY run.py ./

# Bring in the freshly built stylesheet from stage 1
COPY --from=css-build /src/app/static/css/tailwind.css ./app/static/css/tailwind.css

# Run as an unprivileged user
RUN useradd --system --uid 1001 --create-home app \
 && chown -R app:app /app
USER app

EXPOSE 5224

# gunicorn with a single worker is enough for a personal app.
# If you expect concurrent PDF generation, bump --workers to 2.
CMD ["gunicorn", "--bind", "0.0.0.0:5224", \
     "--workers", "1", \
     "--threads", "4", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "run:app"]
