#!/bin/bash

# AI Town Unified Startup Script
# Starts all required services with a single command

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  AI Town Unified Startup${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Function to check if port is in use
check_port() {
    local port=$1
    if ss -tlnp 2>/dev/null | grep -q ":$port "; then
        return 0  # Port is in use
    fi
    return 1  # Port is free
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if node -e "require('http').get('$url', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));" 2>/dev/null; then
            print_status "$service_name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start within $max_attempts seconds"
    return 1
}

# Function to cleanup on exit
cleanup() {
    print_status "Shutting down services..."
    
    # Kill all background processes
    if [ -n "$API_PID" ]; then
        kill $API_PID 2>/dev/null || true
    fi
    
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    if [ -n "$CONVEX_PID" ]; then
        kill $CONVEX_PID 2>/dev/null || true
    fi
    
    # Kill any remaining processes on our ports
    pkill -f "server/server.js" 2>/dev/null || true
    pkill -f "python3.*http.server.*8080" 2>/dev/null || true
    
    print_status "All services stopped."
    exit 0
}

# Set up signal handlers for graceful shutdown
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    print_header
    
    # Check if required files exist
    if [ ! -f "server/server.js" ]; then
        print_error "server/server.js not found!"
        exit 1
    fi
    
    if [ ! -f "index.html" ]; then
        print_error "index.html not found!"
        exit 1
    fi
    
    # Check for port conflicts
    if check_port 3002; then
        print_warning "Port 3002 is already in use. Attempting to free it..."
        pkill -f "server/server.js" 2>/dev/null || true
        sleep 2
    fi
    
    if check_port 8080; then
        print_warning "Port 8080 is already in use. Attempting to free it..."
        pkill -f "python3.*http.server.*8080" 2>/dev/null || true
        sleep 2
    fi
    
    print_status "Starting AI Town services..."
    
    # Step 1: Initialize Convex (if needed)
    print_status "Initializing Convex backend..."
    npx convex dev --once --run init 2>/dev/null || {
        print_warning "Convex init failed or already initialized"
    }
    
    # Step 2: Start API Server
    print_status "Starting API Server on port 3002..."
    node server/server.js > logs/api.log 2>&1 &
    API_PID=$!
    
    # Step 3: Start Frontend
    print_status "Starting Frontend on port 8080..."
    mkdir -p logs
    python3 -m http.server 8080 > logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    # Step 4: Start Convex Backend (optional, for game engine)
    print_status "Starting Convex backend..."
    npx convex dev --tail-logs > logs/convex.log 2>&1 &
    CONVEX_PID=$!
    
    # Wait for services to be ready
    echo ""
    print_status "Checking service health..."
    
    if wait_for_service "http://localhost:3002/api/test" "API Server"; then
        print_status "✅ API Server is healthy"
    else
        print_error "❌ API Server failed to start"
        cleanup
        exit 1
    fi
    
    if wait_for_service "http://localhost:8080" "Frontend"; then
        print_status "✅ Frontend is healthy"
    else
        print_error "❌ Frontend failed to start"
        cleanup
        exit 1
    fi
    
    # Display success message
    echo ""
    print_header
    echo -e "${GREEN}🎉 AI Town is now running!${NC}"
    echo ""
    echo -e "${BLUE}📱 Application URL:${NC} http://localhost:8080"
    echo -e "${BLUE}🔗 API Server:${NC}    http://localhost:3002"
    echo -e "${BLUE}🗄️  Convex Dashboard:${NC} Run 'npx convex dashboard'"
    echo ""
    echo -e "${YELLOW}🔑 Login (if needed):${NC} user@example.com / password"
    echo ""
    echo -e "${GREEN}✨ Features Available:${NC}"
    echo "  • AI Council Dashboard (8 specialized council members)"
    echo "  • Real-time API integration"
    echo "  • System statistics and monitoring"
    echo "  • Personal data input capabilities"
    echo "  • Telegram integration dashboard"
    echo ""
    echo -e "${BLUE}📋 Service PIDs:${NC}"
    echo "  API Server: $API_PID"
    echo "  Frontend:   $FRONTEND_PID"
    echo "  Convex:     $CONVEX_PID"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
    echo ""
    
    # Keep script running and monitor services
    while true; do
        sleep 10
        
        # Check if services are still running
        if ! kill -0 $API_PID 2>/dev/null; then
            print_error "API Server died unexpectedly!"
            cleanup
            exit 1
        fi
        
        if ! kill -0 $FRONTEND_PID 2>/dev/null; then
            print_error "Frontend died unexpectedly!"
            cleanup
            exit 1
        fi
        
        if ! kill -0 $CONVEX_PID 2>/dev/null; then
            print_warning "Convex backend died unexpectedly (optional service)"
        fi
    done
}

# Create logs directory if it doesn't exist
mkdir -p logs

# Run main function
main "$@"