#!/bin/bash

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  HVAC Duct Annotation System${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check for required system dependencies
echo -e "${YELLOW}Checking system dependencies...${NC}"

if ! command -v tesseract &> /dev/null; then
    echo -e "${RED}Error: tesseract is not installed${NC}"
    echo "Run: brew install tesseract"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Download from: https://nodejs.org"
    exit 1
fi

echo -e "${GREEN}System dependencies: OK${NC}"
echo ""

# Setup backend
echo -e "${YELLOW}Setting up backend...${NC}"
cd backend

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
echo "Installing backend dependencies..."
pip install -q -r requirements.txt
echo -e "${GREEN}Backend setup complete${NC}"

cd ..
echo ""

# Setup frontend
echo -e "${YELLOW}Setting up frontend...${NC}"
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install --quiet
else
    echo "npm dependencies already installed"
fi

echo -e "${GREEN}Frontend setup complete${NC}"

cd ..
echo ""

# Create function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down services...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    wait $BACKEND_PID 2>/dev/null || true
    wait $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}Services stopped${NC}"
}

trap cleanup EXIT INT TERM

# Start backend
echo -e "${YELLOW}Starting backend...${NC}"
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 > /tmp/hvac_backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 2
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}Backend failed to start${NC}"
    echo "Check logs: cat /tmp/hvac_backend.log"
    exit 1
fi
echo -e "${GREEN}Backend started (PID: $BACKEND_PID)${NC}"

# Start frontend
echo -e "${YELLOW}Starting frontend...${NC}"
cd frontend
npm run dev > /tmp/hvac_frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
sleep 3
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${RED}Frontend failed to start${NC}"
    echo "Check logs: cat /tmp/hvac_frontend.log"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi
echo -e "${GREEN}Frontend started (PID: $FRONTEND_PID)${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  All services running!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Backend API:  ${BLUE}http://localhost:8000${NC}"
echo -e "Frontend:     ${BLUE}http://localhost:3000${NC}"
echo ""
echo -e "View logs:"
echo -e "  Backend:  ${YELLOW}tail -f /tmp/hvac_backend.log${NC}"
echo -e "  Frontend: ${YELLOW}tail -f /tmp/hvac_frontend.log${NC}"
echo ""
echo -e "Press ${YELLOW}Ctrl+C${NC} to stop all services"
echo ""

# Open browser
sleep 1
if command -v open &> /dev/null; then
    open http://localhost:3000
fi

# Wait for both processes
wait
