#!/bin/bash

# Development server management script
# Checks for running instances and manages them intelligently

PID_FILE=".vite.pid"
LOG_FILE=".vite.log"
PORT=5173

echo "🔍 Checking for running dev server..."

# Check if PID file exists
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    
    # Check if process is actually running
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo "✅ Dev server already running (PID: $OLD_PID)"
        echo "📍 URL: http://localhost:$PORT"
        echo ""
        echo "Options:"
        echo "  1) Open in browser"
        echo "  2) Restart server"
        echo "  3) Stop server"
        echo "  4) View logs"
        echo "  5) Exit"
        echo ""
        read -p "Choose option (1-5): " choice
        
        case $choice in
            1)
                echo "🌐 Opening browser..."
                xdg-open "http://localhost:$PORT" 2>/dev/null || open "http://localhost:$PORT" 2>/dev/null || echo "Please open http://localhost:$PORT manually"
                ;;
            2)
                echo "🔄 Restarting server..."
                kill "$OLD_PID" 2>/dev/null
                rm -f "$PID_FILE"
                sleep 2
                ;;
            3)
                echo "🛑 Stopping server..."
                kill "$OLD_PID" 2>/dev/null
                rm -f "$PID_FILE"
                echo "✅ Server stopped"
                exit 0
                ;;
            4)
                echo "📋 Viewing logs..."
                tail -f "$LOG_FILE"
                exit 0
                ;;
            5)
                echo "👋 Exiting"
                exit 0
                ;;
            *)
                echo "Invalid option"
                exit 1
                ;;
        esac
    else
        echo "⚠️  Stale PID file found (process not running)"
        rm -f "$PID_FILE"
    fi
fi

# Kill any orphaned vite processes on the default port
echo "🧹 Cleaning up orphaned processes..."
lsof -ti:$PORT | xargs kill -9 2>/dev/null || true

# Start new dev server
echo "🚀 Starting dev server..."
npm run dev > "$LOG_FILE" 2>&1 &
NEW_PID=$!

# Save PID
echo "$NEW_PID" > "$PID_FILE"

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 3

# Check if server started successfully
if ps -p "$NEW_PID" > /dev/null 2>&1; then
    # Extract actual port from logs (in case 5173 was taken)
    ACTUAL_PORT=$(grep -oP 'localhost:\K\d+' "$LOG_FILE" | head -1)
    if [ -z "$ACTUAL_PORT" ]; then
        ACTUAL_PORT=$PORT
    fi
    
    echo ""
    echo "✅ Dev server started successfully!"
    echo "📍 URL: http://localhost:$ACTUAL_PORT"
    echo "🆔 PID: $NEW_PID"
    echo "📋 Logs: tail -f $LOG_FILE"
    echo ""
    echo "To stop: ./stop.sh or kill $NEW_PID"
    echo ""
    
    # Show last few lines of log
    echo "📋 Recent logs:"
    tail -5 "$LOG_FILE"
else
    echo "❌ Failed to start dev server"
    echo "📋 Check logs: cat $LOG_FILE"
    rm -f "$PID_FILE"
    exit 1
fi

