#!/bin/bash

# Start both servers and keep them running
echo "Starting AI Town development servers..."

# Start backend server
echo "Starting backend server on port 3001..."
npx tsx simple-server.ts &
BACKEND_PID=$!

# Wait for backend to start
sleep 2

# Start frontend server
echo "Starting frontend server on port 5177..."
npm run dev:vite &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 3

# Check if servers are running
echo "Checking server status..."
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "✅ Backend server is running (PID: $BACKEND_PID)"
else
    echo "❌ Backend server failed to start"
fi

if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "✅ Frontend server is running (PID: $FRONTEND_PID)"
else
    echo "❌ Frontend server failed to start"
fi

# Test backend endpoints
echo "Testing backend endpoints..."
node test-endpoints.cjs

echo ""
echo "Servers are running:"
echo "  Frontend: http://localhost:5177"
echo "  Backend: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for interrupt signal
trap 'echo "Stopping servers..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT

# Keep script running
while true; do
    sleep 1
done