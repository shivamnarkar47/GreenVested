#!/bin/bash

# ESG Scoring Platform - Enhanced Startup Script
# Improved version with better process management and error handling

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  🌱 GreenVested ESG Platform${NC}"
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

print_info() {
    echo -e "${BLUE}[ℹ]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_step() {
    echo -e "${PURPLE}[→]${NC} $1"
}

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down servers...${NC}"
    if [ -f ".esg_pids" ]; then
        while read -r pid; do
            if kill -0 "$pid" 2>/dev/null; then
                kill "$pid" 2>/dev/null || true
            fi
        done < .esg_pids
        rm -f .esg_pids
    fi
    print_status "Cleanup complete"
}

# Set trap for cleanup
trap cleanup EXIT INT TERM

# Check prerequisites
print_step "Checking prerequisites..."

# Check Python
if ! command -v python3 >/dev/null 2>&1; then
    print_error "Python 3 not found. Please install Python 3.12+"
    echo "Visit: https://www.python.org/downloads/"
    exit 1
fi

PYTHON_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
if python3 -c "import sys; sys.exit(0 if sys.version_info >= (3, 12) else 1)" 2>/dev/null; then
    print_status "Python $PYTHON_VERSION found"
else
    print_warning "Python $PYTHON_VERSION found (recommended: 3.12+)"
fi

# Check Node.js
if ! command -v node >/dev/null 2>&1; then
    print_error "Node.js not found. Please install Node.js 18+"
    echo "Visit: https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node --version)
print_status "Node.js $NODE_VERSION found"

# Check pnpm
if ! command -v pnpm >/dev/null 2>&1; then
    print_error "pnpm not found. Please install pnpm"
    echo "Run: npm install -g pnpm"
    exit 1
fi
PNPM_VERSION=$(pnpm --version)
print_status "pnpm $PNPM_VERSION found"

# Get script directory and navigate
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Backend setup
echo ""
print_step "Setting up backend environment..."

# Create virtual environment if needed
BACKEND_VENV="$SCRIPT_DIR/backend/venv"
if [ ! -f "$BACKEND_VENV/bin/activate" ]; then
    print_info "Creating Python virtual environment..."
    cd backend
    python3 -m venv venv
    cd ..
fi

# Activate venv and check/install dependencies
print_info "Activating virtual environment..."
source "$BACKEND_VENV/bin/activate"

# Upgrade pip
pip install --quiet --upgrade pip

# Install/update backend dependencies
if [ ! -f "$BACKEND_VENV/dependencies_installed" ] || [ backend/pyproject.toml -nt "$BACKEND_VENV/dependencies_installed" ]; then
    print_info "Installing Python dependencies..."
    cd backend
    pip install --quiet -e .
    cd ..
    touch "$BACKEND_VENV/dependencies_installed"
fi
print_status "Backend dependencies ready"

# Check for .env file
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        print_warning "Creating .env file from template..."
        cp backend/.env.example backend/.env
        print_info "Please edit backend/.env with your configuration"
    else
        print_error "No .env or .env.example found in backend/"
        exit 1
    fi
fi

# Frontend setup
echo ""
print_step "Setting up frontend environment..."

cd frontend

# Check if node_modules exists and is up to date
if [ ! -f "node_modules/.package-lock" ] || [ package.json -nt "node_modules/.package-lock" ]; then
    print_info "Installing Node.js dependencies..."
    pnpm install --silent
fi

print_status "Frontend dependencies ready"

# Return to root
cd ..

# Kill existing processes
print_step "Cleaning up existing processes..."

# Function to kill process on port
kill_port() {
    local port=$1
    if command -v lsof >/dev/null 2>&1; then
        local pids=$(lsof -ti:$port 2>/dev/null || true)
        if [ -n "$pids" ]; then
            print_warning "Killing processes on port $port..."
            echo "$pids" | xargs kill -9 2>/dev/null || true
            sleep 2
        fi
    fi
}

kill_port 8000
kill_port 5173
kill_port 5174

# Start backend
echo ""
print_step "Starting backend server..."

cd backend
export PYTHONPATH="$SCRIPT_DIR/backend:$PYTHONPATH"

# Use uvicorn directly for better control
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --log-level info > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to initialize
print_info "Waiting for backend to initialize..."
sleep 3

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    print_error "Backend failed to start"
    echo "Check backend.log for details:"
    tail -20 ../backend.log
    exit 1
fi

# Test backend health
if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    print_status "Backend server running on http://localhost:8000"
else
    print_warning "Backend started but health check failed"
fi

# Start frontend
echo ""
print_step "Starting frontend server..."

cd frontend
pnpm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to initialize
print_info "Waiting for frontend to initialize..."
sleep 5

# Check if frontend is running
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    print_error "Frontend failed to start"
    echo "Check frontend.log for details:"
    tail -20 ../frontend.log
    exit 1
fi

print_status "Frontend server running"

# Save PIDs
echo "$BACKEND_PID" > .esg_pids
echo "$FRONTEND_PID" >> .esg_pids

# Determine frontend port (could be 5173 or 5174)
FRONTEND_PORT=""
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    FRONTEND_PORT=5173
elif curl -s http://localhost:5174 > /dev/null 2>&1; then
    FRONTEND_PORT=5174
fi

# Success message
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           🌱 GreenVested is Live!            ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
if [ -n "$FRONTEND_PORT" ]; then
    echo -e "  ${CYAN}🌐 Frontend:${NC}  http://localhost:$FRONTEND_PORT"
else
    echo -e "  ${YELLOW}🌐 Frontend:${NC}  Starting... (check http://localhost:5173 or 5174)"
fi
echo -e "  ${CYAN}🔧 Backend:${NC}   http://localhost:8000"
echo -e "  ${CYAN}📚 API Docs:${NC}  http://localhost:8000/docs"
echo ""
echo -e "  ${YELLOW}📝 Logs:${NC}"
echo -e "    Backend:  tail -f backend.log"
echo -e "    Frontend: tail -f frontend.log"
echo ""
echo -e "  ${RED}🛑 Stop:${NC} Press Ctrl+C"
echo ""

# Open browser
if [ "$PLATFORM" = "linux" ] || [ "$PLATFORM" = "macos" ]; then
    if [ -n "$FRONTEND_PORT" ]; then
        if command -v xdg-open >/dev/null 2>&1; then
            print_info "Opening browser..."
            xdg-open "http://localhost:$FRONTEND_PORT" >/dev/null 2>&1 &
        elif command -v open >/dev/null 2>&1; then
            print_info "Opening browser..."
            open "http://localhost:$FRONTEND_PORT" >/dev/null 2>&1 &
        fi
    fi
fi

# Wait for user interrupt
print_info "Press Ctrl+C to stop servers"
wait