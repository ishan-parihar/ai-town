#!/bin/bash

echo "🚀 Starting AI Town Development Environment"
echo "=========================================="

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to wait for server to start
wait_for_server() {
    local port=$1
    local name=$2
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if check_port $port; then
            echo "✅ $name is ready on port $port"
            return 0
        fi
        echo "⏳ Waiting for $name... (attempt $attempt/$max_attempts)"
        sleep 1
        attempt=$((attempt + 1))
    done
    
    echo "❌ $name failed to start on port $port"
    return 1
}

# Kill any existing processes on our ports
echo "🧹 Cleaning up existing processes..."
pkill -f "tsx.*simple-server" 2>/dev/null || true
pkill -f "vite.*5177" 2>/dev/null || true

# Start backend server
echo "🔧 Starting backend server on port 3001..."
npx tsx simple-server.ts > backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend
if wait_for_server 3001 "Backend"; then
    echo "✅ Backend server started successfully (PID: $BACKEND_PID)"
else
    echo "❌ Backend server failed to start"
    echo "Backend log:"
    cat backend.log
    exit 1
fi

# Start frontend server
echo "🎨 Starting frontend server on port 5177..."
npm run dev:vite > frontend-new.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend
if wait_for_server 5177 "Frontend"; then
    echo "✅ Frontend server started successfully (PID: $FRONTEND_PID)"
else
    echo "❌ Frontend server failed to start"
    echo "Frontend log:"
    cat frontend-new.log
    exit 1
fi

# Test API endpoints
echo "🔍 Testing API endpoints..."
sleep 2
if node test-endpoints.cjs; then
    echo "✅ All API endpoints are working"
else
    echo "⚠️  Some API endpoints may not be working"
fi

# Display URLs
echo ""
echo "🎉 Development environment is ready!"
echo "==================================="
echo "📱 Frontend:  http://localhost:5177"
echo "🔧 Backend:   http://localhost:3001"
echo "📊 Health:    http://localhost:3001/health"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend-new.log"
echo ""
echo "Press Ctrl+C to stop all servers"

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "✅ All servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup INT TERM

# Keep script running
while true; do
    sleep 1
done