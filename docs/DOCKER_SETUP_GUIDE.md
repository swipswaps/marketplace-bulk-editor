# Docker Backend Setup Guide - Step by Step

**For**: marketplace-bulk-editor  
**Date**: 2025-12-20  
**Difficulty**: Easy (copy-paste commands)

---

## 🎯 What You'll Get

**Without Docker** (Frontend only):
- ❌ Data lost on browser refresh
- ❌ No user accounts
- ❌ No database persistence
- ❌ Limited features

**With Docker** (Full stack):
- ✅ PostgreSQL database (data persists forever)
- ✅ User authentication (secure accounts)
- ✅ Redis caching (faster performance)
- ✅ OCR processing (extract text from images)
- ✅ Multi-format export (CSV, JSON, XLSX, SQL)
- ✅ Templates (save/reuse configurations)
- ✅ Rate limiting (API protection)

---

## 📋 Prerequisites

### 1. Check if Docker is Installed

```bash
docker --version
```

**Expected output**: `Docker version 20.10.x` or higher

**If not installed**:
- **Ubuntu/Debian**: `sudo apt-get install docker.io docker-compose`
- **macOS**: Download [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Windows**: Download [Docker Desktop](https://www.docker.com/products/docker-desktop)

### 2. Check if Docker is Running

```bash
docker ps
```

**Expected output**: Table of running containers (may be empty)

**If error**: Start Docker Desktop or run `sudo systemctl start docker`

---

## 🚀 Installation (5 Minutes)

### Step 1: Clone the Repository

```bash
# Navigate to where you want the project
cd ~/Documents

# Clone the repository
git clone https://github.com/swipswaps/marketplace-bulk-editor.git

# Enter the directory
cd marketplace-bulk-editor
```

**Verify**:
```bash
ls -la
```

**You should see**:
- `docker-start.sh` ✅
- `docker-stop.sh` ✅
- `docker-compose.yml` ✅
- `backend/` directory ✅

---

### Step 2: Make Scripts Executable

```bash
chmod +x docker-start.sh docker-stop.sh
```

**Verify**:
```bash
ls -l docker-*.sh
```

**You should see**: `-rwxr-xr-x` (x = executable)

---

### Step 3: Start All Services

```bash
./docker-start.sh
```

**What happens** (takes 2-3 minutes first time):
1. 🔄 Downloads Docker images (PostgreSQL, Redis, Python)
2. 🔄 Builds backend container
3. 🔄 Installs Python dependencies
4. 🔄 Initializes database
5. 🔄 Starts all services
6. ✅ Opens browser automatically

**Expected output**:
```
[1/5] Building backend Docker image...
[2/5] Starting PostgreSQL...
[3/5] Starting Redis...
[4/5] Starting backend API...
[5/5] Starting frontend dev server...

✓ All services started!

Backend API: http://localhost:5000
Frontend UI: http://localhost:5173
PostgreSQL: localhost:5432
Redis: localhost:6379

Opening browser...
```

**If you see errors**, see [Troubleshooting](#troubleshooting) below.

---

### Step 4: Verify Everything Works

**Open browser**: http://localhost:5173

**You should see**:
1. ✅ Green indicator: "Docker Backend Connected"
2. ✅ File upload area
3. ✅ "Register" and "Login" buttons in top-right

**Click "Backend Status" to expand**:
- ✅ Shows 28 API endpoints
- ✅ Shows database status
- ✅ Shows Redis status

---

## 🎮 Using the Backend

### Create Your Account

1. Click **"Register"** (top-right)
2. Enter:
   - Email: `your@email.com`
   - Password: `SecurePass123!` (min 8 chars)
   - Full Name: `Your Name`
3. Click **"Register"**
4. You're automatically logged in! ✅

### Save Data to Database

1. Import or create listings
2. Click **"Save to Database"** button
3. Check **"Database Debug Logs"** panel at bottom
4. You should see: `✅ Saved X listings to database`

### Load Data from Database

1. Click **"Load from Database"** button
2. Your saved listings appear in the table
3. Data persists even after browser refresh! ✅

---

## 🛑 Stopping the Backend

### Temporary Stop (Preserves Data)

```bash
./docker-stop.sh
```

**What happens**:
- ✅ All containers stopped
- ✅ Data preserved in Docker volumes
- ✅ Can restart anytime with `./docker-start.sh`

### Complete Removal (Deletes Everything)

```bash
# Stop containers
./docker-stop.sh

# Remove volumes (DELETES ALL DATA)
docker volume rm marketplace-postgres-data marketplace-redis-data

# Remove images (saves disk space)
docker rmi marketplace-backend postgres:15 redis:7
```

⚠️ **Warning**: This deletes all your data permanently!

---

## 🔧 Maintenance

### View Logs

```bash
# Backend API logs
docker logs marketplace-backend

# PostgreSQL logs
docker logs marketplace-postgres

# Redis logs
docker logs marketplace-redis

# Follow logs in real-time
docker logs -f marketplace-backend
```

### Restart a Service

```bash
# Restart backend only
docker restart marketplace-backend

# Restart database only
docker restart marketplace-postgres
```

### Check Service Status

```bash
# List all containers
docker ps -a

# Check specific container
docker ps --filter "name=marketplace-backend"
```

---

## 🐛 Troubleshooting

### Problem: "Port already in use"

**Error**: `Bind for 0.0.0.0:5000 failed: port is already allocated`

**Solution**:
```bash
# Find what's using the port
sudo lsof -i :5000

# Kill the process
sudo kill -9 <PID>

# Or change the port in docker-compose.yml
```

### Problem: "Cannot connect to Docker daemon"

**Error**: `Cannot connect to the Docker daemon`

**Solution**:
```bash
# Start Docker service
sudo systemctl start docker

# Or start Docker Desktop (macOS/Windows)
```

### Problem: "Backend shows disconnected"

**Check backend is running**:
```bash
docker ps | grep marketplace-backend
```

**Check backend logs**:
```bash
docker logs marketplace-backend --tail 50
```

**Restart backend**:
```bash
docker restart marketplace-backend
```

### Problem: "Database connection failed"

**Check PostgreSQL is running**:
```bash
docker ps | grep marketplace-postgres
```

**Check database logs**:
```bash
docker logs marketplace-postgres --tail 50
```

**Restart database**:
```bash
docker restart marketplace-postgres
```

---

## 📊 Advanced Usage

### Access Database Directly

```bash
# Connect to PostgreSQL
docker exec -it marketplace-postgres psql -U marketplace_user -d marketplace_db

# Run SQL queries
SELECT * FROM users;
SELECT * FROM listings;
\q  # Exit
```

### Access Redis Directly

```bash
# Connect to Redis
docker exec -it marketplace-redis redis-cli

# Run Redis commands
KEYS *
GET rate_limit:*
QUIT  # Exit
```

### Export Database Backup

```bash
# Backup database
docker exec marketplace-postgres pg_dump -U marketplace_user marketplace_db > backup.sql

# Restore database
docker exec -i marketplace-postgres psql -U marketplace_user marketplace_db < backup.sql
```

---

## 🎓 Next Steps

1. ✅ **Read the full guide**: See `HOW_TO_USE_DOCKER_BACKEND.md` for API documentation
2. ✅ **Check debug console**: Scroll to bottom of app to see live console output
3. ✅ **Explore features**: Try OCR, templates, multi-format export
4. ✅ **Join the community**: Report issues on GitHub

---

## 📞 Getting Help

**If you're stuck**:
1. Check the **Debug Console** at bottom of app (shows all errors)
2. Check **Database Debug Logs** (shows database operations)
3. Run `docker logs marketplace-backend` (shows backend errors)
4. Open an issue on GitHub with:
   - Error message from debug console
   - Output of `docker ps -a`
   - Output of `docker logs marketplace-backend --tail 50`

---

**Setup complete!** 🎉 You now have a full-stack marketplace listing editor with database persistence.

