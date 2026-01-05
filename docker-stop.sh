#!/bin/bash

echo "Stopping all Marketplace Bulk Editor containers..."
echo ""

# Stop and remove all containers defined in docker-compose.yml
docker compose down --remove-orphans

# Force kill any remaining marketplace containers
echo "Force killing any remaining containers..."
docker ps -a | grep marketplace | awk '{print $1}' | xargs -r docker rm -f 2>/dev/null || true

# Kill processes using ports 5173 and 5000
echo "Killing processes on ports 5173 and 5000..."
fuser -k 5173/tcp 2>/dev/null || true
fuser -k 5000/tcp 2>/dev/null || true

# Kill any orphaned Flask/Gunicorn processes (running outside Docker)
echo "Killing orphaned Flask/Gunicorn processes..."
pkill -9 -f "flask run" 2>/dev/null || true
pkill -9 -f "gunicorn.*app:app" 2>/dev/null || true
pkill -9 -f "python.*app.py" 2>/dev/null || true

# Kill any orphaned PaddleOCR processes
echo "Killing orphaned PaddleOCR processes..."
pkill -9 -f "paddleocr" 2>/dev/null || true

# Kill Vite dev server
echo "Killing Vite dev server..."
pkill -9 -f "vite" 2>/dev/null || true
pkill -9 -f "npm run dev" 2>/dev/null || true

echo ""
echo "✓ All containers stopped and cleaned up"
echo ""
echo "To remove volumes (WARNING: deletes all data):"
echo "  docker compose down -v"
echo ""
echo "Or remove individual volumes:"
echo "  docker volume rm marketplace-bulk-editor_postgres_data"
echo "  docker volume rm marketplace-bulk-editor_redis_data"
echo "  docker volume rm marketplace-bulk-editor_upload_data"
echo ""

