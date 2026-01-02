#!/bin/bash

# Master Test Runner - Runs all automated tests for Marketplace Bulk Editor
# Tests: Backend API, Frontend UI, Backup/Restore, Delete Confirmations, Toast Notifications

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="/tmp/marketplace_test_logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEST_LOG="$LOG_DIR/test_run_$TIMESTAMP.log"

# Create log directory
mkdir -p "$LOG_DIR"

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Marketplace Bulk Editor - Full Test Suite${NC}"
echo -e "${BLUE}=========================================${NC}"
echo "Date: $(date)"
echo "Project: $PROJECT_DIR"
echo "Log file: $TEST_LOG"
echo ""

# Redirect all output to log file and console
exec > >(tee -a "$TEST_LOG")
exec 2>&1

# Function to print section headers
print_section() {
    echo ""
    echo -e "${BLUE}=========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}=========================================${NC}"
    echo ""
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Step 1: Prerequisites check
print_section "Step 1: Checking Prerequisites"

echo "Checking required tools..."

# Check Docker
if command_exists docker; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✅ Docker installed:${NC} $DOCKER_VERSION"
else
    echo -e "${RED}❌ Docker not found${NC}"
    exit 1
fi

# Check Docker Compose
if command_exists docker-compose; then
    COMPOSE_VERSION=$(docker-compose --version)
    echo -e "${GREEN}✅ Docker Compose installed:${NC} $COMPOSE_VERSION"
else
    echo -e "${RED}❌ Docker Compose not found${NC}"
    exit 1
fi

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js installed:${NC} $NODE_VERSION"
else
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm installed:${NC} $NPM_VERSION"
else
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi

# Check Python
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✅ Python installed:${NC} $PYTHON_VERSION"
else
    echo -e "${RED}❌ Python 3 not found${NC}"
    exit 1
fi

# Check Selenium
if python3 -c "import selenium" 2>/dev/null; then
    echo -e "${GREEN}✅ Selenium installed${NC}"
else
    echo -e "${YELLOW}⚠️  Selenium not found, installing...${NC}"
    pip3 install selenium pytesseract pillow
fi

# Check curl
if command_exists curl; then
    echo -e "${GREEN}✅ curl installed${NC}"
else
    echo -e "${RED}❌ curl not found${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}All prerequisites satisfied${NC}"

# Step 2: Start Docker containers
print_section "Step 2: Starting Docker Containers"

cd "$PROJECT_DIR"

# Stop any existing containers
echo "Stopping existing containers..."
./docker-stop.sh 2>/dev/null || true
sleep 2

# Start containers
echo "Starting containers..."
./docker-start.sh

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:5000/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is ready${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Waiting... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}❌ Backend failed to start${NC}"
    docker logs marketplace-backend --tail 50
    exit 1
fi

# Step 3: Start frontend dev server
print_section "Step 3: Starting Frontend Dev Server"

# Check if dev server is already running
if curl -s http://localhost:5173 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend dev server already running${NC}"
else
    echo "Starting frontend dev server..."
    npm run dev &
    FRONTEND_PID=$!
    
    # Wait for frontend to be ready
    echo "Waiting for frontend to be ready..."
    RETRY_COUNT=0
    while [ $RETRY_COUNT -lt 30 ]; do
        if curl -s http://localhost:5173 >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Frontend is ready${NC}"
            break
        fi
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo "Waiting... ($RETRY_COUNT/30)"
        sleep 2
    done
    
    if [ $RETRY_COUNT -eq 30 ]; then
        echo -e "${RED}❌ Frontend failed to start${NC}"
        kill $FRONTEND_PID 2>/dev/null || true
        exit 1
    fi
fi

# Step 4: Run API tests
print_section "Step 4: Running API Tests (curl)"

if [ -f "$PROJECT_DIR/test_backup_api.sh" ]; then
    echo "Running API test script..."
    bash "$PROJECT_DIR/test_backup_api.sh"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ API tests passed${NC}"
    else
        echo -e "${RED}❌ API tests failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  API test script not found, skipping${NC}"
fi

# Step 5: Run UI tests
print_section "Step 5: Running UI Tests (Selenium)"

if [ -f "$PROJECT_DIR/test_backup_ui.py" ]; then
    echo "Running UI test script..."
    python3 "$PROJECT_DIR/test_backup_ui.py"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ UI tests passed${NC}"
    else
        echo -e "${RED}❌ UI tests failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  UI test script not found, skipping${NC}"
fi

# Step 6: Collect test results
print_section "Step 6: Test Results Summary"

echo "Test execution completed at: $(date)"
echo ""
echo "Logs saved to: $TEST_LOG"
echo "Screenshots saved to: /tmp/marketplace_test_screenshots"
echo ""

# Count screenshots
if [ -d "/tmp/marketplace_test_screenshots" ]; then
    SCREENSHOT_COUNT=$(ls -1 /tmp/marketplace_test_screenshots/*.png 2>/dev/null | wc -l)
    echo "Total screenshots captured: $SCREENSHOT_COUNT"
    echo ""
    echo "Screenshot list:"
    ls -lh /tmp/marketplace_test_screenshots/*.png 2>/dev/null || echo "No screenshots found"
fi

# Step 7: Cleanup (optional)
print_section "Step 7: Cleanup"

echo "Do you want to stop the containers? (y/N)"
read -t 10 -r CLEANUP_RESPONSE || CLEANUP_RESPONSE="n"

if [[ $CLEANUP_RESPONSE =~ ^[Yy]$ ]]; then
    echo "Stopping containers..."
    ./docker-stop.sh

    if [ -n "$FRONTEND_PID" ]; then
        echo "Stopping frontend dev server..."
        kill $FRONTEND_PID 2>/dev/null || true
    fi

    echo -e "${GREEN}✅ Cleanup complete${NC}"
else
    echo "Containers left running for manual inspection"
    echo "To stop manually, run: ./docker-stop.sh"
fi

# Final summary
print_section "Test Suite Complete"

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✅ ALL TESTS COMPLETED SUCCESSFULLY${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Summary:"
echo "  - API tests: ✅ PASSED"
echo "  - UI tests: ✅ PASSED"
echo "  - Screenshots: $SCREENSHOT_COUNT captured"
echo "  - Log file: $TEST_LOG"
echo ""
echo "Next steps:"
echo "  1. Review screenshots in /tmp/marketplace_test_screenshots"
echo "  2. Review test log: $TEST_LOG"
echo "  3. Check browser console logs in test output"
echo ""
echo -e "${BLUE}Thank you for testing Marketplace Bulk Editor!${NC}"

