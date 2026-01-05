#!/bin/bash
# Emergency cleanup script for orphaned Flask/Gunicorn/PaddleOCR processes
# Run this if system is sluggish due to too many backend processes

echo "==========================================="
echo "Emergency Process Cleanup"
echo "==========================================="
echo ""

# Show current process count
echo "Current Flask/Gunicorn processes:"
ps aux | grep -E "flask run|gunicorn.*app:app|python.*app.py" | grep -v grep | wc -l

echo ""
echo "Current PaddleOCR processes:"
ps aux | grep paddleocr | grep -v grep | wc -l

echo ""
echo "Killing all Flask/Gunicorn/PaddleOCR/Vite processes..."
echo ""

# Kill processes on ports 5173 and 5000
fuser -k 5173/tcp 2>/dev/null && echo "✓ Killed process on port 5173" || echo "  No process on port 5173"
fuser -k 5000/tcp 2>/dev/null && echo "✓ Killed process on port 5000" || echo "  No process on port 5000"

# Kill Flask dev server processes
pkill -9 -f "flask run" 2>/dev/null && echo "✓ Killed Flask dev server processes" || echo "  No Flask dev server processes found"

# Kill Gunicorn processes
pkill -9 -f "gunicorn.*app:app" 2>/dev/null && echo "✓ Killed Gunicorn processes" || echo "  No Gunicorn processes found"

# Kill Python app.py processes
pkill -9 -f "python.*app.py" 2>/dev/null && echo "✓ Killed Python app.py processes" || echo "  No Python app.py processes found"

# Kill PaddleOCR processes
pkill -9 -f "paddleocr" 2>/dev/null && echo "✓ Killed PaddleOCR processes" || echo "  No PaddleOCR processes found"

# Kill Vite dev server
pkill -9 -f "vite" 2>/dev/null && echo "✓ Killed Vite dev server" || echo "  No Vite dev server found"
pkill -9 -f "npm run dev" 2>/dev/null && echo "✓ Killed npm run dev" || echo "  No npm run dev found"

echo ""
echo "Cleanup complete!"
echo ""

# Show remaining process count
echo "Remaining Flask/Gunicorn processes:"
ps aux | grep -E "flask run|gunicorn.*app:app|python.*app.py" | grep -v grep | wc -l

echo ""
echo "Remaining PaddleOCR processes:"
ps aux | grep paddleocr | grep -v grep | wc -l

echo ""
echo "If processes remain, they may be inside Docker containers."
echo "Run: docker ps"
echo "Then: docker exec <container_id> ps aux"
echo ""

