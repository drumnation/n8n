#!/bin/bash

# 1Password CLI Integration for n8n Credentials
# Ultra-fast credential import from your 1Password vault

set -e

echo "🔐 1Password → n8n Credential Importer"
echo "======================================"
echo ""

# Check if 1Password CLI is installed
if ! command -v op &> /dev/null; then
    echo "❌ 1Password CLI not found"
    echo ""
    echo "Install with: brew install 1password-cli"
    echo "Then run: op signin"
    exit 1
fi

# Check if signed in
if ! op account list &> /dev/null; then
    echo "❌ Not signed in to 1Password"
    echo ""
    echo "Run: op signin"
    exit 1
fi

echo "✅ 1Password CLI ready"
echo ""

# Create credentials array
CREDENTIALS_JSON="["

# Try to extract common credentials
echo "Searching for credentials in 1Password..."
echo ""

# GitHub Token
if GITHUB_TOKEN=$(op item get "GitHub" --fields "personal access token" 2>/dev/null || op item get "GitHub Token" --fields password 2>/dev/null); then
    echo "✓ Found: GitHub"
    CREDENTIALS_JSON+='
  {
    "name": "GitHub (from 1Password)",
    "type": "githubApi",
    "data": {
      "accessToken": "'"$GITHUB_TOKEN"'"
    }
  },'
fi

# OpenAI API Key
if OPENAI_KEY=$(op item get "OpenAI" --fields "api key" 2>/dev/null || op item get "OpenAI API" --fields password 2>/dev/null); then
    echo "✓ Found: OpenAI"
    CREDENTIALS_JSON+='
  {
    "name": "OpenAI (from 1Password)",
    "type": "openAiApi",
    "data": {
      "apiKey": "'"$OPENAI_KEY"'"
    }
  },'
fi

# Slack OAuth
if SLACK_CLIENT_ID=$(op item get "Slack" --fields "client id" 2>/dev/null) && \
   SLACK_SECRET=$(op item get "Slack" --fields "client secret" 2>/dev/null || op item get "Slack" --fields password 2>/dev/null); then
    echo "✓ Found: Slack"
    CREDENTIALS_JSON+='
  {
    "name": "Slack (from 1Password)",
    "type": "slackOAuth2Api",
    "data": {
      "clientId": "'"$SLACK_CLIENT_ID"'",
      "clientSecret": "'"$SLACK_SECRET"'"
    }
  },'
fi

# Google OAuth
if GOOGLE_CLIENT_ID=$(op item get "Google OAuth" --fields "client id" 2>/dev/null) && \
   GOOGLE_SECRET=$(op item get "Google OAuth" --fields "client secret" 2>/dev/null || op item get "Google OAuth" --fields password 2>/dev/null); then
    echo "✓ Found: Google OAuth"
    CREDENTIALS_JSON+='
  {
    "name": "Google OAuth (from 1Password)",
    "type": "googleOAuth2Api",
    "data": {
      "clientId": "'"$GOOGLE_CLIENT_ID"'",
      "clientSecret": "'"$GOOGLE_SECRET"'"
    }
  },'
fi

# PostgreSQL
if PG_HOST=$(op item get "PostgreSQL" --fields host 2>/dev/null) && \
   PG_USER=$(op item get "PostgreSQL" --fields username 2>/dev/null) && \
   PG_PASS=$(op item get "PostgreSQL" --fields password 2>/dev/null); then
    PG_PORT=$(op item get "PostgreSQL" --fields port 2>/dev/null || echo "5432")
    PG_DB=$(op item get "PostgreSQL" --fields database 2>/dev/null || echo "postgres")
    echo "✓ Found: PostgreSQL"
    CREDENTIALS_JSON+='
  {
    "name": "PostgreSQL (from 1Password)",
    "type": "postgres",
    "data": {
      "host": "'"$PG_HOST"'",
      "port": '"$PG_PORT"',
      "database": "'"$PG_DB"'",
      "user": "'"$PG_USER"'",
      "password": "'"$PG_PASS"'"
    }
  },'
fi

# Remove trailing comma and close array
CREDENTIALS_JSON="${CREDENTIALS_JSON%,}"
CREDENTIALS_JSON+='
]'

# Check if any credentials were found
if [ "$CREDENTIALS_JSON" = "[
]" ]; then
    echo ""
    echo "❌ No credentials found in 1Password"
    echo ""
    echo "Make sure you have items named:"
    echo "  • GitHub (with 'personal access token' or 'password' field)"
    echo "  • OpenAI (with 'api key' or 'password' field)"
    echo "  • Slack (with 'client id' and 'client secret' fields)"
    echo "  • Google OAuth (with 'client id' and 'client secret' fields)"
    echo "  • PostgreSQL (with host, username, password fields)"
    exit 1
fi

# Save to file
mkdir -p credentials/generated
OUTPUT_FILE="credentials/generated/from-1password.json"
echo "$CREDENTIALS_JSON" > "$OUTPUT_FILE"

echo ""
echo "✅ Credentials exported to: $OUTPUT_FILE"
echo ""

# Offer to import
read -p "Import to n8n now? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    ./packages/cli/bin/n8n import:credentials --input="$OUTPUT_FILE"
    echo ""
    echo "✅ Credentials imported to n8n!"
else
    echo "Import later with:"
    echo "  ./packages/cli/bin/n8n import:credentials --input=$OUTPUT_FILE"
fi
