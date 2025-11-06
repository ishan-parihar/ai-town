#!/bin/bash

# Quick AI Town Startup - Simple Version
# For quick development without all the checks

echo "🚀 Starting AI Town (Simple Mode)..."

# Kill any existing processes
pkill -f "server/server.js" 2>/dev/null || true
pkill -f "vite.*5176" 2>/dev/null || true

# Start API Server
echo "Starting API Server..."
node server/server.js &
API_PID=$!

# Start Frontend with Vite
echo "Starting Frontend..."
npm run dev:vite &
FRONTEND_PID=$!

# Wait for services to start
sleep 5

echo ""
echo "✅ AI Town is running!"
echo "📱 Frontend: http://localhost:5176"
echo "🔗 API: http://localhost:3002"
echo ""
echo "Press Ctrl+C to stop"

# Wait for interrupt
trap 'echo "Stopping..."; kill $API_PID $FRONTEND_PID 2>/dev/null; exit' INT
wait