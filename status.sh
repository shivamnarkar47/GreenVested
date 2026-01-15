#!/bin/bash

# ESG Scoring Platform - Status Script
# Checks the status of running servers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  ESG Platform - Status Check${NC}"
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

# Check if PID file exists
if [ -f ".esg_pids" ]; then
    print_info "Found PID file (.esg_pids)"
    echo "Running processes:"
    while read -r pid; do
        if [ -n "$pid" ]; then
            if kill -0 "$pid" 2>/dev/null; then
                process_name=$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")
                echo -e "  ${GREEN}PID $pid${NC}: $process_name"
            else
                echo -e "  ${RED}PID $pid${NC}: not running"
            fi
        fi
    done < .esg_pids
    echo ""
else
    print_warning "No PID file found (.esg_pids)"
fi

# Check ports
echo "Checking service ports:"

# Backend (8000)
if curl -s --max-time 2 http://localhost:8000/api/health > /dev/null 2>&1; then
    print_status "Backend: http://localhost:8000 (healthy)"
else
    print_error "Backend: http://localhost:8000 (not responding)"
fi

# Frontend (try multiple ports)
frontend_found=false
for port in 5173 5174; do
    if curl -s --max-time 2 "http://localhost:$port" > /dev/null 2>&1; then
        print_status "Frontend: http://localhost:$port (responding)"
        frontend_found=true
        break
    fi
done

if [ "$frontend_found" = false ]; then
    print_error "Frontend: not found on ports 5173 or 5174"
fi

# Check for any related processes
echo ""
print_info "Checking for related processes:"

backend_processes=$(pgrep -f "uvicorn.*app.main:app" 2>/dev/null || true)
if [ -n "$backend_processes" ]; then
    print_status "Backend processes found: $backend_processes"
else
    print_warning "No backend processes found"
fi

frontend_processes=$(pgrep -f "pnpm run dev\|vite" 2>/dev/null || true)
if [ -n "$frontend_processes" ]; then
    print_status "Frontend processes found: $frontend_processes"
else
    print_warning "No frontend processes found"
fi

# Check log files
echo ""
print_info "Log files:"
if [ -f "backend.log" ]; then
    backend_log_size=$(stat -f%z backend.log 2>/dev/null || stat -c%s backend.log 2>/dev/null || echo "unknown")
    echo -e "  Backend log: ${GREEN}backend.log${NC} (${backend_log_size} bytes)"
else
    echo -e "  Backend log: ${YELLOW}backend.log${NC} (not found)"
fi

if [ -f "frontend.log" ]; then
    frontend_log_size=$(stat -f%z frontend.log 2>/dev/null || stat -c%s frontend.log 2>/dev/null || echo "unknown")
    echo -e "  Frontend log: ${GREEN}frontend.log${NC} (${frontend_log_size} bytes)"
else
    echo -e "  Frontend log: ${YELLOW}frontend.log${NC} (not found)"
fi

echo ""
if [ -f ".esg_pids" ] && kill -0 $(head -1 .esg_pids 2>/dev/null) 2>/dev/null; then
    echo -e "${GREEN}Status: Servers appear to be running${NC}"
else
    echo -e "${YELLOW}Status: No running servers detected${NC}"
fi

echo ""
echo -e "Commands:"
echo -e "  Start:  ${BLUE}./run.sh${NC}"
echo -e "  Stop:   ${BLUE}./stop.sh${NC}"
echo -e "  Status: ${BLUE}./status.sh${NC}"