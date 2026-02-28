#!/bin/bash
set -e

echo ""
echo "  ██╗   ██╗ █████╗ ██╗   ██╗██╗  ████████╗"
echo "  ██║   ██║██╔══██╗██║   ██║██║  ╚══██╔══╝"
echo "  ██║   ██║███████║██║   ██║██║     ██║   "
echo "  ╚██╗ ██╔╝██╔══██║██║   ██║██║     ██║   "
echo "   ╚████╔╝ ██║  ██║╚██████╔╝███████╗██║   "
echo "    ╚═══╝  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝   "
echo ""
echo "  Personal Finance Intelligence Platform"
echo "  ----------------------------------------"
echo ""

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "  ✗ Docker is not running. Please start Docker and try again."
  exit 1
fi

# Create .env if it doesn't exist
if [ ! -f .env ]; then
  echo "  → Creating .env from .env.example..."
  cp .env.example .env
  echo "  ⚠  Add your ANTHROPIC_API_KEY to .env to enable AI features."
  echo ""
fi

echo "  → Building and starting services..."
echo ""

docker compose up --build -d

echo ""
echo "  ✓ Vault is starting up!"
echo ""
echo "  Services:"
echo "    Frontend  →  http://localhost:3000"
echo "    API       →  http://localhost:8000"
echo "    API docs  →  http://localhost:8000/docs"
echo ""
echo "  Logs:  docker compose logs -f"
echo "  Stop:  docker compose down"
echo ""

# Optionally seed demo data
if [ -t 0 ]; then
  read -p "  Load demo data? (y/N) " -n 1 -r || true
  echo ""
else
  REPLY="n"
fi
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "  → Seeding demo data..."
  sleep 5  # Give API a moment to fully start
  docker compose exec -T api python scripts/seed_demo_data.py
  echo "  ✓ Demo data loaded."
fi

echo ""
echo "  Opening http://localhost:3000 ..."
sleep 2
open http://localhost:3000 2>/dev/null || xdg-open http://localhost:3000 2>/dev/null || true
