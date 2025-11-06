#!/bin/bash

# AI Town Startup - Complete Version with Convex Backend
# This script starts ALL required services for the AI Council

echo "🚀 Starting AI Council LifeOS (Complete)..."

# Kill any existing processes
pkill -f "server/server.js" 2>/dev/null || true
pkill -f "vite.*5176" 2>/dev/null || true
pkill -f "convex dev" 2>/dev/null || true

# Wait for processes to fully stop
sleep 2

echo "📦 Initializing Convex backend..."
# Initialize Convex with agent creation
npm run predev &
CONVEX_PID=$!

# Wait for Convex to initialize
echo "⏳ Waiting for Convex to initialize (15 seconds)..."
sleep 15

# Start Convex backend (this runs the game engine and agents)
echo "🧠 Starting Convex backend (Game Engine + AI Agents)..."
npm run dev:backend &
BACKEND_PID=$!

# Wait for backend to start
sleep 10

# Start API Server
echo "🔗 Starting API Server..."
node server/server.js &
API_PID=$!

# Start Frontend with Vite
echo "🎨 Starting Frontend..."
npm run dev:vite &
FRONTEND_PID=$!

# Wait for all services to be ready
sleep 5

echo ""
echo "✅ AI Council LifeOS is fully running!"
echo "📱 Frontend: http://localhost:5176 or http://localhost:5177 (check Vite output for correct port)"
echo "🔗 API: http://localhost:3002"
echo "🧠 Convex Dashboard: http://localhost:6789" 
echo "🤖 AI Agents: Running in Convex backend"
echo ""
echo "🎯 What you should see:"
echo "   • 8 Council members (Aria, Marcus, Dr. Lena, Sophia, David, Ruby, Max, Nova)"
echo "   • Map backdrop with tiled textures"
echo "   • Animated elements (windmill, fire, waterfall)"
echo "   • Interactive chat with AI council"
echo ""
echo "🛠️  Debugging:"
echo "   • Check browser console for asset loading logs"
echo "   • Visit http://localhost:6789 for Convex dashboard"
echo "   • Check server logs for agent creation"
echo ""
echo "Press Ctrl+C to stop all services"

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $CONVEX_PID $BACKEND_PID $API_PID $FRONTEND_PID 2>/dev/null || true
    pkill -f "convex dev" 2>/dev/null || true
    pkill -f "server/server.js" 2>/dev/null || true
    pkill -f "vite.*5176" 2>/dev/null || true
    echo "✅ All services stopped"
    exit
}

# Set up signal handlers
trap cleanup INT TERM

# Wait for services
wait