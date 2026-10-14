# Build static frontend files
FROM node:26-alpine AS builder

WORKDIR /app

ENV NODE_ENV=production

COPY frontend .

# URL de la API que usa el navegador. Por defecto es relativa ("/api"): el mismo contenedor sirve
# el frontend y la API, así la imagen funciona en cualquier dominio sin reconstruirla.
ARG VITE_API_BASE_URL=/api

# Personalización del sitio público (opcional). Ver DEPLOY.md, sección 9.
ARG VITE_SITE_NAME=""
ARG VITE_SITE_TAGLINE=""
ARG VITE_STREAM_URL=""
ARG VITE_DISCORD_URL=""

RUN npm install -g pnpm@12.11.2 && \
    pnpm --version && \
    CI=true pnpm install --frozen-lockfile --prod=false && \
    VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_SITE_NAME="$VITE_SITE_NAME" \
    VITE_SITE_TAGLINE="$VITE_SITE_TAGLINE" \
    VITE_STREAM_URL="$VITE_STREAM_URL" \
    VITE_DISCORD_URL="$VITE_DISCORD_URL" \
    pnpm build

# Build backend image that also serves frontend (stored in `/app/frontend-dist`)
FROM python:3.14-alpine3.22
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

RUN rm -rf /var/cache/apk/*

COPY backend /app
WORKDIR /app
RUN mkdir -p /app/static

# -- Install dependencies:
RUN addgroup --system bracket && \
    adduser --system bracket --ingroup bracket && \
    chown -R bracket:bracket /app
USER bracket

RUN uv sync --no-dev --locked

COPY --from=builder /app/dist /app/frontend-dist

EXPOSE 8400

HEALTHCHECK --interval=3s --timeout=5s --retries=10 \
    CMD ["wget", "-O", "/dev/null", "http://0.0.0.0:8400/ping"]

CMD [ \
    "uv", \
    "run", \
    "--no-dev", \
    "--locked", \
    "--", \
    "gunicorn", \
    "-k", \
    "uvicorn.workers.UvicornWorker", \
    "bracket.app:app", \
    "--bind", \
    "0.0.0.0:8400", \
    "--workers", \
    "1" \
]
