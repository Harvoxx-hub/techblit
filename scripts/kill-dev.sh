#!/bin/bash
# Kill existing Next.js dev server and remove lock so you can run npm run dev again.
# Run from repo root: bash scripts/kill-dev.sh
cd "$(dirname "$0")/.." || exit 1
echo "Stopping Next.js dev server on port 3000..."
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
rm -f .next/dev/lock 2>/dev/null || true
echo "Done. You can now run: npm run dev"
