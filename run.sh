#!/bin/bash

# ESG Scoring Platform - Startup Script
# Runs both backend and frontend concurrently

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  ESG Scoring Platform - Quick Start${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Detect OS
OS="$(uname -s)"
case "$OS" in
    Linux*)     PLATFORM="linux";;
    Darwin*)    PLATFORM="macos";;
    CYGWIN*|MINGW*|MSYS*) PLATFORM="windows";;
    *)          PLATFORM="unknown";;
esac

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

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v python3 >/dev/null 2>&1; then
    print_error "Python 3 not found. Please install Python 3.12+"
    exit 1
fi
print_status "Python 3 found"

if ! command -v pnpm >/dev/null 2>&1; then
    print_error "pnpm not found. Please install pnpm first"
    exit 1
fi
print_status "pnpm found ($(pnpm --version))"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Backend setup
echo ""
echo -e "${BLUE}Setting up backend...${NC}"

# Create virtual environment if needed
BACKEND_VENV="$SCRIPT_DIR/backend/venv"
if [ ! -f "$BACKEND_VENV/bin/activate" ]; then
    print_warning "Creating Python virtual environment..."
    rm -rf "$BACKEND_VENV" 2>/dev/null || true
    cd backend
    python3 -m venv venv
    cd ..
fi
print_status "Virtual environment ready"

# Activate venv and install dependencies
print_status "Checking backend dependencies..."
source "$BACKEND_VENV/bin/activate"

# Check if fastapi is installed
if ! pip show fastapi >/dev/null 2>&1; then
    print_warning "Installing Python packages..."
    pip install --quiet -r backend/requirements.txt 2>&1 | grep -v "Requirement already satisfied" || true
fi
print_status "Backend dependencies ready"

# Install frontend dependencies
echo ""
echo -e "${BLUE}Installing frontend dependencies...${NC}"

cd frontend

# Use pnpm
if command -v pnpm >/dev/null 2>&1; then
    if [ ! -d "node_modules" ]; then
        print_warning "Installing npm packages with pnpm..."
        pnpm install 2>&1 | tail -5
    fi
    PACKAGE_RUNNER="pnpm run"
else
    print_error "pnpm not found"
    exit 1
fi

print_status "Frontend dependencies ready"
cd ..

# Create .env file if it doesn't exist
if [ ! -f "backend/.env" ] && [ -f "backend/.env.example" ]; then
    print_warning "Creating .env file from template..."
    cp backend/.env.example backend/.env
fi

# Kill any existing processes on our ports
echo ""
echo -e "${BLUE}Starting servers...${NC}"

# Kill existing processes on ports 8000 and 5173
if command -v lsof >/dev/null 2>&1; then
    if lsof -ti:8000 >/dev/null 2>&1; then
        print_warning "Killing process on port 8000..."
        kill $(lsof -ti:8000) 2>/dev/null || true
    fi

    if lsof -ti:5173 >/dev/null 2>&1; then
        print_warning "Killing process on port 5173..."
        kill $(lsof -ti:5173) 2>/dev/null || true
    fi
fi

# Start backend in background
echo ""
echo -e "${GREEN}Starting Backend Server...${NC}"

cd backend
export PYTHONPATH="$SCRIPT_DIR/backend:$PYTHONPATH"
nohup python3 -c "
import sys
sys.path.insert(0, '$SCRIPT_DIR/backend')
from app.main import app
import uvicorn
uvicorn.run(app, host='0.0.0.0', port=8000)
" > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 5

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    print_error "Backend failed to start. Check backend.log for errors."
    exit 1
fi
print_status "Backend server started on port 8000 (PID: $BACKEND_PID)"

# Start frontend in background
echo ""
echo -e "${GREEN}Starting Frontend Server...${NC}"
cd frontend
nohup $PACKAGE_RUNNER dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
sleep 8

# Check if frontend started successfully
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    print_error "Frontend failed to start. Check frontend.log for errors."
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi
print_status "Frontend server started on port 5173 (PID: $FRONTEND_PID)"

# Save PIDs to file for later cleanup
echo "$BACKEND_PID $FRONTEND_PID" > .esg_pids

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}  ESG Platform is running!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "  ${YELLOW}Frontend:${NC}  http://localhost:5173"
echo -e "  ${YELLOW}Backend:${NC}  http://localhost:8000"
echo -e "  ${YELLOW}API Docs:${NC} http://localhost:8000/docs"
echo ""
echo -e "  Press ${RED}Ctrl+C${NC} to stop all servers"
echo ""

# Open browser if on supported platform
if [ "$PLATFORM" = "linux" ] || [ "$PLATFORM" = "macos" ]; then
    if command -v xdg-open >/dev/null 2>&1; then
        print_status "Opening frontend in browser..."
        xdg-open http://localhost:5173 >/dev/null 2>&1 &
    elif command -v open >/dev/null 2>&1; then
        print_status "Opening frontend in browser..."
        open http://localhost:5173 >/dev/null 2>&1 &
    fi
fi

# Wait for user interrupt
trap "echo ''; echo -e '${YELLOW}Shutting down servers...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; rm -f .esg_pids; echo -e '${GREEN}Done!${NC}'; exit" INT

echo "Server PIDs saved to .esg_pids for manual cleanup if needed"
wait
