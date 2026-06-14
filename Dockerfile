# Mass Laundry API — Cloud Run image
# Build context MUST be the repo root (npm workspaces + @mass-laundry/shared-types).
#   docker build -t laundry-api .
#   gcloud run deploy laundry-api --source .

# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-slim AS builder
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Install deps using the workspace manifests + lockfile (cache-friendly layer)
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY packages/shared-types/package.json packages/shared-types/
RUN npm ci

# Copy sources and build the backend
COPY . .

# Derive a PostgreSQL schema from the source schema (single source of truth),
# then generate the Prisma client against the Postgres provider.
RUN sed 's/provider = "sqlite"/provider = "postgresql"/' \
      backend/prisma/schema.prisma > backend/prisma/schema.prod.prisma \
  && npx prisma generate --schema=backend/prisma/schema.prod.prisma \
  && npm run build:backend

# ── Runtime stage ───────────────────────────────────────────────────────────────
FROM node:20-slim AS runner
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production

# App + dependencies (workspace deps are hoisted to the root node_modules)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY backend/docker-entrypoint.sh ./backend/docker-entrypoint.sh
RUN chmod +x ./backend/docker-entrypoint.sh

WORKDIR /app/backend
# Cloud Run sets $PORT (defaults to 8080); main.ts honours it.
EXPOSE 8080
CMD ["./docker-entrypoint.sh"]
