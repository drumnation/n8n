#!/bin/bash

# Load credentials from environment variables
# Makes credential management AUTOMATIC

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMPORTS_DIR="$SCRIPT_DIR/imports"

echo "🔐 Loading credentials from environment variables..."
echo ""

# GitHub
if [ -n "$GITHUB_TOKEN" ]; then
    cat > "$IMPORTS_DIR/github-auto.json" << EOF
{
  "id": "$(uuidgen | tr '[:upper:]' '[:lower:]')",
  "name": "GitHub (Auto-loaded)",
  "type": "githubApi",
  "data": {
    "accessToken": "$GITHUB_TOKEN"
  }
}
EOF
    echo "✓ GitHub credential created"
fi

# OpenAI
if [ -n "$OPENAI_API_KEY" ]; then
    cat > "$IMPORTS_DIR/openai-auto.json" << EOF
{
  "id": "$(uuidgen | tr '[:upper:]' '[:lower:]')",
  "name": "OpenAI (Auto-loaded)",
  "type": "openAiApi",
  "data": {
    "apiKey": "$OPENAI_API_KEY"
  }
}
EOF
    echo "✓ OpenAI credential created"
fi

# Anthropic
if [ -n "$ANTHROPIC_API_KEY" ]; then
    cat > "$IMPORTS_DIR/anthropic-auto.json" << EOF
{
  "id": "$(uuidgen | tr '[:upper:]' '[:lower:]')",
  "name": "Anthropic (Auto-loaded)",
  "type": "httpHeaderAuth",
  "data": {
    "name": "x-api-key",
    "value": "$ANTHROPIC_API_KEY"
  }
}
EOF
    echo "✓ Anthropic credential created"
fi

# Slack
if [ -n "$SLACK_CLIENT_ID" ] && [ -n "$SLACK_CLIENT_SECRET" ]; then
    cat > "$IMPORTS_DIR/slack-auto.json" << EOF
{
  "id": "$(uuidgen | tr '[:upper:]' '[:lower:]')",
  "name": "Slack (Auto-loaded)",
  "type": "slackOAuth2Api",
  "data": {
    "clientId": "$SLACK_CLIENT_ID",
    "clientSecret": "$SLACK_CLIENT_SECRET"
  }
}
EOF
    echo "✓ Slack credential created"
fi

# Google OAuth
if [ -n "$GOOGLE_CLIENT_ID" ] && [ -n "$GOOGLE_CLIENT_SECRET" ]; then
    cat > "$IMPORTS_DIR/google-auto.json" << EOF
{
  "id": "$(uuidgen | tr '[:upper:]' '[:lower:]')",
  "name": "Google OAuth (Auto-loaded)",
  "type": "googleOAuth2Api",
  "data": {
    "clientId": "$GOOGLE_CLIENT_ID",
    "clientSecret": "$GOOGLE_CLIENT_SECRET"
  }
}
EOF
    echo "✓ Google OAuth credential created"
fi

# PostgreSQL
if [ -n "$POSTGRES_HOST" ]; then
    cat > "$IMPORTS_DIR/postgres-auto.json" << EOF
{
  "id": "$(uuidgen | tr '[:upper:]' '[:lower:]')",
  "name": "PostgreSQL (Auto-loaded)",
  "type": "postgres",
  "data": {
    "host": "${POSTGRES_HOST:-localhost}",
    "port": ${POSTGRES_PORT:-5432},
    "database": "${POSTGRES_DB:-postgres}",
    "user": "${POSTGRES_USER:-postgres}",
    "password": "${POSTGRES_PASSWORD:-}",
    "ssl": "${POSTGRES_SSL:-disable}"
  }
}
EOF
    echo "✓ PostgreSQL credential created"
fi

echo ""
echo "📥 Importing credentials to n8n..."
echo ""

cd "$(dirname "$SCRIPT_DIR")"

# Import all generated credentials
for cred_file in "$IMPORTS_DIR"/*-auto.json; do
    if [ -f "$cred_file" ]; then
        echo "Importing $(basename "$cred_file")..."
        ./packages/cli/bin/n8n import:credentials --input="$cred_file" 2>&1 | grep -v "error TS" || true
    fi
done

echo ""
echo "✅ All credentials imported!"
echo ""
echo "To add more, set environment variables:"
echo "  export GITHUB_TOKEN=your-token"
echo "  export OPENAI_API_KEY=sk-..."
echo "  export SLACK_CLIENT_ID=..."
echo "  export SLACK_CLIENT_SECRET=..."
echo "  ./credentials/from-env.sh"
