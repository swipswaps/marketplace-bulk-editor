# Docker Setup Guide

## Overview

This project uses Docker to provide a complete, isolated development environment with:
- **PostgreSQL 15** - Production database with SQL export support
- **Redis 7** - Caching and rate limiting
- **Flask Backend** - Python 3.11 with all dependencies
- **React Frontend** - Vite dev server with hot reload

**All Python 3.14 compatibility issues are avoided by using Python 3.11 in Docker.**

---

## Quick Start

### 1. Start All Services

```bash
docker-compose up -d
```

This will:
- ✅ Pull/build all Docker images
- ✅ Start PostgreSQL, Redis, Backend, Frontend
- ✅ Initialize database automatically
- ✅ Run migrations
- ✅ Start Flask API on http://localhost:5000
- ✅ Start React app on http://localhost:5173

### 2. Check Status

```bash
docker-compose ps
```

Expected output:
```
NAME                      STATUS              PORTS
marketplace-backend       Up                  0.0.0.0:5000->5000/tcp
marketplace-frontend      Up                  0.0.0.0:5173->5173/tcp
marketplace-postgres      Up (healthy)        0.0.0.0:5432->5432/tcp
marketplace-redis         Up (healthy)        0.0.0.0:6379->6379/tcp
```

### 3. View Logs

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend
```

### 4. Stop Services

```bash
docker-compose down
```

---

## Services

### Backend (Flask API)
- **URL**: http://localhost:5000
- **Container**: marketplace-backend
- **Database**: PostgreSQL (marketplace_db)
- **Features**:
  - 28 API endpoints
  - JWT authentication
  - Multi-format export (CSV, JSON, XLSX, SQL)
  - Rate limiting with Redis
  - OCR processing (Tesseract)
  - Audit logging

### Frontend (React + Vite)
- **URL**: http://localhost:5173
- **Container**: marketplace-frontend
- **Features**:
  - All existing UI features preserved
  - Hot module reload
  - Dark mode
  - Bulk editing
  - Export functionality

### PostgreSQL
- **Host**: localhost:5432
- **Database**: marketplace_db
- **User**: marketplace_user
- **Password**: marketplace_pass
- **Features**:
  - Persistent data (postgres_data volume)
  - Health checks
  - SQL export support

### Redis
- **Host**: localhost:6379
- **Features**:
  - Rate limiting storage
  - Session caching
  - Persistent data (redis_data volume)

---

## Development Workflow

### Make Code Changes

**Backend changes** (hot reload enabled):
```bash
# Edit files in backend/
# Flask will auto-reload
```

**Frontend changes** (hot reload enabled):
```bash
# Edit files in src/
# Vite will auto-reload
```

### Run Tests

```bash
# Backend tests
docker-compose exec backend pytest

# With coverage
docker-compose exec backend pytest --cov=. --cov-report=html

# Specific test file
docker-compose exec backend pytest tests/test_auth.py
```

### Access Database

```bash
# PostgreSQL shell
docker-compose exec postgres psql -U marketplace_user -d marketplace_db

# Run SQL query
docker-compose exec postgres psql -U marketplace_user -d marketplace_db -c "SELECT * FROM users;"
```

### Access Backend Shell

```bash
docker-compose exec backend bash

# Inside container:
python init_db.py
flask db migrate -m "Add new field"
flask db upgrade
```

### Rebuild After Dependency Changes

```bash
# Rebuild backend (if requirements.txt changed)
docker-compose build backend

# Rebuild frontend (if package.json changed)
docker-compose build frontend

# Rebuild all
docker-compose build
```

---

## Troubleshooting

### Backend won't start

```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. PostgreSQL not ready - wait 10 seconds and check again
# 2. Port 5000 in use - stop other services using port 5000
```

### Database connection errors

```bash
# Check PostgreSQL is healthy
docker-compose ps postgres

# Should show "Up (healthy)"
# If not, check logs:
docker-compose logs postgres
```

### Reset Everything

```bash
# Stop and remove all containers, volumes, networks
docker-compose down -v

# Rebuild and start fresh
docker-compose up -d --build
```

---

## Production Deployment

For production, update docker-compose.yml:

```yaml
backend:
  command: gunicorn --bind 0.0.0.0:5000 --workers 4 --worker-class gevent app:app
  environment:
    - FLASK_ENV=production
    - SECRET_KEY=<strong-random-key>
    - JWT_SECRET_KEY=<strong-random-key>
```

---

## Summary

✅ **No Python installation required** - Everything runs in Docker  
✅ **No dependency conflicts** - Isolated environment  
✅ **PostgreSQL included** - SQL export works out of the box  
✅ **All features preserved** - Frontend and backend fully functional  
✅ **Hot reload enabled** - Fast development workflow  
✅ **Easy cleanup** - `docker-compose down -v`  

**Next Steps**:
```bash
docker-compose up -d
docker-compose logs -f
# Open http://localhost:5173 in browser
```

