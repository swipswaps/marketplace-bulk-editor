#!/bin/bash
set -e

echo "==========================================="
echo "Marketplace Bulk Editor - Docker Setup"
echo "==========================================="
echo ""

# Clean up any existing containers and processes FIRST
echo "Cleaning up existing containers and processes..."
docker compose down --remove-orphans 2>/dev/null || true
docker ps -a | grep marketplace | awk '{print $1}' | xargs -r docker rm -f 2>/dev/null || true

# Kill processes using ports 5173 and 5000
fuser -k 5173/tcp 2>/dev/null || true
fuser -k 5000/tcp 2>/dev/null || true

# Kill Flask/Gunicorn/PaddleOCR processes
pkill -9 -f "flask run" 2>/dev/null || true
pkill -9 -f "gunicorn.*app:app" 2>/dev/null || true
pkill -9 -f "python.*app.py" 2>/dev/null || true
pkill -9 -f "paddleocr" 2>/dev/null || true

# Kill Vite dev server
pkill -9 -f "vite" 2>/dev/null || true
pkill -9 -f "npm run dev" 2>/dev/null || true

echo "✓ Cleanup complete"
echo ""

echo "Using docker-compose.yml configuration..."
echo ""

# Start all services with docker compose
docker compose up -d

echo "Waiting for services to be healthy..."
echo -n "Checking PostgreSQL"
until [ "$(docker inspect -f '{{.State.Health.Status}}' marketplace-postgres 2>/dev/null)" == "healthy" ]; do
    echo -n "."
    sleep 2
done
echo " ✓"

echo -n "Checking Redis"
until [ "$(docker inspect -f '{{.State.Health.Status}}' marketplace-redis 2>/dev/null)" == "healthy" ]; do
    echo -n "."
    sleep 2
done
echo " ✓"

echo ""
echo "==========================================="
echo "✓ All services started!"
echo "==========================================="
echo ""
echo "Services:"
echo "  Frontend:  http://localhost:5173"
echo "  Backend:   http://localhost:5000"
echo "  PostgreSQL: localhost:5432"
echo "  Redis:     localhost:6379"
echo ""
echo "View logs:"
echo "  docker logs -f marketplace-backend"
echo "  docker logs -f marketplace-frontend"
echo ""
echo "Stop all:"
echo "  ./docker-stop.sh"
echo ""

