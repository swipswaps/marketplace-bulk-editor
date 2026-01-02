# Docker Backend - Quick Reference Card

**Date**: 2025-12-19  
**Print this for easy reference!**

---

## 🚀 Essential Commands

```bash
# Start everything
./docker-start.sh

# Stop everything
./docker-stop.sh

# Check status
docker ps --filter "name=marketplace-"

# View logs
docker logs -f marketplace-backend
docker logs -f marketplace-frontend
```

---

## 🌐 URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:5173 | React UI |
| **Backend API** | http://localhost:5000 | Flask API |
| **PostgreSQL** | localhost:5432 | Database |
| **Redis** | localhost:6379 | Cache |

---

## 📡 API Endpoints (28 Total)

### Authentication (5)
```
POST   /api/auth/register      # Create account
POST   /api/auth/login         # Login
POST   /api/auth/logout        # Logout
POST   /api/auth/refresh       # Refresh token
GET    /api/auth/me            # Get user info
```

### Listings (7)
```
GET    /api/listings           # Get all
POST   /api/listings           # Create one
GET    /api/listings/:id       # Get by ID
PUT    /api/listings/:id       # Update
DELETE /api/listings/:id       # Delete
POST   /api/listings/bulk      # Create many
DELETE /api/listings/bulk      # Delete many
```

### Templates (6)
```
GET    /api/templates          # Get all
POST   /api/templates          # Create
GET    /api/templates/:id      # Get by ID
PUT    /api/templates/:id      # Update
DELETE /api/templates/:id      # Delete
POST   /api/templates/:id/use  # Increment use count
```

### OCR (5)
```
POST   /api/ocr/upload              # Upload file
GET    /api/ocr/scans               # Get history
GET    /api/ocr/scans/:id           # Get by ID
POST   /api/ocr/scans/:id/correct   # Correct results
DELETE /api/ocr/scans/:id           # Delete
```

### Export (5)
```
POST   /api/export/text        # Tab-delimited
POST   /api/export/csv         # CSV file
POST   /api/export/json        # JSON file
POST   /api/export/xlsx        # Excel file
POST   /api/export/sql         # SQL INSERT
```

---

## 🔐 Authentication Flow

```bash
# 1. Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123!","full_name":"John Doe"}'

# Response: {access_token, refresh_token, user}

# 2. Use token in requests
curl -X GET http://localhost:5000/api/listings \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🗄️ Database Access

```bash
# PostgreSQL shell
docker exec -it marketplace-postgres psql -U marketplace_user -d marketplace_db

# Inside PostgreSQL:
\dt                              # List tables
SELECT * FROM users;             # Query users
SELECT * FROM listings;          # Query listings
\q                               # Quit
```

---

## 🔧 Troubleshooting

### Backend won't start
```bash
docker logs marketplace-backend
# Common: PostgreSQL not ready - wait 10 seconds
```

### Frontend shows "Disconnected"
```bash
curl http://localhost:5000/
# If no response: ./docker-start.sh
```

### Reset everything
```bash
./docker-stop.sh
docker volume rm marketplace-bulk-editor_postgres_data
docker volume rm marketplace-bulk-editor_redis_data
./docker-start.sh
```

---

## 📊 What Docker Gives You

| Feature | Without Docker | With Docker |
|---------|---------------|-------------|
| Database | ❌ Browser only | ✅ PostgreSQL |
| Authentication | ❌ None | ✅ JWT tokens |
| OCR | ❌ None | ✅ Tesseract |
| SQL Export | ❌ None | ✅ Full support |
| Templates | ❌ None | ✅ Save/reuse |
| Rate Limiting | ❌ None | ✅ Redis-backed |
| Audit Logs | ❌ None | ✅ Full tracking |

---

## 🎯 Common Tasks

### Upload Excel file
```bash
# Via UI: Drag & drop or click upload area
# Via API:
curl -X POST http://localhost:5000/api/listings/bulk \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '[{"title":"Item 1","price":100,"condition":"New"}]'
```

### Export to SQL
```bash
curl -X POST http://localhost:5000/api/export/sql \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"listings":[...]}' \
  --output marketplace.sql
```

### Save template
```bash
curl -X POST http://localhost:5000/api/templates \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Solar Panels","template_data":{"category":"Electronics"}}'
```

---

## 🔄 Development Workflow

```bash
# 1. Start services
./docker-start.sh

# 2. Make code changes
vim src/components/DataTable.tsx    # Frontend (auto-reload)
vim backend/routes/listings.py      # Backend (auto-reload)

# 3. View logs
docker logs -f marketplace-backend
docker logs -f marketplace-frontend

# 4. Run tests
docker exec marketplace-backend pytest

# 5. Stop when done
./docker-stop.sh
```

---

## 📦 Data Persistence

**Data is saved** in Docker volumes:
- `marketplace-bulk-editor_postgres_data` - Database
- `marketplace-bulk-editor_redis_data` - Cache
- `marketplace-bulk-editor_upload_data` - Files

**Data survives** container restarts!

---

## 🆘 Emergency Commands

```bash
# Kill all containers
docker kill $(docker ps -q --filter "name=marketplace-")

# Remove all containers
docker rm -f $(docker ps -aq --filter "name=marketplace-")

# Remove all volumes (WARNING: deletes data)
docker volume rm marketplace-bulk-editor_postgres_data
docker volume rm marketplace-bulk-editor_redis_data
docker volume rm marketplace-bulk-editor_upload_data

# Start fresh
./docker-start.sh
```

---

**For detailed guide**: See `HOW_TO_USE_DOCKER_BACKEND.md`  
**For setup instructions**: See `DOCKER_SETUP.md`

