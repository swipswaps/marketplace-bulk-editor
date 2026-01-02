# Testing Guide - Marketplace Bulk Editor

This document explains how to run automated tests for the Marketplace Bulk Editor application.

## Test Suite Overview

The test suite includes:

1. **API Tests** (`test_backup_api.sh`) - Tests backend endpoints with curl
2. **UI Tests** (`test_backup_ui.py`) - Tests frontend with Selenium
3. **Master Runner** (`run_all_tests.sh`) - Runs all tests in sequence

## Features Tested

### ✅ Backup/Restore System
- Database backup creation (PostgreSQL)
- Backup file download
- Backup file upload and restore
- Data persistence verification

### ✅ Delete Confirmations
- Single row delete confirmation dialog
- Bulk delete confirmation dialog
- "Don't ask me again" checkbox
- localStorage preference persistence

### ✅ Toast Notifications
- Success notifications
- Error notifications
- Loading states with progress indicators
- Auto-dismiss behavior

## Prerequisites

### Required Software

```bash
# Check Docker
docker --version
# Required: Docker 20.10+

# Check Docker Compose
docker-compose --version
# Required: 1.29+

# Check Node.js
node --version
# Required: 18+

# Check Python
python3 --version
# Required: 3.8+

# Check curl
curl --version
```

### Required Python Packages

```bash
pip3 install selenium pytesseract pillow
```

### Required System Packages

**Browser Priority: Firefox → Chromium → Chrome**

The test suite will try browsers in this order:
1. Firefox (preferred)
2. Chromium (if Firefox unavailable)
3. Chrome (if Chromium unavailable)

**Install at least one browser:**

```bash
# Option 1: Firefox (recommended)
# Ubuntu/Debian
sudo apt-get install firefox firefox-geckodriver tesseract-ocr

# Fedora/RHEL
sudo dnf install firefox tesseract

# Option 2: Chromium
# Ubuntu/Debian
sudo apt-get install chromium-browser chromium-chromedriver tesseract-ocr

# Fedora/RHEL
sudo dnf install chromium chromedriver tesseract

# Option 3: Chrome (last resort)
# Download from https://www.google.com/chrome/
# Then install chromedriver
sudo apt-get install tesseract-ocr
```

## Running Tests

### Option 1: Run All Tests (Recommended)

```bash
# Run complete test suite
./run_all_tests.sh
```

**What this does:**
1. Checks prerequisites
2. Starts Docker containers (PostgreSQL, Redis, Backend)
3. Starts frontend dev server
4. Runs API tests
5. Runs UI tests with Selenium
6. Collects results and screenshots
7. Optionally cleans up

**Expected output:**
```
=========================================
Marketplace Bulk Editor - Full Test Suite
=========================================

Step 1: Checking Prerequisites
✅ Docker installed: Docker version 24.0.7
✅ Docker Compose installed: docker-compose version 1.29.2
✅ Node.js installed: v20.10.0
✅ npm installed: 10.2.3
✅ Python installed: Python 3.11.6
✅ Selenium installed
✅ curl installed

Step 2: Starting Docker Containers
✅ Backend is ready

Step 3: Starting Frontend Dev Server
✅ Frontend is ready

Step 4: Running API Tests (curl)
✅ API tests passed

Step 5: Running UI Tests (Selenium)
✅ UI tests passed

Step 6: Test Results Summary
Total screenshots captured: 12

=========================================
✅ ALL TESTS COMPLETED SUCCESSFULLY
=========================================
```

### Option 2: Run API Tests Only

```bash
# Start backend first
./docker-start.sh

# Run API tests
./test_backup_api.sh
```

**Expected output:**
```
=========================================
Marketplace Backup API Test
=========================================

Step 1: Checking backend health...
✅ PASS: Backend is healthy

Step 2: Registering test user...
✅ PASS: User registered successfully

Step 3: Getting backup system info...
✅ PASS: Backup info retrieved
Database Type: postgresql
Backup Supported: true

Step 4: Creating test listings...
  ✅ Created listing 1
  ✅ Created listing 2
  ✅ Created listing 3

Step 5: Creating database backup...
✅ PASS: Backup created successfully
Backup file: /tmp/test_backup_1735567890.sql
File size: 12K

Step 6: Deleting a test listing...
✅ PASS: Listing deleted

Step 7: Restoring database from backup...
✅ PASS: Backup restored successfully

Step 8: Verifying restored data...
✅ PASS: Data restored correctly (found 3 listings)

=========================================
✅ ALL API TESTS PASSED
=========================================
```

### Option 3: Run UI Tests Only

```bash
# Start backend and frontend first
./docker-start.sh
npm run dev &

# Run UI tests
python3 test_backup_ui.py
```

**Expected output:**
```
============================================================
Marketplace Backup UI Test
============================================================

Step 1: Loading application
📸 Screenshot saved: /tmp/marketplace_test_screenshots/20251229_123456_01_initial_load.png
✅ PASS: Application loaded successfully

Step 2: Checking backend status
✅ PASS: Backend is connected

Step 3: Registering test user
✅ PASS: User registration/login completed

Step 4: Opening Settings modal
✅ PASS: Settings modal opened

Step 5: Testing Backup UI
✅ PASS: Backup section found
✅ PASS: Backup toast notification appeared

Step 6: Testing Delete Confirmation Dialog
✅ PASS: Delete confirmation dialog appeared
✅ PASS: 'Don't ask again' checkbox found

============================================================
✅ ALL UI TESTS COMPLETED
============================================================

Screenshots saved to: /tmp/marketplace_test_screenshots
Total screenshots: 12
```

## Test Results

### Screenshots

All UI test screenshots are saved to `/tmp/marketplace_test_screenshots/`

**Screenshot naming convention:**
```
YYYYMMDD_HHMMSS_NN_description.png

Examples:
20251229_123456_01_initial_load.png
20251229_123456_05_after_submit.png
20251229_123456_10_delete_confirmation.png
```

### Logs

Test logs are saved to `/tmp/marketplace_test_logs/`

**Log naming convention:**
```
test_run_YYYYMMDD_HHMMSS.log
```

### OCR Output

Each screenshot is processed with OCR to verify UI text. OCR output is included in the test logs.

**Example OCR output:**
```
OCR Output:
------------------------------------------------------------
Marketplace Bulk Editor

Backend Status: Connected

Database Backup & Restore

Create Backup    Restore Backup

Don't ask me again
------------------------------------------------------------
```

## Troubleshooting

### Issue: Backend not starting

**Symptoms:**
```
❌ Backend failed to start
```

**Solution:**
```bash
# Check Docker logs
docker logs marketplace-backend --tail 50

# Check if port 5000 is in use
sudo netstat -tlnp | grep 5000

# Restart containers
./docker-stop.sh
./docker-start.sh
```

### Issue: Frontend not starting

**Symptoms:**
```
❌ Frontend failed to start
```

**Solution:**
```bash
# Check if port 5173 is in use
sudo netstat -tlnp | grep 5173

# Install dependencies
npm install

# Start manually
npm run dev
```

### Issue: Selenium tests fail

**Symptoms:**
```
❌ No browser available (tried Firefox, Chromium, Chrome)
```

**Solution:**

The test suite tries browsers in this order: Firefox → Chromium → Chrome

**Install at least one browser:**

```bash
# Option 1: Install Firefox (recommended)
sudo apt-get install firefox firefox-geckodriver

# Option 2: Install Chromium
sudo apt-get install chromium-browser chromium-chromedriver

# Option 3: Install Chrome
# Download from https://www.google.com/chrome/
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt-get install -f
```

**Check which browsers are available:**

```bash
# Check Firefox
which firefox
which geckodriver

# Check Chromium
which chromium
which chromium-browser
ls /usr/bin/chromium*

# Check Chrome
which google-chrome
which chromedriver
```

### Issue: OCR not working

**Symptoms:**
```
OCR failed: tesseract not found
```

**Solution:**
```bash
# Install Tesseract
sudo apt-get install tesseract-ocr

# Install Python packages
pip3 install pytesseract pillow
```

## Manual Testing

If automated tests fail, you can test manually:

### 1. Test Backup Creation

1. Start backend: `./docker-start.sh`
2. Start frontend: `npm run dev`
3. Open http://localhost:5173
4. Register/login
5. Click Settings (gear icon)
6. Scroll to "Database Backup & Restore"
7. Click "Create Backup"
8. Verify file downloads

### 2. Test Backup Restore

1. Click "Restore Backup"
2. Select backup file
3. Click "Restore Backup" in confirmation dialog
4. Verify page reloads
5. Verify data is restored

### 3. Test Delete Confirmation

1. Add a listing
2. Click delete (trash icon)
3. Verify confirmation dialog appears
4. Check "Don't ask me again"
5. Click "Delete"
6. Delete another listing
7. Verify no confirmation dialog

## CI/CD Integration

To run tests in CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y tesseract-ocr chromium-browser chromium-chromedriver
          pip3 install selenium pytesseract pillow
      
      - name: Run tests
        run: ./run_all_tests.sh
      
      - name: Upload screenshots
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-screenshots
          path: /tmp/marketplace_test_screenshots/
```

## Next Steps

After tests pass:

1. ✅ Review screenshots to verify UI appearance
2. ✅ Review test logs for any warnings
3. ✅ Test manually to verify user experience
4. ✅ Deploy to production
5. ✅ Run tests against production URL

## Support

If tests fail and you need help:

1. Check test logs in `/tmp/marketplace_test_logs/`
2. Review screenshots in `/tmp/marketplace_test_screenshots/`
3. Check Docker logs: `docker logs marketplace-backend`
4. Check browser console in screenshots
5. Open an issue with logs and screenshots attached

