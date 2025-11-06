#!/bin/bash
echo "Starting AI Town Services..."

# Start API server
echo "Starting API server on port 3002..."
node server/server.js &
API_PID=$!
echo "API PID: $API_PID"

# Wait for API to start
sleep 2

# Start frontend
echo "Starting frontend on port 8080..."
python3 -m http.server 8080 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "Services started!"
echo "API: http://localhost:3002"
echo "Frontend: http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap 'echo "Stopping services..."; kill $API_PID $FRONTEND_PID 2>/dev/null; exit' INT
wait
