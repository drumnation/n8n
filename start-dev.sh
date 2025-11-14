#!/bin/bash

# Start n8n in development mode
echo "🚀 Starting n8n development server..."
pnpm dev &

# Wait for the server to start (backend on port 5678, frontend on port 8080)
echo "⏳ Waiting for servers to start..."
sleep 10

# Check if n8n is running (backend serves both API and frontend)
if curl -s http://localhost:5678 > /dev/null; then
    echo "✅ n8n server is running on http://localhost:5678"
    echo "   - Backend API: http://localhost:5678"
    echo "   - Frontend UI: http://localhost:5678"
else
    echo "❌ n8n server not responding on port 5678"
fi

# Open browser to n8n
echo "🌐 Opening n8n in browser..."
if command -v open &> /dev/null; then
    # macOS
    open http://localhost:5678
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open http://localhost:5678
elif command -v start &> /dev/null; then
    # Windows
    start http://localhost:5678
else
    echo "Please open http://localhost:5678 in your browser"
fi

# Keep the script running to show logs
wait