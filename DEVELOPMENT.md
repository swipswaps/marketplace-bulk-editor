# Development Guide

## Backend Code Changes - IMPORTANT!

### The Problem
When you edit Python files in `backend/`, Flask's auto-reload detects the change and restarts the server, BUT **Python caches the old module in memory**.

**Symptoms:**
- You edit `backend/utils/ocr_processor.py`
- Flask logs show "Detected change, reloading"
- You test the endpoint
- **Old code still runs!** (Python cached the old module)

### The Solution
**Restart the backend container to clear Python's module cache:**

```bash
docker restart marketplace-backend
```

**Wait 5-10 seconds for Flask to start, then test again.**

### Why This Happens
- Flask's auto-reload uses `watchdog` to detect file changes
- Flask restarts the server process
- BUT Python's import system caches modules in `sys.modules`
- The cached module persists across Flask restarts within the same container
- Only restarting the container clears the cache

### When to Restart vs Rebuild

**Restart (fast - 5 seconds):**
```bash
docker restart marketplace-backend
```
Use when:
- ✅ Editing Python files (`.py`)
- ✅ Changing configuration values in code
- ✅ Modifying routes, utils, models

**Rebuild (slow - 30+ seconds):**
```bash
docker compose down
docker compose up -d --build backend
```
Use when:
- ✅ Adding dependencies to `requirements.txt`
- ✅ Changing `Dockerfile`
- ✅ Changing `docker-compose.yml` environment variables

### Workflow Example

```bash
# 1. Edit OCR processor
vim backend/utils/ocr_processor.py

# 2. Restart backend to clear Python cache
docker restart marketplace-backend

# 3. Wait for Flask to start
sleep 5

# 4. Test the change
curl -X POST http://localhost:5000/api/ocr/process \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.pdf"
```

---

## Starting and Stopping the Dev Server

### ✅ Recommended: Use Scripts

Always use the provided scripts for clean process management:

```bash
# Start the dev server
./start.sh

# Stop the dev server
./stop.sh

# Interactive management
./dev.sh
```

### What Each Script Does

#### `./start.sh` - Clean Start
- Checks if server is already running
- Kills any orphaned vite processes
- Starts dev server in background
- Saves PID to `.vite.pid`
- Logs output to `.vite.log`
- Shows server URL and status

**When to use:** Starting the server for the first time or after stopping it.

#### `./stop.sh` - Clean Shutdown
- Reads PID from `.vite.pid`
- Gracefully stops the process
- Force kills if needed
- Cleans up orphaned processes
- Kills any process on port 5173
- Removes PID file

**When to use:** Stopping the server cleanly before shutting down or switching branches.

#### `./dev.sh` - Interactive Management
- Checks if server is running
- Shows interactive menu if running:
  1. Open in browser
  2. Restart server
  3. Stop server
  4. View logs
  5. Exit
- Starts server if not running

**When to use:** Quick status check, restart, or log viewing.

---

## ⚠️ Manual Start (Not Recommended)

If you run `npm run dev` manually:

```bash
npm run dev
```

**Problems:**
- ❌ Leaves orphaned processes when you Ctrl+C
- ❌ Can cause port conflicts on next start
- ❌ No PID tracking
- ❌ No log file

**If you do this:** Always run `./stop.sh` before starting again to clean up.

---

## Common Scenarios

### First Time Setup
```bash
npm install
./start.sh
```

### Daily Development
```bash
# Morning - start server
./start.sh

# During day - check status or restart
./dev.sh

# End of day - stop server
./stop.sh
```

### Troubleshooting Port Conflicts

If you see "port 5173 already in use":

```bash
# Clean shutdown
./stop.sh

# Start fresh
./start.sh
```

### Viewing Logs

```bash
# Real-time logs
tail -f .vite.log

# Or use interactive script
./dev.sh
# Choose option 4
```

### Checking What's Running

```bash
# Check if PID file exists
cat .vite.pid

# Check if process is running
ps -p $(cat .vite.pid)

# Or use interactive script
./dev.sh
```

---

## Best Practices

1. **Always use `./start.sh` and `./stop.sh`** - Ensures clean process management
2. **Don't use Ctrl+C on `npm run dev`** - Leaves orphaned processes
3. **Check logs if server fails** - `cat .vite.log`
4. **Run `./stop.sh` before switching branches** - Prevents conflicts
5. **Add `.vite.pid` and `.vite.log` to `.gitignore`** - Already done

---

## Files Created by Scripts

- `.vite.pid` - Process ID of running dev server
- `.vite.log` - Output logs from vite dev server

Both are in `.gitignore` and safe to delete when server is stopped.

