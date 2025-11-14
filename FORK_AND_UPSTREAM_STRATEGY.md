# n8n Fork & Upstream Synchronization Strategy

**Strategy Version:** 1.0
**Methodology:** BMAD Sustainable Fork Management
**Date:** 2025-11-06
**Target:** Maintain Custom n8n with Upstream Sync

---

## 🎯 Strategic Overview

### Goals
1. ✅ **Maintain custom features** (social login, Brain Garden integration)
2. ✅ **Stay synchronized with upstream** (security fixes, new features)
3. ✅ **Minimize merge conflicts** (modular code organization)
4. ✅ **Contribute back** (when appropriate)
5. ✅ **Easy deployment** (maintain production stability)

### Philosophy: **"Fork as Last Resort, Modular Always"**

```
┌─────────────────────────────────────────────────────────────┐
│ Sustainable Fork Strategy                                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Upstream (n8n/n8n)                                          │
│       ↓ (weekly sync)                                        │
│  Your Fork (yourname/n8n)                                    │
│    ├── main (mirrors upstream/master)                        │
│    ├── feature/social-auth (modular addon)                   │
│    ├── feature/brain-garden (modular addon)                  │
│    └── deploy/production (main + features merged)            │
│                                                               │
│  Deployment                                                  │
│    deploy/production → Docker Image → Production Server     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Step-by-Step Fork Setup

### Phase 1: Initial Fork Creation

#### Step 1.1: Fork on GitHub

```bash
# 1. Fork via GitHub UI
#    Navigate to: https://github.com/n8n-io/n8n
#    Click "Fork" button
#    Fork to: yourname/n8n or yourcompany/n8n

# 2. Clone your fork
git clone https://github.com/yourname/n8n.git
cd n8n

# 3. Add upstream remote
git remote add upstream https://github.com/n8n-io/n8n.git

# 4. Verify remotes
git remote -v
# origin    https://github.com/yourname/n8n.git (fetch)
# origin    https://github.com/yourname/n8n.git (push)
# upstream  https://github.com/n8n-io/n8n.git (fetch)
# upstream  https://github.com/n8n-io/n8n.git (push)
```

#### Step 1.2: Configure Branch Strategy

```bash
# Fetch latest from upstream
git fetch upstream

# Ensure main tracks upstream
git checkout main
git branch --set-upstream-to=upstream/master main

# Create feature branches
git checkout -b feature/social-auth
git checkout -b feature/brain-garden

# Create deployment branch
git checkout main
git checkout -b deploy/production
```

**Branch Purposes:**
- **`main`**: Always synced with upstream (never contains custom code)
- **`feature/social-auth`**: Social login feature (rebased onto main)
- **`feature/brain-garden`**: Brain Garden integration (rebased onto main)
- **`deploy/production`**: Merge of main + all features (deployed to production)

---

### Phase 2: Modular Code Organization

#### Directory Structure for Custom Code

```
n8n-fork/
├── packages/
│   ├── cli/src/modules/
│   │   ├── social-auth/           # ← Custom feature #1
│   │   │   ├── README.md
│   │   │   ├── providers/
│   │   │   ├── social-auth.controller.ts
│   │   │   └── social-auth.service.ts
│   │   │
│   │   └── brain-garden/          # ← Custom feature #2
│   │       ├── README.md
│   │       ├── agents/
│   │       ├── brain-garden.controller.ts
│   │       └── brain-garden.service.ts
│   │
│   ├── @n8n/config/src/configs/
│   │   ├── social-auth.config.ts  # ← Custom config #1
│   │   └── brain-garden.config.ts # ← Custom config #2
│   │
│   └── frontend/editor-ui/src/features/
│       ├── social-auth/           # ← Custom frontend #1
│       └── brain-garden/          # ← Custom frontend #2
│
└── .github/
    └── workflows/
        └── custom-deploy.yml      # ← Custom CI/CD
```

**Key Principle:** All custom code lives in **dedicated directories** that upstream will never create.

---

### Phase 3: Weekly Sync Workflow

#### Automated Sync Script

**File:** `scripts/sync-upstream.sh`

```bash
#!/bin/bash
# sync-upstream.sh
# Syncs fork with upstream n8n repository

set -e

echo "🔄 Syncing fork with upstream n8n..."

# Fetch latest from upstream
echo "📥 Fetching upstream changes..."
git fetch upstream

# Switch to main branch
echo "🔀 Switching to main branch..."
git checkout main

# Merge upstream changes
echo "🔗 Merging upstream/master into main..."
git merge upstream/master --no-edit

# Push to origin
echo "⬆️  Pushing to origin/main..."
git push origin main

# Rebase feature branches
for branch in feature/social-auth feature/brain-garden; do
  echo "🔄 Rebasing $branch onto main..."
  git checkout $branch

  # Stash any uncommitted changes
  git stash

  # Rebase onto main
  git rebase main

  # Push (force with lease for safety)
  git push --force-with-lease origin $branch

  # Pop stash if exists
  git stash pop || true
done

# Update deployment branch
echo "🚀 Updating deploy/production..."
git checkout deploy/production
git merge main --no-edit
git merge feature/social-auth --no-edit
git merge feature/brain-garden --no-edit
git push origin deploy/production

echo "✅ Sync complete!"
```

**Usage:**
```bash
# Make executable
chmod +x scripts/sync-upstream.sh

# Run weekly (cron job or manual)
./scripts/sync-upstream.sh
```

---

### Phase 4: Handling Merge Conflicts

#### Conflict Resolution Strategies

**Strategy 1: Modular Code (No Conflicts Expected)**

Since custom code lives in isolated modules, conflicts should be rare.

**Example Conflict-Free Directories:**
- `packages/cli/src/modules/social-auth/` ← Custom, upstream never touches
- `packages/cli/src/modules/brain-garden/` ← Custom, upstream never touches

**Strategy 2: Shared Files (Potential Conflicts)**

Some files may need modification:

```typescript
// packages/cli/src/server.ts (UPSTREAM FILE)

// ❌ BAD: Direct modification (causes conflicts)
import { SocialAuthController } from './modules/social-auth/social-auth.controller';

// ✅ GOOD: Feature flag + conditional import
if (process.env.N8N_SOCIAL_AUTH_ENABLED === 'true') {
  import('./modules/social-auth/social-auth.controller')
    .then(({ SocialAuthController }) => {
      // Register controller dynamically
    });
}
```

**Conflict Resolution Process:**

```bash
# If rebase fails with conflicts
git rebase main

# Git will stop at conflicted commit
# CONFLICT (content): Merge conflict in packages/cli/src/server.ts

# 1. Identify conflict
git status

# 2. Open file and resolve conflict
#    Look for <<<<<<< HEAD markers
#    Keep upstream changes + add your hooks

# 3. Mark as resolved
git add packages/cli/src/server.ts

# 4. Continue rebase
git rebase --continue

# 5. Push (force with lease)
git push --force-with-lease
```

---

### Phase 5: Contributing Back to Upstream

#### When to Contribute

**Good Candidates for PR:**
- ✅ Generic features (social login, MCP enhancements)
- ✅ Bug fixes you discovered
- ✅ Performance improvements
- ✅ Documentation improvements
- ✅ Test coverage additions

**Bad Candidates:**
- ❌ Highly specific to your use case
- ❌ Breaks existing functionality
- ❌ Adds significant complexity
- ❌ Conflicts with n8n's enterprise offerings

#### PR Preparation Checklist

```bash
# 1. Create clean branch from upstream
git fetch upstream
git checkout -b pr/social-auth-feature upstream/master

# 2. Cherry-pick only relevant commits
git cherry-pick <commit-hash>  # Repeat for each clean commit

# 3. Squash into logical commits
git rebase -i upstream/master

# 4. Run quality checks
pnpm lint
pnpm typecheck
pnpm test
pnpm build > build.log 2>&1

# 5. Push to your fork
git push origin pr/social-auth-feature

# 6. Create PR via GitHub UI
#    - Clear title: "feat: Add social authentication support"
#    - Comprehensive description
#    - Link to issue (if exists)
#    - Screenshots/demos
```

**PR Template:**

```markdown
## Description
Adds social authentication support (Google, GitHub, Apple, Microsoft) for user login.

## Motivation
Many users request social login for easier onboarding (#12345, #67890).

## Implementation Details
- Modular architecture in `packages/cli/src/modules/social-auth/`
- Feature flag: `N8N_SOCIAL_AUTH_ENABLED`
- Zero modifications to core auth system
- Reuses existing `auth_identity` table

## Testing
- [ ] Unit tests added (coverage: 85%)
- [ ] E2E tests added
- [ ] Tested on SQLite, PostgreSQL, MySQL
- [ ] Documentation updated

## Screenshots
[Add screenshots of social login UI]

## Checklist
- [ ] Follows n8n code style
- [ ] No breaking changes
- [ ] Documentation updated
- [ ] Tests pass
- [ ] Linear issue linked
```

---

## 🔧 Automation & CI/CD

### GitHub Actions: Auto-Sync Workflow

**File:** `.github/workflows/sync-upstream.yml`

```yaml
name: Sync Upstream

on:
  schedule:
    # Run every Sunday at 2 AM UTC
    - cron: '0 2 * * 0'
  workflow_dispatch:  # Allow manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Configure Git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

      - name: Add upstream remote
        run: git remote add upstream https://github.com/n8n-io/n8n.git

      - name: Fetch upstream
        run: git fetch upstream

      - name: Merge upstream into main
        run: |
          git checkout main
          git merge upstream/master --no-edit
          git push origin main

      - name: Rebase feature branches
        run: |
          for branch in feature/social-auth feature/brain-garden; do
            git checkout $branch
            git rebase main
            git push --force-with-lease origin $branch
          done

      - name: Create PR if conflicts
        if: failure()
        uses: peter-evans/create-pull-request@v5
        with:
          title: "⚠️ Upstream sync conflicts detected"
          body: |
            Automatic upstream sync failed due to conflicts.
            Please resolve manually:
            1. Run `./scripts/sync-upstream.sh` locally
            2. Resolve conflicts
            3. Push changes
          branch: sync/upstream-conflicts
```

---

### Docker Deployment from Fork

**File:** `docker/Dockerfile.custom`

```dockerfile
FROM node:22-alpine AS build

# Build from your fork (deploy/production branch)
WORKDIR /app
COPY . .

# Install dependencies
RUN corepack enable && \
    corepack prepare pnpm@10.18.3 --activate

# Build
RUN pnpm install --frozen-lockfile && \
    pnpm build

FROM node:22-alpine

# Copy built app
COPY --from=build /app /app

WORKDIR /app

# Set environment variables for custom features
ENV N8N_SOCIAL_AUTH_ENABLED=true
ENV N8N_BRAIN_GARDEN_ENABLED=true

EXPOSE 5678

CMD ["pnpm", "start"]
```

**Build & Deploy:**

```bash
# Build custom Docker image
docker build -f docker/Dockerfile.custom -t yourname/n8n-custom:latest .

# Run locally
docker run -p 5678:5678 \
  -e N8N_SOCIAL_AUTH_ENABLED=true \
  -e N8N_GOOGLE_CLIENT_ID=your-id \
  -e N8N_GOOGLE_CLIENT_SECRET=your-secret \
  yourname/n8n-custom:latest

# Push to registry
docker push yourname/n8n-custom:latest
```

---

## 📊 Monitoring Fork Health

### Metrics to Track

| Metric | Target | How to Check |
|--------|--------|--------------|
| **Commits Behind Upstream** | <50 commits | `git rev-list --count main..upstream/master` |
| **Merge Conflicts** | 0 | Weekly sync runs without errors |
| **Custom Code Percentage** | <10% | `git diff upstream/master --shortstat` |
| **Build Time** | <10 min | CI/CD pipeline duration |
| **Test Pass Rate** | 100% | `pnpm test` results |

### Dashboard Script

**File:** `scripts/fork-health.sh`

```bash
#!/bin/bash
# fork-health.sh
# Reports health metrics for your fork

echo "🏥 Fork Health Report"
echo "===================="

# Commits behind upstream
commits_behind=$(git rev-list --count main..upstream/master)
echo "Commits behind upstream: $commits_behind"

# Custom code size
custom_lines=$(git diff upstream/master --shortstat | awk '{print $4}')
echo "Custom lines added: ${custom_lines:-0}"

# Last sync date
last_sync=$(git log -1 --format="%ar" main)
echo "Last sync: $last_sync"

# Feature branch status
for branch in feature/social-auth feature/brain-garden; do
  echo ""
  echo "Branch: $branch"
  git checkout $branch >/dev/null 2>&1
  ahead=$(git rev-list --count origin/$branch..HEAD)
  behind=$(git rev-list --count HEAD..origin/$branch)
  echo "  Ahead: $ahead, Behind: $behind"
done

echo ""
echo "✅ Health check complete!"
```

---

## 🚨 Emergency Procedures

### Scenario 1: Massive Upstream Refactor

**Problem:** Upstream refactored core files your custom code depends on.

**Solution:**

```bash
# 1. Create emergency branch
git checkout main
git checkout -b emergency/upstream-refactor

# 2. Analyze changes
git diff upstream/master..main

# 3. Rewrite custom code to match new upstream patterns
#    (May require significant refactoring)

# 4. Test thoroughly
pnpm build
pnpm test

# 5. Update feature branches
git checkout feature/social-auth
git rebase emergency/upstream-refactor

# 6. Merge to deploy
git checkout deploy/production
git merge emergency/upstream-refactor
```

---

### Scenario 2: Critical Security Patch

**Problem:** Upstream releases security patch, need immediate deployment.

**Fast-Track Process:**

```bash
# 1. Fetch and merge immediately
git fetch upstream
git checkout main
git merge upstream/master
git push origin main

# 2. Skip feature rebases, merge directly
git checkout deploy/production
git merge main --no-edit
git push origin deploy/production

# 3. Deploy ASAP
docker build -f docker/Dockerfile.custom -t yourname/n8n-custom:security-patch .
docker push yourname/n8n-custom:security-patch

# 4. Update production
kubectl set image deployment/n8n n8n=yourname/n8n-custom:security-patch

# 5. Fix feature branches later (non-urgent)
```

---

### Scenario 3: Want to Abandon Fork

**Problem:** Maintenance burden too high, want to return to upstream.

**Migration Path:**

```bash
# 1. Export custom workflows
./packages/cli/bin/n8n export:workflow --all --output=./backup/

# 2. Export custom credentials
./packages/cli/bin/n8n export:credentials --output=./backup/

# 3. Switch to upstream
git remote rename origin fork
git remote rename upstream origin
git checkout -b main origin/master

# 4. Deploy upstream version
docker run -p 5678:5678 n8nio/n8n:latest

# 5. Import data
./packages/cli/bin/n8n import:workflow --input=./backup/
./packages/cli/bin/n8n import:credentials --input=./backup/

# 6. Lose custom features (social login, Brain Garden)
#    but gain official support + automatic updates
```

---

## 📈 Long-Term Strategy Recommendations

### Year 1: Modular Fork

**Focus:** Maintain clean fork with modular features

- ✅ Weekly upstream syncs automated
- ✅ Social login feature stabilized
- ✅ Brain Garden integration deployed
- ✅ <50 commits behind upstream

### Year 2: Contribute Back

**Focus:** Reduce fork maintenance by upstreaming features

- ✅ Submit social login PR to upstream
- ✅ Contribute bug fixes found in production
- ✅ Reduce custom code percentage to <5%

### Year 3: Plugin Ecosystem

**Focus:** Convert custom features to official n8n plugins

- ✅ Social login becomes npm package: `@yourcompany/n8n-social-auth`
- ✅ Brain Garden becomes plugin: `@yourcompany/n8n-brain-garden`
- ✅ Zero fork maintenance (use upstream directly)

---

## 🎓 Best Practices Summary

### DO ✅

1. **Use modular code organization** (dedicated directories)
2. **Automate upstream syncs** (weekly CI/CD job)
3. **Feature flag everything** (easy to disable)
4. **Rebase feature branches** (keep history clean)
5. **Contribute back when possible** (reduce maintenance)
6. **Document custom code extensively** (help future you)
7. **Test on all databases** (SQLite, PostgreSQL, MySQL)

### DON'T ❌

1. **Modify core files directly** (causes merge conflicts)
2. **Skip upstream syncs** (drift = pain)
3. **Deploy from feature branches** (use deploy/production)
4. **Forget to test after sync** (upstream may break things)
5. **Hide custom code** (document everything)
6. **Ignore upstream conventions** (makes PRs harder)

---

## 🔗 Quick Reference

### Common Commands

```bash
# Sync with upstream
./scripts/sync-upstream.sh

# Check fork health
./scripts/fork-health.sh

# Deploy to production
git checkout deploy/production
docker build -f docker/Dockerfile.custom -t yourname/n8n-custom:$(git rev-parse --short HEAD) .
docker push yourname/n8n-custom:$(git rev-parse --short HEAD)

# Create PR for upstream
git checkout -b pr/my-feature upstream/master
# ... make changes ...
git push origin pr/my-feature
# Create PR via GitHub UI
```

### Useful Aliases

```bash
# Add to ~/.gitconfig
[alias]
  sync-upstream = !./scripts/sync-upstream.sh
  fork-health = !./scripts/fork-health.sh
  upstream-diff = diff upstream/master..main
  custom-files = diff --name-only upstream/master..main
```

---

**Strategy Completed By:** Commander Agent
**Methodology:** BMAD Sustainable Fork Management
**Review Cycle:** Quarterly (update strategy as needed)
**Success Metric:** <5% maintenance time spent on fork vs feature development
