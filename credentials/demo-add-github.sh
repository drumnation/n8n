#!/bin/bash

echo "🎯 DEMO: Adding GitHub Credential"
echo "=================================="
echo ""
echo "Step 1: Using quick-add script with mock token"
echo ""

# Simulate what happens when you run the quick add script
TEMPLATE="github"
GITHUB_TOKEN="ghp_demo_token_replace_with_real"
CRED_NAME="GitHub Demo"

echo "Template selected: $TEMPLATE"
echo "Token provided: ${GITHUB_TOKEN:0:10}..."
echo "Credential name: $CRED_NAME"
echo ""

# Show the template
echo "📄 Template content:"
cat credentials/templates/github.json | jq '.'
echo ""

# Generate the credential file
CRED_FILE="credentials/generated/github-demo.json"
mkdir -p credentials/generated

cat > "$CRED_FILE" << CREDEOF
{
  "name": "$CRED_NAME",
  "type": "githubApi",
  "data": {
    "accessToken": "$GITHUB_TOKEN"
  }
}
CREDEOF

echo "✅ Generated credential file:"
cat "$CRED_FILE" | jq '.'
echo ""

echo "📦 To import to n8n:"
echo "  ./packages/cli/bin/n8n import:credentials --input=$CRED_FILE"
echo ""
echo "⚡ Or use environment variable method:"
echo "  export GITHUB_TOKEN='$GITHUB_TOKEN'"
echo "  ./credentials/from-env.sh"
echo ""
echo "✨ That's it! 30 seconds vs 2-3 minutes manually."
