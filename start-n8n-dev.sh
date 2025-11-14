#!/bin/bash

# Start n8n in development mode with AI support
# Usage: ./start-n8n-dev.sh

set -e

echo "🚀 Starting n8n in development mode with AI support..."
echo ""

# Check if API key is set
if [ -z "$N8N_AI_ANTHROPIC_KEY" ]; then
  echo "⚠️  Warning: N8N_AI_ANTHROPIC_KEY not set!"
  echo "AI features will not be available."
  echo ""
  echo "To enable AI features, run:"
  echo "export N8N_AI_ANTHROPIC_KEY='your-key-here'"
  echo ""
fi

# Display configuration
echo "📋 Configuration:"
echo "  - Node.js: $(node --version)"
echo "  - pnpm: $(pnpm --version)"
echo "  - AI Key: ${N8N_AI_ANTHROPIC_KEY:+SET} ${N8N_AI_ANTHROPIC_KEY:-NOT SET}"
echo ""

# Set required environment variables
export N8N_PORT=5678
export N8N_HOST=localhost
export N8N_PROTOCOL=http

echo "🔧 Starting n8n development server..."
echo "📍 Access n8n at: http://localhost:5678"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start n8n in dev mode
COREPACK_ENABLE_AUTO_PIN=0 pnpm dev
