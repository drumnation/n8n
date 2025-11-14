# Browser Automation: OAuth Setup for n8n

## 🤖 For Use With Browser Automation Agents

This guide provides step-by-step instructions that browser automation agents (ChatGPT with browser, Claude with MCP browser tools, Playwright, etc.) can follow to set up OAuth credentials.

**Key Features:**
- ✅ Conditional logic (if/then/else)
- ✅ Visual verification checkpoints
- ✅ Error handling and fallbacks
- ✅ Exact selectors when possible, descriptions when not
- ✅ Self-correcting instructions

---

## 🎯 Master Automation Prompt (For ChatGPT/Claude)

```markdown
You are a browser automation agent setting up OAuth credentials for n8n. Follow these instructions precisely, with built-in error handling.

## Core Directives

1. **Execute steps sequentially** - Don't skip ahead
2. **Verify each step** - Check page loaded correctly before proceeding
3. **Handle variations** - If UI differs from expected, adapt
4. **Capture credentials** - Store Client ID, Client Secret, API keys
5. **Report progress** - Confirm each major checkpoint
6. **Self-correct** - If stuck, try alternative selectors or paths

## Error Handling Protocol

When a step fails:
1. Take screenshot
2. Analyze what's visible
3. Try alternative selector (class, text content, aria-label)
4. Try navigation path (menu → submenu → item)
5. If still stuck, report issue with screenshot

## Verification Pattern

After each navigation:
```
WAIT for page load (2-3 seconds)
VERIFY expected element is visible
IF not visible:
  - WAIT additional 2 seconds
  - TRY alternative selector
  - REPORT if still not found
ELSE:
  - PROCEED to next step
```

## Output Format

For each service completion, output:
```json
{
  "service": "Service Name",
  "status": "success|partial|failed",
  "credentials": {
    "clientId": "...",
    "clientSecret": "...",
    "apiKey": "..."
  },
  "redirect_uri": "http://localhost:5678/rest/oauth2-credential/callback",
  "scopes": ["scope1", "scope2"],
  "notes": "Any important information"
}
```
```

---

## 📋 Service 1: Google OAuth (Automated)

```javascript
/**
 * Google OAuth Setup - Browser Automation Script
 * Target: Gmail, Google Sheets, Google Calendar
 * Time: ~10 minutes
 */

const setupGoogleOAuth = async (browser) => {
  const credentials = {};

  // STEP 1: Navigate to Google Cloud Console
  await browser.navigate('https://console.cloud.google.com');
  await browser.wait(2000);

  // VERIFY: Check if on correct page
  if (!await browser.hasElement({ text: 'Google Cloud' })) {
    console.log('ERROR: Not on Google Cloud Console');
    // TRY: Wait longer or check login
    await browser.wait(5000);
  }

  // STEP 2: Create New Project
  // Conditional: Check if project dropdown exists
  const hasProjects = await browser.hasElement({
    selector: '[aria-label*="Select a project"]'
  });

  if (hasProjects) {
    await browser.click('[aria-label*="Select a project"]');
    await browser.wait(1000);
  } else {
    // Alternative: Try main menu approach
    await browser.click('[aria-label="Main menu"]');
    await browser.clickText('Select a project');
    await browser.wait(1000);
  }

  // STEP 3: Click "New Project"
  // Multiple possible selectors
  const newProjectClicked = await browser.clickOne([
    { text: 'NEW PROJECT' },
    { text: 'New Project' },
    { text: 'Create Project' },
    { selector: 'button[aria-label*="Create"]' }
  ]);

  if (!newProjectClicked) {
    throw new Error('Could not find New Project button');
  }

  await browser.wait(2000);

  // STEP 4: Enter Project Name
  await browser.fill({
    selectors: [
      'input[name="projectName"]',
      'input[aria-label*="Project name"]',
      'input#projectName'
    ],
    value: 'n8n Workflows'
  });

  // STEP 5: Click Create
  await browser.clickOne([
    { text: 'CREATE' },
    { text: 'Create' },
    { selector: 'button[type="submit"]' }
  ]);

  // WAIT for project creation (can take 5-10 seconds)
  await browser.wait(10000);

  // VERIFY: Check if project was created
  await browser.waitForText('n8n Workflows', { timeout: 10000 });

  // STEP 6: Select the new project
  await browser.click('[aria-label*="Select a project"]');
  await browser.wait(1000);
  await browser.clickText('n8n Workflows');
  await browser.wait(2000);

  // ========================================
  // PHASE 2: Enable APIs
  // ========================================

  // STEP 7: Open API Library
  await browser.clickOne([
    { selector: '[aria-label="Main menu"]' },
    { selector: '.gb_Qa' }, // Hamburger menu class
    { text: '☰' }
  ]);
  await browser.wait(1000);

  // Navigate: APIs & Services → Library
  await browser.clickText('APIs & Services');
  await browser.wait(500);
  await browser.clickText('Library');
  await browser.wait(2000);

  // STEP 8-10: Enable APIs (Gmail, Sheets, Calendar)
  const apisToEnable = [
    'Gmail API',
    'Google Sheets API',
    'Google Calendar API'
  ];

  for (const apiName of apisToEnable) {
    // Search for API
    await browser.fill({
      selectors: [
        'input[placeholder*="Search"]',
        'input[type="search"]',
        '#searchbox'
      ],
      value: apiName
    });

    await browser.wait(1000);

    // Click first result
    await browser.clickText(apiName);
    await browser.wait(2000);

    // Enable API (if not already enabled)
    const enableButton = await browser.hasText('ENABLE');
    if (enableButton) {
      await browser.clickText('ENABLE');
      await browser.wait(3000);
    }

    // Go back to library
    await browser.back();
    await browser.wait(1000);
  }

  // ========================================
  // PHASE 3: Create OAuth Credentials
  // ========================================

  // STEP 11: Navigate to Credentials
  await browser.clickOne([
    { selector: '[aria-label="Main menu"]' },
    { text: '☰' }
  ]);
  await browser.wait(500);
  await browser.clickText('APIs & Services');
  await browser.wait(500);
  await browser.clickText('Credentials');
  await browser.wait(2000);

  // STEP 12: Check if OAuth consent screen needs configuration
  const needsConsent = await browser.hasText('CONFIGURE CONSENT SCREEN');

  if (needsConsent) {
    // Configure consent screen
    await browser.clickText('CONFIGURE CONSENT SCREEN');
    await browser.wait(2000);

    // Select External
    await browser.click('input[value="EXTERNAL"]');
    await browser.clickText('CREATE');
    await browser.wait(2000);

    // Fill in consent screen
    await browser.fill({
      selectors: ['input[name="appName"]', '#appName'],
      value: 'n8n Workflows'
    });

    // User support email (should be auto-selected)
    // Developer contact email
    await browser.fill({
      selectors: [
        'input[type="email"]',
        'input[name="email"]'
      ],
      value: await browser.getUserEmail() // Get from logged-in session
    });

    // Save and continue
    await browser.clickText('SAVE AND CONTINUE');
    await browser.wait(2000);

    // STEP: Add Scopes
    await browser.clickText('ADD OR REMOVE SCOPES');
    await browser.wait(1000);

    // Add each scope
    const scopes = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/calendar'
    ];

    for (const scope of scopes) {
      await browser.fill({
        selectors: ['input[placeholder*="Filter"]', 'input[type="search"]'],
        value: scope
      });
      await browser.wait(500);

      // Check the scope checkbox
      await browser.click(`input[value="${scope}"]`);
    }

    await browser.clickText('UPDATE');
    await browser.wait(1000);
    await browser.clickText('SAVE AND CONTINUE');
    await browser.wait(2000);

    // STEP: Add test users
    await browser.clickText('ADD USERS');
    await browser.wait(1000);

    await browser.fill({
      selectors: ['input[type="email"]'],
      value: await browser.getUserEmail()
    });

    await browser.clickText('ADD');
    await browser.wait(1000);
    await browser.clickText('SAVE AND CONTINUE');
    await browser.wait(2000);

    // Back to dashboard
    await browser.clickText('BACK TO DASHBOARD');
    await browser.wait(2000);

    // Navigate back to Credentials
    await browser.clickText('Credentials');
    await browser.wait(2000);
  }

  // STEP 13: Create OAuth Client ID
  await browser.clickText('CREATE CREDENTIALS');
  await browser.wait(500);
  await browser.clickText('OAuth client ID');
  await browser.wait(2000);

  // Select application type
  await browser.select({
    selectors: ['select[name="applicationType"]', '#applicationType'],
    value: 'Web application'
  });

  // Name the OAuth client
  await browser.fill({
    selectors: ['input[name="displayName"]', '#displayName'],
    value: 'n8n OAuth Client'
  });

  // STEP 14: Add Redirect URI
  await browser.clickText('ADD URI');
  await browser.wait(500);

  await browser.fill({
    selectors: [
      'input[name="redirectUris"]',
      'input[placeholder*="redirect"]'
    ],
    value: 'http://localhost:5678/rest/oauth2-credential/callback'
  });

  // STEP 15: Create
  await browser.clickText('CREATE');
  await browser.wait(3000);

  // STEP 16: Capture Credentials from Popup
  // Wait for OAuth client created popup
  await browser.waitForText('Your Client ID', { timeout: 5000 });

  // Extract credentials
  credentials.clientId = await browser.getText({
    selectors: [
      '[data-testid="clientId"]',
      'input[readonly][aria-label*="Client ID"]'
    ]
  });

  credentials.clientSecret = await browser.getText({
    selectors: [
      '[data-testid="clientSecret"]',
      'input[readonly][aria-label*="Client secret"]'
    ]
  });

  credentials.redirectUri = 'http://localhost:5678/rest/oauth2-credential/callback';
  credentials.scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/calendar'
  ];

  // Close popup
  await browser.clickText('OK');

  return {
    service: 'Google OAuth',
    status: 'success',
    credentials: credentials,
    notes: 'Covers Gmail, Google Sheets, Google Calendar'
  };
};
```

---

## 📋 Service 2: Todoist OAuth (Automated)

```javascript
/**
 * Todoist OAuth Setup - Browser Automation Script
 * Time: ~5 minutes
 */

const setupTodoistOAuth = async (browser) => {
  const credentials = {};

  // STEP 1: Navigate to Todoist Developer Console
  await browser.navigate('https://developer.todoist.com/appconsole.html');
  await browser.wait(2000);

  // VERIFY: Check if logged in
  if (await browser.hasText('Log in')) {
    console.log('Not logged in. User needs to login first.');
    // Wait for manual login or handle OAuth login
    await browser.waitForNavigation({ timeout: 60000 });
  }

  // STEP 2: Create New App
  const createButton = await browser.clickOne([
    { text: 'Create a new app' },
    { text: 'New app' },
    { text: '+ Create app' },
    { selector: 'button[aria-label*="Create"]' }
  ]);

  if (!createButton) {
    throw new Error('Could not find create app button');
  }

  await browser.wait(2000);

  // STEP 3: Fill App Details
  await browser.fill({
    selectors: [
      'input[name="name"]',
      'input[placeholder*="App name"]',
      '#appName'
    ],
    value: 'n8n Workflows'
  });

  await browser.fill({
    selectors: [
      'input[name="url"]',
      'input[placeholder*="service URL"]',
      '#serviceUrl'
    ],
    value: 'http://localhost:5678'
  });

  await browser.fill({
    selectors: [
      'input[name="redirect"]',
      'input[placeholder*="redirect"]',
      '#redirectUrl'
    ],
    value: 'http://localhost:5678/rest/oauth2-credential/callback'
  });

  // STEP 4: Submit
  await browser.clickOne([
    { text: 'Create app' },
    { text: 'Submit' },
    { selector: 'button[type="submit"]' }
  ]);

  await browser.wait(2000);

  // STEP 5: Extract Credentials
  credentials.clientId = await browser.getText({
    selectors: [
      '[data-field="client_id"]',
      'input[readonly][id*="client"][id*="id"]',
      'code:has-text("Client ID")'
    ]
  });

  credentials.clientSecret = await browser.getText({
    selectors: [
      '[data-field="client_secret"]',
      'input[readonly][id*="client"][id*="secret"]',
      'code:has-text("Client secret")'
    ]
  });

  credentials.redirectUri = 'http://localhost:5678/rest/oauth2-credential/callback';

  return {
    service: 'Todoist OAuth',
    status: 'success',
    credentials: credentials
  };
};
```

---

## 📋 Services 3-8: API Keys (Automated)

```javascript
/**
 * Generic API Key Extraction Pattern
 * Works for: Anthropic, OpenAI, DeepSeek, Google Gemini, OpenRouter
 */

const apiKeyServices = {
  anthropic: {
    url: 'https://console.anthropic.com',
    navigation: ['API Keys', 'Create Key'],
    keyFormat: /^sk-ant-api03-/,
    selectors: {
      createButton: [
        { text: 'Create Key' },
        { text: '+ New Key' },
        { text: 'Generate Key' }
      ],
      keyField: [
        'input[readonly][value^="sk-ant"]',
        'code',
        '[data-testid="api-key"]'
      ]
    }
  },

  openai: {
    url: 'https://platform.openai.com/api-keys',
    navigation: ['Create new secret key'],
    keyFormat: /^sk-/,
    selectors: {
      createButton: [
        { text: 'Create new secret key' },
        { text: '+ Create new secret key' }
      ],
      keyField: [
        'input[readonly][value^="sk-"]',
        'code',
        '[data-testid="secret-key"]'
      ]
    }
  },

  deepseek: {
    url: 'https://platform.deepseek.com',
    navigation: ['API Keys', 'Create API Key'],
    keyFormat: /^sk-/,
    selectors: {
      createButton: [
        { text: 'Create API Key' },
        { text: '+ New Key' }
      ],
      keyField: [
        'input[readonly]',
        'code',
        '[data-testid="api-key"]'
      ]
    }
  },

  googleGemini: {
    url: 'https://makersuite.google.com/app/apikey',
    navigation: ['Create API key'],
    keyFormat: /^AI/,
    selectors: {
      createButton: [
        { text: 'Create API key' },
        { text: 'Get API key' }
      ],
      keyField: [
        'input[readonly][value^="AI"]',
        'code',
        '[data-testid="api-key"]'
      ]
    }
  },

  openrouter: {
    url: 'https://openrouter.ai/keys',
    navigation: ['Create Key'],
    keyFormat: /^sk-/,
    selectors: {
      createButton: [
        { text: 'Create Key' },
        { text: '+ New Key' }
      ],
      keyField: [
        'input[readonly]',
        'code',
        '[data-testid="api-key"]'
      ]
    }
  }
};

const setupAPIKey = async (browser, serviceName) => {
  const config = apiKeyServices[serviceName];

  // STEP 1: Navigate
  await browser.navigate(config.url);
  await browser.wait(3000);

  // STEP 2: Find and click create button
  let clicked = false;
  for (const selector of config.selectors.createButton) {
    if (await browser.hasElement(selector)) {
      await browser.click(selector);
      clicked = true;
      break;
    }
  }

  if (!clicked) {
    // Try navigation approach
    for (const navItem of config.navigation) {
      await browser.clickText(navItem);
      await browser.wait(1000);
    }
  }

  await browser.wait(2000);

  // STEP 3: Name the key (if prompted)
  if (await browser.hasElement({ selector: 'input[name="name"]' })) {
    await browser.fill({
      selectors: ['input[name="name"]', 'input[placeholder*="name"]'],
      value: 'n8n Workflows'
    });

    await browser.clickOne([
      { text: 'Create' },
      { text: 'Generate' },
      { selector: 'button[type="submit"]' }
    ]);

    await browser.wait(2000);
  }

  // STEP 4: Extract API key
  let apiKey = null;
  for (const selector of config.selectors.keyField) {
    apiKey = await browser.getText(selector);
    if (apiKey && config.keyFormat.test(apiKey)) {
      break;
    }
  }

  if (!apiKey) {
    // Try copying from clipboard
    await browser.clickOne([
      { text: 'Copy' },
      { selector: '[aria-label*="Copy"]' }
    ]);
    apiKey = await browser.getClipboard();
  }

  return {
    service: serviceName,
    status: apiKey ? 'success' : 'failed',
    credentials: { apiKey: apiKey }
  };
};
```

---

## 🎯 Master Orchestration Script

```javascript
/**
 * Complete OAuth Setup - All Services
 * Run this with: node oauth-setup-automation.js
 */

const setupAllServices = async () => {
  const browser = await initBrowser();
  const results = [];

  try {
    // Service 1: Google OAuth (Gmail, Sheets, Calendar)
    console.log('🔐 Setting up Google OAuth...');
    const google = await setupGoogleOAuth(browser);
    results.push(google);
    await save1Password(google);
    console.log('✅ Google OAuth complete');

    // Service 2: Todoist OAuth
    console.log('🔐 Setting up Todoist...');
    const todoist = await setupTodoistOAuth(browser);
    results.push(todoist);
    await save1Password(todoist);
    console.log('✅ Todoist complete');

    // Services 3-8: API Keys
    const apiServices = [
      'anthropic',
      'openai',
      'deepseek',
      'googleGemini',
      'openrouter'
    ];

    for (const service of apiServices) {
      console.log(`🔐 Setting up ${service}...`);
      const result = await setupAPIKey(browser, service);
      results.push(result);
      await save1Password(result);
      console.log(`✅ ${service} complete`);
    }

    // Service 7: PostgreSQL (manual - just record existing)
    console.log('📝 Recording PostgreSQL credentials...');
    const postgres = await promptForPostgres();
    results.push(postgres);
    await save1Password(postgres);
    console.log('✅ PostgreSQL recorded');

    // Final report
    console.log('\n🎉 ALL SERVICES COMPLETE!\n');
    console.log('Summary:');
    results.forEach(r => {
      console.log(`${r.status === 'success' ? '✅' : '❌'} ${r.service}`);
    });

    // Generate import script
    await generateImportScript(results);

  } catch (error) {
    console.error('Error during setup:', error);
  } finally {
    await browser.close();
  }
};

// Run it
setupAllServices();
```

---

## 🤖 ChatGPT/Claude Integration

### For ChatGPT with Browser Access

```markdown
I need you to act as a browser automation agent. I'll provide you with step-by-step instructions to set up OAuth credentials for 8 services. For each service:

1. Navigate to the specified URL
2. Follow the conditional logic (if this, then that)
3. Extract credentials when complete
4. Report back in JSON format

Start with Service 1: Google OAuth

[Paste the setupGoogleOAuth script above]

Execute each step, adapting if the UI differs from expected. Report progress and any issues you encounter.
```

### For Claude with Chrome MCP

```bash
# Use Chrome MCP server tools
# Navigate, click, fill, extract text

I'll guide you through browser automation to set up OAuth credentials. Use the chrome MCP tools to:

1. Navigate to URLs
2. Click elements by selector or text
3. Fill forms
4. Extract credentials

[Provide service-by-service instructions]
```

---

## 📊 Success Criteria

After automation completes, you should have:

```json
{
  "googleOAuth": {
    "clientId": "123-abc.apps.googleusercontent.com",
    "clientSecret": "GOCSPX-abc123",
    "scopes": ["gmail.send", "gmail.readonly", "spreadsheets", "calendar"]
  },
  "todoistOAuth": {
    "clientId": "abc123",
    "clientSecret": "xyz789"
  },
  "anthropic": {
    "apiKey": "sk-ant-api03-..."
  },
  "openai": {
    "apiKey": "sk-..."
  },
  "deepseek": {
    "apiKey": "sk-..."
  },
  "googleGemini": {
    "apiKey": "AI..."
  },
  "postgres": {
    "host": "localhost",
    "port": 5432,
    "database": "mydb",
    "username": "user",
    "password": "pass"
  },
  "openrouter": {
    "apiKey": "sk-..."
  }
}
```

All saved to 1Password, ready to import to n8n with:
```bash
./credentials/from-1password.sh
```

---

**Generated:** November 6, 2025
**Purpose:** Browser automation-ready OAuth setup instructions
**Status:** ✅ Ready for ChatGPT/Claude/Playwright

Use with ChatGPT browser access or Claude with Chrome MCP server! 🤖🚀
