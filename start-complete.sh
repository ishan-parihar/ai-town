#!/bin/bash

# AI Town Startup - Working Version with Simple Backend
# This script starts the frontend and backend for AI Town

echo "🚀 Starting AI Town (Working Version)..."

# Kill any existing processes
pkill -f "tsx.*simple-server" 2>/dev/null || true
pkill -f "vite.*5177" 2>/dev/null || true

# Wait for processes to fully stop
sleep 2

# Start Backend Server (Simple Express server)
echo "🧠 Starting Backend Server (Express API)..."
npx tsx simple-server.ts &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start Frontend with Vite
echo "🎨 Starting Frontend..."
npm run dev:vite &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

# Test API endpoints
echo "🔍 Testing API endpoints..."
if node test-endpoints.cjs; then
    echo "✅ Backend API is working"
else
    echo "⚠️  Backend API may have issues"
fi

echo ""
echo "✅ AI Town is running!"
echo "📱 Frontend: http://localhost:5177"
echo "🔗 API: http://localhost:3001"
echo "📊 Health: http://localhost:3001/health"
echo ""
echo "🎯 What you should see:"
echo "   • AI Town game interface"
echo "   • Map with characters"
echo "   • Interactive elements"
echo ""
echo "🛠️  Debugging:"
echo "   • Check browser console for errors"
echo "   • Network tab for API calls"
echo "   • Backend logs: tail -f backend.log"
echo ""
echo "Press Ctrl+C to stop all services"

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    pkill -f "tsx.*simple-server" 2>/dev/null || true
    pkill -f "vite.*5177" 2>/dev/null || true
    echo "✅ All services stopped"
    exit
}

# Set up signal handlers
trap cleanup INT TERM

# Wait for services
wait