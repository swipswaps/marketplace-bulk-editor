#!/bin/bash
set -e

echo "==========================================="
echo "Marketplace Bulk Editor - Docker Setup"
echo "==========================================="
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

