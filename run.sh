#!/usr/bin/env bash
# AirSense - Unified Fullstack Runner
# Runs both Python FastAPI backend (port 8000) and Express/Vite Frontend (port 3000)
# All traffic and UI is accessible on a SINGLE LINK: http://localhost:3000

set -e
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "=========================================================="
echo " Starting AirSense - Fullstack Platform on a Single Link"
echo "=========================================================="

# 1. Start Python backend
echo "-> Starting Python FastAPI Backend on port 8000..."
python3 -m uvicorn app.main:app --port 8000 --app-dir "$PROJECT_ROOT/backend" &
BACKEND_PID=$!

# 2. Start Frontend server
echo "-> Starting Frontend Express & Vite server on port 3000..."
(cd "$PROJECT_ROOT/frontend" && npm run dev) &
FRONTEND_PID=$!

cleanup() {
  echo ""
  echo "Shutting down AirSense servers (PIDs: $BACKEND_PID, $FRONTEND_PID)..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  exit 0
}

trap cleanup INT TERM EXIT

echo ""
echo "=========================================================="
echo " Project is LIVE on a single link:"
echo " http://localhost:3000"
echo "=========================================================="
echo ""

wait
