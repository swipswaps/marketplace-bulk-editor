# How to Use the Docker Backend - Complete Guide

**Date**: 2025-12-19  
**For**: marketplace-bulk-editor with Docker deployment

---

## 🚀 Quick Start (3 Steps)

### 1. Start Everything

```bash
./docker-start.sh
```

**What happens**:
- ✅ PostgreSQL database starts (port 5432)
- ✅ Redis cache starts (port 6379)
- ✅ Backend API starts (port 5000)
- ✅ Frontend UI starts (port 5173)

**Wait for**: "✓ All services started!" message

---

### 2. Open the App

```bash
# Browser will open automatically, or visit:
http://localhost:5173
```

**You'll see**:
- ✅ Green status indicator: "Docker Backend Connected"
- ✅ File upload area
- ✅ All UI features enabled

---

### 3. Stop Everything

```bash
./docker-stop.sh
```

**What happens**:
- ✅ All containers stopped
- ✅ Data preserved in Docker volumes
- ✅ Can restart anytime with `./docker-start.sh`

---

## 📊 What You Get with Docker Backend

### Without Docker (Frontend Only)
- ❌ No database (data lost on refresh)
- ❌ No authentication
- ❌ No OCR processing
- ❌ No SQL export
- ❌ No templates
- ❌ Limited to browser storage

### With Docker (Full Stack)
- ✅ PostgreSQL database (persistent data)
- ✅ User authentication (JWT tokens)
- ✅ OCR processing (Tesseract)
- ✅ Multi-format export (CSV, JSON, XLSX, SQL, text)
- ✅ Templates (save/reuse configurations)
- ✅ Redis caching (faster performance)
- ✅ Rate limiting (API protection)
- ✅ Audit logging (compliance tracking)

---

## 🔐 Backend Features Explained

### 1. Authentication System

**What it does**: Secure user accounts with JWT tokens

**Endpoints**:
```bash
POST /api/auth/register  # Create account
POST /api/auth/login     # Login (get tokens)
POST /api/auth/logout    # Logout
POST /api/auth/refresh   # Refresh access token
GET  /api/auth/me        # Get current user info
```

**Example - Register**:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "full_name": "John Doe"
  }'
```

**Response**:
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "full_name": "John Doe"
  },
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Security Features**:
- 🔒 Password hashing (bcrypt)
- 🔒 Account lockout (5 failed attempts = 30 min lock)
- 🔒 Token expiration (access: 15 min, refresh: 7 days)
- 🔒 Password strength validation

---

### 2. Listings Management

**What it does**: Store and manage marketplace listings in database

**Endpoints**:
```bash
GET    /api/listings           # Get all your listings
POST   /api/listings           # Create single listing
GET    /api/listings/:id       # Get specific listing
PUT    /api/listings/:id       # Update listing
DELETE /api/listings/:id       # Delete listing
POST   /api/listings/bulk      # Create multiple listings
DELETE /api/listings/bulk      # Delete multiple listings
```

**Example - Create Listing**:
```bash
curl -X POST http://localhost:5000/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "Solar Panel 300W",
    "price": 150.00,
    "condition": "New",
    "description": "High-efficiency solar panel",
    "category": "Electronics",
    "offer_shipping": "Yes"
  }'
```

**Facebook Marketplace Compatible Fields**:
- `TITLE` (max 150 characters)
- `PRICE` (number > 0)
- `CONDITION` (New, Used - Like New, Used - Good, Used - Fair)
- `DESCRIPTION` (text)
- `CATEGORY` (text)
- `OFFER SHIPPING` (Yes/No)

---

### 3. Templates System

**What it does**: Save and reuse listing configurations

**Endpoints**:
```bash
GET    /api/templates          # Get all templates
POST   /api/templates          # Create template
GET    /api/templates/:id      # Get specific template
PUT    /api/templates/:id      # Update template
DELETE /api/templates/:id      # Delete template
POST   /api/templates/:id/use  # Increment use count
```

**Example - Create Template**:
```bash
curl -X POST http://localhost:5000/api/templates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Solar Panel Template",
    "description": "Default template for solar panels",
    "template_data": {
      "category": "Electronics",
      "offer_shipping": "Yes",
      "condition": "New"
    },
    "is_public": false
  }'
```

**Use Case**: Save common settings (category, shipping, condition) and apply to multiple listings

---

### 4. OCR Processing

**What it does**: Extract text from images/PDFs using Tesseract OCR

**Endpoints**:
```bash
POST   /api/ocr/upload              # Upload file for OCR
GET    /api/ocr/scans               # Get scan history
GET    /api/ocr/scans/:id           # Get scan details
POST   /api/ocr/scans/:id/correct   # Manually correct OCR results
DELETE /api/ocr/scans/:id           # Delete scan
```

**Example - Upload for OCR**:
```bash
curl -X POST http://localhost:5000/api/ocr/upload \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@product_catalog.pdf"
```

**Response**:
```json
{
  "message": "File uploaded successfully",
  "ocr_scan": {
    "id": "uuid-here",
    "filename": "product_catalog.pdf",
    "status": "pending",
    "file_size": 1024000,
    "created_at": "2025-12-19T11:00:00Z"
  }
}
```

**Supported Formats**: PDF, PNG, JPEG, HEIC

---

### 5. Multi-Format Export

**What it does**: Export listings to various formats

**Endpoints**:
```bash
POST /api/export/text   # Tab-delimited text
POST /api/export/csv    # CSV file
POST /api/export/json   # JSON file
POST /api/export/xlsx   # Excel file (styled)
POST /api/export/sql    # SQL INSERT statements
```

**Example - Export to Excel**:
```bash
curl -X POST http://localhost:5000/api/export/xlsx \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "listings": [
      {
        "title": "Solar Panel 300W",
        "price": 150.00,
        "condition": "New",
        "description": "High-efficiency",
        "category": "Electronics",
        "offer_shipping": "Yes"
      }
    ]
  }' \
  --output marketplace-listings.xlsx
```

**SQL Export Example**:
```sql
INSERT INTO listings (title, price, condition, description, category, offer_shipping)
VALUES ('Solar Panel 300W', 150.00, 'New', 'High-efficiency', 'Electronics', 'Yes');
```

---

## 🔧 Advanced Usage

### Check Backend Status

```bash
# Health check
curl http://localhost:5000/health

# Response:
{
  "status": "healthy",
  "environment": "development"
}

# List all endpoints
curl http://localhost:5000/

# Response:
{
  "endpoints": {
    "auth": "/api/auth",
    "export": "/api/export",
    "health": "/health",
    "listings": "/api/listings",
    "ocr": "/api/ocr",
    "templates": "/api/templates"
  },
  "message": "Marketplace Bulk Editor API",
  "version": "1.0.0"
}
```

---

### View Logs

```bash
# Backend logs (Flask API)
docker logs -f marketplace-backend

# Frontend logs (Vite dev server)
docker logs -f marketplace-frontend

# PostgreSQL logs
docker logs -f marketplace-postgres

# Redis logs
docker logs -f marketplace-redis

# All logs together
docker logs -f marketplace-backend & \
docker logs -f marketplace-frontend & \
wait
```

---

### Access Database Directly

```bash
# PostgreSQL shell
docker exec -it marketplace-postgres psql -U marketplace_user -d marketplace_db

# Inside PostgreSQL:
\dt                    # List tables
SELECT * FROM users;   # Query users
SELECT * FROM listings WHERE price > 100;
\q                     # Quit
```

---

### Access Backend Shell

```bash
# Bash shell in backend container
docker exec -it marketplace-backend bash

# Inside container:
python init_db.py      # Reinitialize database
flask shell            # Python REPL with Flask context
pytest                 # Run tests
exit                   # Exit container
```

---

### Redis Cache Inspection

```bash
# Redis CLI
docker exec -it marketplace-redis redis-cli

# Inside Redis:
KEYS *                 # List all keys
GET rate_limit:user:123
FLUSHALL               # Clear all cache (WARNING: deletes all data)
exit
```

---

## 🔄 Development Workflow

### 1. Make Code Changes

**Backend changes** (auto-reload enabled):
```bash
# Edit files in backend/
vim backend/routes/listings.py

# Flask will auto-reload (watch logs)
docker logs -f marketplace-backend
```

**Frontend changes** (hot module reload):
```bash
# Edit files in src/
vim src/components/DataTable.tsx

# Vite will auto-reload (instant in browser)
```

---

### 2. Add New Dependencies

**Backend (Python)**:
```bash
# Add to requirements.txt
echo "new-package==1.0.0" >> backend/requirements.txt

# Rebuild backend container
docker-compose build backend

# Restart backend
docker restart marketplace-backend
```

**Frontend (Node)**:
```bash
# Add to package.json
npm install new-package

# Rebuild frontend container
docker-compose build frontend

# Restart frontend
docker restart marketplace-frontend
```

---

### 3. Run Tests

```bash
# Backend tests
docker exec marketplace-backend pytest

# With coverage
docker exec marketplace-backend pytest --cov=. --cov-report=html

# Specific test file
docker exec marketplace-backend pytest tests/test_auth.py

# Verbose output
docker exec marketplace-backend pytest -v
```

---

## 🗄️ Data Persistence

### Docker Volumes

**Data is preserved** in Docker volumes even after stopping containers:

```bash
# List volumes
docker volume ls | grep marketplace

# Output:
marketplace-bulk-editor_postgres_data   # Database data
marketplace-bulk-editor_redis_data      # Cache data
marketplace-bulk-editor_upload_data     # Uploaded files
```

**To delete all data** (WARNING: irreversible):
```bash
./docker-stop.sh

docker volume rm marketplace-bulk-editor_postgres_data
docker volume rm marketplace-bulk-editor_redis_data
docker volume rm marketplace-bulk-editor_upload_data
```

---

## 🐛 Troubleshooting

### Backend Won't Start

**Symptom**: `docker ps` shows backend container exited

**Solution**:
```bash
# Check logs
docker logs marketplace-backend

# Common issues:
# 1. PostgreSQL not ready - wait 10 seconds
# 2. Port 5000 in use - stop other services
# 3. Missing env vars - check docker-start.sh
```

---

### Database Connection Errors

**Symptom**: Backend logs show "connection refused"

**Solution**:
```bash
# Check PostgreSQL health
docker ps --filter "name=marketplace-postgres"

# Should show "Up (healthy)"
# If not healthy, restart:
docker restart marketplace-postgres

# Wait 10 seconds
sleep 10

# Restart backend
docker restart marketplace-backend
```

---

### Frontend Shows "Backend Disconnected"

**Symptom**: Red status indicator in UI

**Solution**:
```bash
# 1. Check if backend is running
curl http://localhost:5000/

# If no response:
docker ps --filter "name=marketplace-backend"

# If not running:
./docker-start.sh

# 2. Check backend logs for errors
docker logs marketplace-backend --tail 50
```

---

### Reset Everything

**When all else fails**:
```bash
# Stop and remove all containers
./docker-stop.sh

# Remove all volumes (deletes data)
docker volume rm marketplace-bulk-editor_postgres_data
docker volume rm marketplace-bulk-editor_redis_data
docker volume rm marketplace-bulk-editor_upload_data

# Start fresh
./docker-start.sh
```

---

## 📚 Summary

### Basic Commands
```bash
./docker-start.sh          # Start all services
./docker-stop.sh           # Stop all services
docker ps                  # Check running containers
docker logs -f <name>      # View logs
```

### URLs
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Key Features
- ✅ 28 API endpoints
- ✅ JWT authentication
- ✅ PostgreSQL database
- ✅ Redis caching
- ✅ OCR processing
- ✅ Multi-format export
- ✅ Templates system
- ✅ Audit logging

---

**Next Steps**: Open http://localhost:5173 and start editing!

