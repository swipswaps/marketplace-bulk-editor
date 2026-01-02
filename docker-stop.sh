#!/bin/bash

echo "Stopping all Marketplace Bulk Editor containers..."
echo ""

# Stop and remove all containers defined in docker-compose.yml
docker compose down

echo ""
echo "✓ All containers stopped and removed"
echo ""
echo "To remove volumes (WARNING: deletes all data):"
echo "  docker compose down -v"
echo ""
echo "Or remove individual volumes:"
echo "  docker volume rm marketplace-bulk-editor_postgres_data"
echo "  docker volume rm marketplace-bulk-editor_redis_data"
echo "  docker volume rm marketplace-bulk-editor_upload_data"
echo ""

