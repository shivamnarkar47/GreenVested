#!/bin/bash

# ESG Scoring Platform - Installation Script
# Installs all dependencies

set -e

echo "ESG Platform - Installation"
echo "==========================="

# Check prerequisites
if ! command -v python3 >/dev/null 2>&1; then
    echo "Error: Python 3 not found"
    exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
    echo "Error: pnpm not found. Install pnpm first: npm install -g pnpm"
    exit 1
fi

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Backend setup
echo ""
echo "Setting up backend..."

BACKEND_VENV="$SCRIPT_DIR/backend/venv"

# Create virtual environment if it doesn't exist or is incomplete
if [ ! -f "$BACKEND_VENV/bin/activate" ]; then
    echo "Creating Python virtual environment..."
    rm -rf "$BACKEND_VENV" 2>/dev/null || true
    cd backend
    python3 -m venv venv
    cd ..
fi

# Activate and install dependencies
echo "Installing Python dependencies..."
source "$BACKEND_VENV/bin/activate"
pip install --quiet -r backend/requirements.txt

# Create database tables
echo "Initializing database..."
export PYTHONPATH="$SCRIPT_DIR/backend:$PYTHONPATH"
cd backend
python3 -c "
from database import sync_engine, Base
from models import User, Company, ESGScore, Portfolio, PortfolioItem
Base.metadata.create_all(bind=sync_engine, checkfirst=True)
" 2>/dev/null || true
cd ..

# Frontend setup
echo ""
echo "Setting up frontend..."
cd frontend

# Use pnpm
if command -v pnpm >/dev/null 2>&1; then
    if [ ! -d "node_modules" ]; then
        echo "Installing npm dependencies with pnpm..."
        pnpm install
    fi
    PACKAGE_RUNNER="pnpm run"
else
    echo "Error: pnpm not found"
    exit 1
fi

cd ..

echo ""
echo "==========================="
echo "Installation complete!"
echo ""
echo "Run './run.sh' to start the platform"
