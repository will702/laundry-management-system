#!/bin/sh
set -e

# Run from the backend workspace directory (where prisma/ lives).
cd "$(dirname "$0")"

# Derive a PostgreSQL schema from the source schema so schema.prisma stays the
# single source of truth (local dev keeps using SQLite, prod uses Postgres).
sed 's/provider = "sqlite"/provider = "postgresql"/' \
  prisma/schema.prisma > prisma/schema.prod.prisma

echo "[entrypoint] Applying database schema to Cloud SQL..."
npx prisma db push --schema=prisma/schema.prod.prisma --skip-generate

echo "[entrypoint] Starting Mass Laundry API..."
exec node dist/main
