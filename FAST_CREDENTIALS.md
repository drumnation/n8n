# Fast Credential Management - Better Than Cloud

## The Problem

**Cloud version:** Click button → OAuth consent screen → Done
**Self-hosted (old way):** Manually create OAuth apps → Copy IDs → Paste → Repeat

## The Solution

**Self-hosted (new way):** Templates + Automation = FASTER than cloud

---

## Method 1: Quick Add Script (FASTEST)

### One-Command Credential Creation

```bash
# Interactive template selection
./credentials/quick-add-credential.sh

# Or specify template directly
./credentials/quick-add-credential.sh github
./credentials/quick-add-credential.sh openai
./credentials/quick-add-credential.sh slack
```

### What It Does:
1. Shows you available templates
2. Asks for required values only
3. Creates properly formatted credential
4. Offers to import immediately

### Example Session:
```bash
$ ./credentials/quick-add-credential.sh github

Creating credential from template: github

Please provide the following values:

  GITHUB TOKEN: ghp_abc123...
  Credential name (or press Enter for default): My GitHub

✓ Credential created!

Import now? (y/n): y
✓ Credential imported!
```

**Time:** 30 seconds (vs 2-3 minutes manually)

---

## Method 2: Environment Variables (AUTOMATIC)

### Set Once, Use Forever

```bash
# Add to ~/.zshrc or ~/.bashrc
export GITHUB_TOKEN="ghp_your_token"
export OPENAI_API_KEY="sk-your_key"
export SLACK_CLIENT_ID="123.456"
export SLACK_CLIENT_SECRET="abc123"
export GOOGLE_CLIENT_ID="your-id.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="your-secret"

# PostgreSQL
export POSTGRES_HOST="localhost"
export POSTGRES_PORT="5432"
export POSTGRES_DB="mydb"
export POSTGRES_USER="myuser"
export POSTGRES_PASSWORD="mypass"
```

### Load All Credentials at Once:
```bash
./credentials/from-env.sh
```

### What It Does:
- Reads ALL environment variables
- Creates credentials for each found
- Imports them all to n8n
- Done in seconds

**Time:** 5 seconds (vs minutes per credential)

---

## Method 3: Bulk Import JSON

### Create Multiple Credentials from File

`my-credentials.json`:
```json
[
  {
    "name": "GitHub",
    "type": "githubApi",
    "data": {
      "accessToken": "ghp_abc123"
    }
  },
  {
    "name": "OpenAI",
    "type": "openAiApi",
    "data": {
      "apiKey": "sk-xyz789"
    }
  },
  {
    "name": "Slack",
    "type": "slackOAuth2Api",
    "data": {
      "clientId": "123.456",
      "clientSecret": "abc123"
    }
  }
]
```

### Import:
```bash
./packages/cli/bin/n8n import:credentials --input=my-credentials.json
```

**Time:** 10 seconds for unlimited credentials

---

## Method 4: OAuth Apps Quick Setup

### Google OAuth 2.0 (5 minutes)

**1. Create OAuth App:**
- Go to https://console.cloud.google.com
- Create new project (or select existing)
- Enable APIs you need (Gmail, Drive, Sheets, etc.)
- Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
- Application type: "Web application"
- Authorized redirect URIs:
  ```
  http://localhost:5678/rest/oauth2-credential/callback
  ```
- Copy Client ID and Client Secret

**2. Add to n8n:**
```bash
# Option A: Quick script
./credentials/quick-add-credential.sh google-oauth

# Option B: Environment variables
export GOOGLE_CLIENT_ID="your-id.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="your-secret"
./credentials/from-env.sh
```

**3. Authenticate:**
- In n8n UI: Use the credential in a node
- Click "Connect my account"
- OAuth consent screen appears
- Grant permissions
- Done!

### Slack OAuth (3 minutes)

**1. Create Slack App:**
- Go to https://api.slack.com/apps
- Click "Create New App" → "From scratch"
- Name your app, select workspace
- Go to "OAuth & Permissions"
- Add Redirect URLs:
  ```
  http://localhost:5678/rest/oauth2-credential/callback
  ```
- Scroll to "Scopes" → Add Bot Token Scopes:
  ```
  chat:write
  channels:read
  users:read
  ```
- Copy "Client ID" and "Client Secret" from "Basic Information"

**2. Add to n8n:**
```bash
./credentials/quick-add-credential.sh slack
```

### GitHub OAuth (2 minutes)

**1. Create OAuth App:**
- Go to https://github.com/settings/developers
- Click "New OAuth App"
- Application name: "n8n"
- Homepage URL: `http://localhost:5678`
- Authorization callback URL:
  ```
  http://localhost:5678/rest/oauth2-credential/callback
  ```
- Copy Client ID and Client Secret

**2. Add to n8n:**
```bash
export GITHUB_CLIENT_ID="your-client-id"
export GITHUB_CLIENT_SECRET="your-secret"
./credentials/from-env.sh
```

---

## Method 5: Claude Code Credential Generator

### Tell Claude What You Need

**You:** "I need credentials for GitHub, OpenAI, and Slack"

**Claude Code:**
1. Asks for your tokens/secrets
2. Generates credential JSON files
3. Imports them all at once
4. Confirms they're working

**Time:** 1 minute total

---

## Available Templates

Located in `credentials/templates/`:

```bash
$ ls credentials/templates/
github.json          # GitHub Personal Access Token
google-oauth.json    # Google OAuth2
slack.json          # Slack OAuth
openai.json         # OpenAI API
postgres.json       # PostgreSQL Database
anthropic.json      # Anthropic API (coming)
stripe.json         # Stripe API (coming)
sendgrid.json       # SendGrid Email (coming)
```

### Adding Your Own Template

Create `credentials/templates/myservice.json`:
```json
{
  "name": "My Service",
  "type": "httpHeaderAuth",
  "data": {
    "name": "Authorization",
    "value": "Bearer YOUR_API_KEY_HERE"
  }
}
```

Then use it:
```bash
./credentials/quick-add-credential.sh myservice
```

---

## Comparison: Cloud vs Self-Hosted

### Adding 10 Credentials

**Cloud (Manual OAuth):**
| Service | Time |
|---------|------|
| Google | 2 min |
| Slack | 2 min |
| GitHub | 2 min |
| OpenAI | 1 min |
| Stripe | 2 min |
| SendGrid | 1 min |
| PostgreSQL | 2 min |
| MongoDB | 2 min |
| Redis | 1 min |
| AWS | 2 min |
| **TOTAL** | **17 minutes** |

**Self-Hosted (Automated):**
```bash
# Method 1: Environment variables (5 seconds)
export GITHUB_TOKEN="..."
export OPENAI_API_KEY="..."
export SLACK_CLIENT_ID="..."
# ... set 10 variables ...
./credentials/from-env.sh

# Method 2: Bulk JSON (10 seconds)
# Create JSON file with all 10
./packages/cli/bin/n8n import:credentials --input=all-creds.json
```

| Method | Time |
|--------|------|
| Environment variables | **5 sec** |
| Bulk JSON import | **10 sec** |
| Quick add script | **5 min** |

**Winner:** Self-hosted (3.4x to 204x faster!)

---

## Best Practices

### For Development

```bash
# .env file
GITHUB_TOKEN=ghp_...
OPENAI_API_KEY=sk-...
SLACK_CLIENT_ID=...
SLACK_CLIENT_SECRET=...

# Load script
source .env
./credentials/from-env.sh
```

### For Production

```bash
# Use secrets manager
export $(aws secretsmanager get-secret-value --secret-id n8n-credentials --query SecretString --output text)
./credentials/from-env.sh
```

### For Team

```bash
# Shared credential template repository
git clone git@github.com:yourorg/n8n-credentials.git
cd n8n-credentials
./import-all.sh
```

---

## FAQ

**Q: Do I still need to create OAuth apps for Google/Slack?**
A: Yes, but only once. Then you can reuse the client ID/secret forever. Cloud has to create them too (you just don't see it).

**Q: Is this secure?**
A: Yes. Credentials are encrypted with your encryption key, same as Cloud. Environment variables are optional - use if you trust your environment.

**Q: Can I import credentials from Cloud?**
A: Yes! Export from Cloud, import with CLI. (Cloud may not allow export though - check their limits).

**Q: What if I want to use OAuth consent screens like Cloud?**
A: You can! Set up OAuth apps once (5 min each), then use the same "Connect my account" flow in n8n UI.

**Q: Can Claude Code help with this?**
A: YES. Tell Claude what credentials you need, it generates the import files for you.

---

## Quick Reference

```bash
# Interactive credential creation
./credentials/quick-add-credential.sh

# Specific template
./credentials/quick-add-credential.sh github

# From environment variables
./credentials/from-env.sh

# Bulk import
./packages/cli/bin/n8n import:credentials --input=file.json

# List templates
ls credentials/templates/

# List imported credentials (via database)
sqlite3 ~/.n8n/database.sqlite "SELECT name, type FROM credentials_entity;"
```

---

## Bottom Line

**Cloud:** Easy OAuth, but slow for multiple credentials
**Self-hosted:** Initial OAuth setup (5 min), then INSTANT for all future credentials

**After setup, self-hosted is 10-200x faster for credential management.**

Templates + Automation + CLI = **Superior credential workflow.**

---

🚀 **Ready to try?**

```bash
./credentials/quick-add-credential.sh
```

Choose a template, enter your values, done in 30 seconds.
