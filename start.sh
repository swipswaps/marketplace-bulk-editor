#!/bin/bash

# Marketplace Bulk Editor - Start Script
# Ensures clean startup with no stray processes
# Auto-stops existing instance before starting new one

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PID_FILE="$SCRIPT_DIR/.vite.pid"
LOG_FILE="$SCRIPT_DIR/.vite.log"

# Check if already running - if so, stop it first
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "⚠️  Server is already running (PID: $PID) - stopping it first..."
        kill "$PID" 2>/dev/null
        # Wait for graceful shutdown
        for i in {1..5}; do
            if ! ps -p "$PID" > /dev/null 2>&1; then
                break
            fi
            sleep 1
        done
        # Force kill if still running
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "   Force killing process..."
            kill -9 "$PID" 2>/dev/null
        fi
        echo "✅ Previous instance stopped"
    fi
    rm -f "$PID_FILE"
fi

# Kill any existing vite processes for this project
echo "🧹 Cleaning up any stray processes..."
pkill -f "vite.*marketplace-bulk-editor" 2>/dev/null || true
sleep 1

# Kill any process on ports 5173 and 5174 to ensure clean start
for PORT in 5173 5174; do
    # First check if Docker container is using this port
    DOCKER_CONTAINER=$(docker ps --format '{{.Names}}' --filter "publish=$PORT" 2>/dev/null | head -1)
    if [ -n "$DOCKER_CONTAINER" ]; then
        echo "   ⚠️  Docker container '$DOCKER_CONTAINER' is using port $PORT"
        echo "   Stopping Docker container..."
        docker stop "$DOCKER_CONTAINER" >/dev/null 2>&1
        echo "   ✅ Docker container stopped"
        sleep 1
    fi

    # Then check for host processes on this port
    PORT_PID=$(lsof -ti:$PORT 2>/dev/null)
    if [ -n "$PORT_PID" ]; then
        echo "   Killing process on port $PORT (PID: $PORT_PID)..."
        kill -9 "$PORT_PID" 2>/dev/null
        # Wait for this specific port to be released
        for i in {1..10}; do
            if ! lsof -ti:$PORT >/dev/null 2>&1; then
                echo "   Port $PORT released"
                break
            fi
            sleep 0.5
        done
    fi
done

# Additional wait to ensure ports are fully released
sleep 1

# Start the dev server
echo "🚀 Starting Marketplace Bulk Editor..."
echo "📁 Working directory: $SCRIPT_DIR"
echo "📝 Logs: $LOG_FILE"

# Start vite in background and capture PID
nohup npm run dev > "$LOG_FILE" 2>&1 &
VITE_PID=$!

# Save PID
echo "$VITE_PID" > "$PID_FILE"

# Wait a moment for server to start
sleep 2

# Check if process is still running
if ps -p "$VITE_PID" > /dev/null 2>&1; then
    echo "✅ Server started successfully (PID: $VITE_PID)"
    echo ""
    echo "   Local:   http://localhost:5173"
    echo "   Network: Check the log file for network URL"
    echo ""
    echo "📊 To view logs: tail -f $LOG_FILE"
    echo "🛑 To stop: ./stop.sh"
else
    echo "❌ Failed to start server"
    echo "   Check logs: cat $LOG_FILE"
    rm -f "$PID_FILE"
    exit 1
fi

