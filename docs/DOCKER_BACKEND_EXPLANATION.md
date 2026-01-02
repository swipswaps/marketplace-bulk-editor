# Docker Backend - Complete Explanation

**Date**: 2025-12-19  
**Question**: "how do the docker backend redis etc improvements work, explain how to use"

---

## 🎯 What You Asked

You asked for an explanation of:
1. How the Docker backend works
2. How Redis improvements work
3. How to use all the features

---

## 📚 Documentation Created

I've created **4 comprehensive guides** for you:

### 1. **HOW_TO_USE_DOCKER_BACKEND.md** (583 lines)
**Complete user guide** with:
- ✅ Quick start (3 steps)
- ✅ All 28 API endpoints explained with examples
- ✅ Authentication system (JWT tokens)
- ✅ Listings management (CRUD operations)
- ✅ Templates system (save/reuse configurations)
- ✅ OCR processing (Tesseract)
- ✅ Multi-format export (CSV, JSON, XLSX, SQL, text)
- ✅ Advanced usage (logs, database access, Redis inspection)
- ✅ Development workflow
- ✅ Data persistence
- ✅ Troubleshooting guide

### 2. **DOCKER_SETUP.md** (242 lines)
**Technical setup guide** with:
- ✅ Overview of all 4 Docker containers
- ✅ Quick start commands
- ✅ Service details (ports, features)
- ✅ Development workflow
- ✅ Testing instructions
- ✅ Database access
- ✅ Rebuild procedures
- ✅ Production deployment tips

### 3. **DOCKER_QUICK_REFERENCE.md** (150 lines)
**Quick reference card** with:
- ✅ Essential commands
- ✅ All URLs and ports
- ✅ All 28 API endpoints listed
- ✅ Authentication flow
- ✅ Database access commands
- ✅ Troubleshooting shortcuts
- ✅ Common tasks
- ✅ Emergency commands

### 4. **Interactive Diagrams** (2 Mermaid diagrams)
- ✅ **Architecture diagram** - Shows how all components connect
- ✅ **Workflow diagram** - Shows user interaction flow

---

## 🏗️ Architecture Overview

### 4 Docker Containers

```
┌─────────────────────────────────────────────────────────┐
│                    User's Browser                        │
│  http://localhost:5173                                   │
│  ┌──────────────┐         ┌──────────────────────┐     │
│  │ React UI     │         │ Backend Status       │     │
│  │ (Vite)       │         │ ✅ Connected         │     │
│  └──────────────┘         └──────────────────────┘     │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Docker Container Network                    │
│                                                          │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │ Frontend         │      │ Backend          │        │
│  │ Node 20 Alpine   │◄────►│ Python 3.11      │        │
│  │ Port 5173        │      │ Flask API        │        │
│  │                  │      │ Port 5000        │        │
│  └──────────────────┘      └──────────────────┘        │
│                                     │                    │
│                                     ▼                    │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │ PostgreSQL 15    │      │ Redis 7          │        │
│  │ Port 5432        │      │ Port 6379        │        │
│  │ marketplace_db   │      │ Cache & Limits   │        │
│  └──────────────────┘      └──────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 How Each Component Works

### 1. Frontend Container (Port 5173)

**What it does**:
- Runs Vite dev server with hot module reload
- Serves React UI to your browser
- Proxies API calls to backend

**How it works**:
```bash
# Mounts your local src/ directory
# Changes to src/components/*.tsx auto-reload in browser
# No need to rebuild container for UI changes
```

**Features**:
- ✅ Hot module reload (instant updates)
- ✅ Dark mode
- ✅ Bulk editing
- ✅ Backend status indicator (NEW!)
- ✅ All existing UI features preserved

---

### 2. Backend Container (Port 5000)

**What it does**:
- Runs Flask API with 28 endpoints
- Handles authentication (JWT tokens)
- Processes OCR (Tesseract)
- Exports to multiple formats
- Manages database operations

**How it works**:
```bash
# Python 3.11 (avoids Python 3.14 compatibility issues)
# Auto-reloads when you edit backend/*.py files
# Connects to PostgreSQL and Redis
```

**Features**:
- ✅ JWT authentication (access + refresh tokens)
- ✅ Password hashing (bcrypt)
- ✅ Account lockout (5 failed attempts = 30 min)
- ✅ Rate limiting (Redis-backed)
- ✅ OCR processing (Tesseract)
- ✅ Multi-format export (CSV, JSON, XLSX, SQL, text)
- ✅ Audit logging (compliance tracking)

---

### 3. PostgreSQL Container (Port 5432)

**What it does**:
- Stores all data persistently
- Supports SQL export functionality
- Provides production-grade database

**How it works**:
```bash
# Data stored in Docker volume: marketplace-bulk-editor_postgres_data
# Survives container restarts
# Can be accessed directly via psql
```

**Tables**:
- `users` - User accounts
- `listings` - Marketplace items
- `templates` - Saved configurations
- `ocr_scans` - OCR processing history
- `audit_logs` - Action tracking

---

### 4. Redis Container (Port 6379)

**What it does**:
- Caches frequently accessed data
- Stores rate limiting counters
- Manages session data

**How it works**:
```bash
# In-memory key-value store
# Extremely fast (microsecond latency)
# Used by Flask-Limiter for rate limiting
```

**Use cases**:
- ✅ Rate limiting (100 req/min general, 10 uploads/min, 50 exports/hour)
- ✅ Session caching (faster authentication)
- ✅ Temporary data storage

---

## 🚀 How to Use (Step-by-Step)

### Step 1: Start Everything

```bash
./docker-start.sh
```

**What happens**:
1. Creates Docker network (`marketplace-network`)
2. Creates 3 volumes (postgres_data, redis_data, upload_data)
3. Starts PostgreSQL (waits for healthy status)
4. Starts Redis (waits for healthy status)
5. Starts Backend (connects to PostgreSQL + Redis)
6. Starts Frontend (connects to Backend)

**Output**:
```
===========================================
Marketplace Bulk Editor - Docker Setup
===========================================

Starting PostgreSQL...
Starting Redis...

Waiting for PostgreSQL to be healthy...
 ✓ PostgreSQL is healthy
Waiting for Redis to be healthy...
 ✓ Redis is healthy

Starting Backend...
Starting Frontend...

===========================================
✓ All services started!
===========================================

Services:
  Frontend:  http://localhost:5173
  Backend:   http://localhost:5000
  PostgreSQL: localhost:5432
  Redis:     localhost:6379
```

---

### Step 2: Open the App

```bash
# Browser opens automatically, or visit:
http://localhost:5173
```

**You'll see**:
- ✅ Green status indicator: "Docker Backend Connected"
- ✅ File upload area
- ✅ All UI features enabled

**Click the status indicator** to see:
- Connection attempts
- Backend version
- Available endpoints (/api/auth, /api/listings, etc.)

---

### Step 3: Use the Features

#### A. Upload Excel File

**Via UI**:
1. Drag & drop Excel file or click upload area
2. Data appears in table
3. Edit inline (click cells)
4. Changes saved to PostgreSQL

**Via API**:
```bash
curl -X POST http://localhost:5000/api/listings/bulk \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[
    {"title":"Solar Panel 300W","price":150,"condition":"New"},
    {"title":"Solar Panel 400W","price":200,"condition":"New"}
  ]'
```

---

#### B. Save as Template

**Via UI**:
1. Configure common settings (category, shipping, condition)
2. Click "Save as Template"
3. Name it (e.g., "Solar Panels")
4. Reuse later for new listings

**Via API**:
```bash
curl -X POST http://localhost:5000/api/templates \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Solar Panel Template",
    "template_data": {
      "category": "Electronics",
      "offer_shipping": "Yes",
      "condition": "New"
    }
  }'
```

---

#### C. OCR Processing

**Via UI**:
1. Upload PDF product catalog
2. Backend extracts text with Tesseract
3. Review extracted data
4. Manually correct if needed
5. Convert to listings

**Via API**:
```bash
curl -X POST http://localhost:5000/api/ocr/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@product_catalog.pdf"
```

---

#### D. Export to SQL

**Via UI**:
1. Click "Export" button
2. Select "SQL"
3. Download `marketplace-listings.sql`
4. Contains INSERT statements for all listings

**Via API**:
```bash
curl -X POST http://localhost:5000/api/export/sql \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"listings":[...]}' \
  --output marketplace.sql
```

**Output**:
```sql
INSERT INTO listings (title, price, condition, description, category, offer_shipping)
VALUES ('Solar Panel 300W', 150.00, 'New', 'High-efficiency', 'Electronics', 'Yes');
```

---

### Step 4: Stop Everything

```bash
./docker-stop.sh
```

**What happens**:
- Stops all 4 containers
- Removes containers
- **Preserves data** in Docker volumes

**To delete data** (WARNING: irreversible):
```bash
docker volume rm marketplace-bulk-editor_postgres_data
docker volume rm marketplace-bulk-editor_redis_data
docker volume rm marketplace-bulk-editor_upload_data
```

---

## 🔐 Redis Improvements Explained

### What Redis Does

**1. Rate Limiting**
```python
# Flask-Limiter configuration
RATELIMIT_STORAGE_URL = redis://marketplace-redis:6379/1

# Limits:
@limiter.limit("100 per minute")  # General API
@limiter.limit("10 per minute")   # File uploads
@limiter.limit("50 per hour")     # Exports
```

**How it works**:
- Each request increments a counter in Redis
- Counter expires after time window
- If limit exceeded, returns 429 Too Many Requests

---

**2. Session Caching**
```python
# Store user session data
redis.set(f"session:{user_id}", session_data, ex=3600)

# Retrieve session
session_data = redis.get(f"session:{user_id}")
```

**Benefits**:
- Faster authentication (no database query)
- Reduced PostgreSQL load
- Better performance

---

**3. Distributed Locking**
```python
# Prevent concurrent OCR processing
lock = redis.lock(f"ocr:scan:{scan_id}", timeout=300)
if lock.acquire(blocking=False):
    # Process OCR
    lock.release()
```

**Use case**: Prevent duplicate OCR processing

---

## 📊 Performance Improvements

### Without Docker (Frontend Only)
- ❌ Data lost on page refresh
- ❌ No persistence
- ❌ Limited to browser storage (~10MB)
- ❌ No authentication
- ❌ No rate limiting

### With Docker (Full Stack)
- ✅ Data persists in PostgreSQL
- ✅ Unlimited storage
- ✅ JWT authentication
- ✅ Redis-backed rate limiting
- ✅ OCR processing
- ✅ SQL export
- ✅ Audit logging

---

## 🎓 Summary

### Quick Start
```bash
./docker-start.sh          # Start
http://localhost:5173      # Open UI
./docker-stop.sh           # Stop
```

### Key Features
- ✅ 28 API endpoints
- ✅ PostgreSQL database
- ✅ Redis caching
- ✅ JWT authentication
- ✅ OCR processing
- ✅ Multi-format export
- ✅ Templates system
- ✅ Rate limiting
- ✅ Audit logging

### Documentation
- **HOW_TO_USE_DOCKER_BACKEND.md** - Complete guide (583 lines)
- **DOCKER_SETUP.md** - Technical setup (242 lines)
- **DOCKER_QUICK_REFERENCE.md** - Quick reference (150 lines)
- **Architecture diagrams** - Visual explanations

---

**Next Steps**: Open `HOW_TO_USE_DOCKER_BACKEND.md` for detailed examples!

