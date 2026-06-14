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

if [ "$DEMO_MODE" = "true" ]; then
  echo "[entrypoint] DEMO_MODE is true, checking if database needs seeding..."
  node -e "
    const { PrismaClient } = require('@prisma/client');
    const { execSync } = require('child_process');
    const prisma = new PrismaClient();
    prisma.employee.count()
      .then(count => {
        if (count === 0) {
          console.log('[entrypoint] Database is empty. Seeding demo data...');
          execSync('npx ts-node prisma/demo-seed.ts', { stdio: 'inherit' });
        } else {
          console.log('[entrypoint] Database already has data. Skipping seed.');
        }
        process.exit(0);
      })
      .catch(err => {
        console.error('[entrypoint] Failed to check/seed database:', err);
        process.exit(1);
      });
  "
fi

echo "[entrypoint] Starting Mass Laundry API..."
exec node dist/main
