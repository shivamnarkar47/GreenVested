#!/bin/bash

# ESG Scoring Platform - Cleanup Script
# Stops all running servers and cleans up

echo "ESG Platform - Cleanup"

# Check if PID file exists
if [ -f ".esg_pids" ]; then
    echo "Stopping servers..."
    PIDS=$(cat .esg_pids)
    for PID in $PIDS; do
        if kill -0 $PID 2>/dev/null; then
            kill $PID 2>/dev/null && echo "Stopped process $PID" || true
        fi
    done
    rm -f .esg_pids
    echo "Cleanup complete!"
else
    # Fallback: kill by port
    echo "No PID file found, checking ports..."
    
    if lsof -ti:8000 >/dev/null 2>&1; then
        echo "Killing process on port 8000..."
        kill $(lsof -ti:8000) 2>/dev/null || true
    fi
    
    if lsof -ti:5173 >/dev/null 2>&1; then
        echo "Killing process on port 5173..."
        kill $(lsof -ti:5173) 2>/dev/null || true
    fi
    
    echo "Cleanup complete!"
fi

# Optional: remove virtual environment and node_modules
# Uncomment the following lines to do a full cleanup:
# rm -rf backend/venv
# rm -rf frontend/node_modules
# rm -f backend.log frontend.log
