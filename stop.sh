#!/bin/bash

# ESG Scoring Platform - Enhanced Stop Script
# Cleanly shuts down all running servers with improved error handling

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  ESG Platform - Stop Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[ℹ]${NC} $1"
}

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if PID file exists
if [ ! -f ".esg_pids" ]; then
    print_warning "No .esg_pids file found. No servers appear to be running."
    print_info "If servers are running, kill them manually:"
    echo "  pkill -f uvicorn"
    echo "  pkill -f 'vite'"
    echo "  pkill -f 'pnpm run dev'"
else
    print_info "Found PID file. Stopping servers..."

    # Read PIDs and kill processes
    killed_count=0
    while read -r pid; do
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            print_info "Stopping process $pid..."
            if kill "$pid" 2>/dev/null; then
                killed_count=$((killed_count + 1))
            fi

            # Wait a bit for graceful shutdown
            sleep 2

            # Force kill if still running
            if kill -0 "$pid" 2>/dev/null; then
                print_warning "Process $pid didn't respond to SIGTERM, force killing..."
                kill -9 "$pid" 2>/dev/null || true
            fi
        fi
    done < .esg_pids

    # Clean up PID file
    rm -f .esg_pids
fi

# Kill any remaining processes on our ports
if command -v lsof >/dev/null 2>&1; then
    print_info "Checking for any remaining processes on ports 8000 and 5173/5174..."

    for port in 8000 5173 5174; do
        pids=$(lsof -ti:$port 2>/dev/null || true)
        if [ -n "$pids" ]; then
            print_warning "Found process(es) still on port $port, killing..."
            echo "$pids" | xargs kill -9 2>/dev/null || true
        fi
    done
fi

# Kill any remaining Python/Node processes related to our project
if pgrep -f "uvicorn.*app.main:app" >/dev/null 2>&1; then
    print_warning "Found remaining uvicorn processes, killing..."
    pkill -f "uvicorn.*app.main:app" 2>/dev/null || true
fi

if pgrep -f "pnpm run dev" >/dev/null 2>&1; then
    print_warning "Found remaining pnpm dev processes, killing..."
    pkill -f "pnpm run dev" 2>/dev/null || true
fi

if pgrep -f "vite" >/dev/null 2>&1; then
    print_warning "Found remaining vite processes, killing..."
    pkill -f "vite" 2>/dev/null || true
fi

print_status "All servers stopped successfully"
echo ""
echo -e "${GREEN}Server cleanup complete!${NC}"
echo ""
echo -e "To restart: ${BLUE}./run.sh${NC}"

# Optional: Show cleanup options
echo ""
echo -e "${YELLOW}Optional cleanup commands:${NC}"
echo -e "  Remove logs:     ${BLUE}rm -f backend.log frontend.log${NC}"
echo -e "  Deep clean:      ${BLUE}rm -rf backend/venv frontend/node_modules${NC}"
