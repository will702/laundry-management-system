#!/usr/bin/env sh
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MODE="${1:-setup}"

case "$MODE" in
  setup)
    cp backend/.env.demo backend/.env
    npm run db:migrate --workspace=backend
    npm run db:demo-seed --workspace=backend
    echo ""
    echo "Demo ready. Start with:"
    echo "  npm run dev:backend"
    echo "  npm run dev:frontend"
    ;;
  reset)
    rm -f backend/dev.db backend/dev.db-journal
    sh "$0" setup
    ;;
  *)
    echo "Usage: $0 [setup|reset]" >&2
    exit 1
    ;;
esac
