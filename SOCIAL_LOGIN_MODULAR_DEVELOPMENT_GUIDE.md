# Social Login Modular Development Guide for n8n

**Guide Version:** 1.0
**Target Feature:** Multi-Provider Social Authentication (Google, GitHub, Apple, Microsoft)
**Methodology:** BMAD Modular Development Approach
**Date:** 2025-11-06

---

## 🎯 Feature Overview

### Goal
Enable users to log into n8n using social identity providers (Google, GitHub, Apple, Microsoft) while maintaining **modular, self-contained code** that can be:
- ✅ Merged upstream without conflicts
- ✅ Maintained separately in your fork
- ✅ Easily disabled via feature flags
- ✅ Extended with new providers

### Current State
n8n supports:
- ❌ **No social login** for user authentication (only email/password)
- ✅ **OAuth 2.0 for credentials** (workflow integrations only)
- ✅ **SAML/LDAP** (Enterprise features for SSO)

### Proposed Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Social Login Architecture (Modular)                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend: Login Page                                        │
│    → "Sign in with Google" button                           │
│    → "Sign in with GitHub" button                           │
│    → "Sign in with Apple" button                            │
│    → "Sign in with Microsoft" button                        │
│         ↓                                                     │
│  Backend: Social Auth Module (NEW)                          │
│    /packages/cli/src/modules/social-auth/                   │
│         ↓                                                     │
│  OAuth 2.0 Authorization Code Flow (with PKCE)              │
│         ↓                                                     │
│  User Creation/Linking via auth_identity table              │
│         ↓                                                     │
│  Session Cookie Issued (existing auth.service.ts)           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Modular Development Principles

### 1. **Isolation** 🏝️
All social login code lives in a **dedicated module**:
```
packages/cli/src/modules/social-auth/
```

### 2. **Feature Flag Control** 🚩
Enable/disable entire module via environment variable:
```bash
N8N_SOCIAL_AUTH_ENABLED=true
```

### 3. **Zero Core Modifications** 🛡️
Integrate via:
- Dependency injection (register services)
- Route registration (add endpoints)
- Event hooks (user creation events)

### 4. **Database Isolation** 💾
Reuse existing `auth_identity` table, no new tables required:
```typescript
// Existing table handles social login perfectly
auth_identity {
  userId: string;           // → user.id (FK)
  providerId: string;       // "google:123456789" (email from provider)
  providerType: string;     // "google" | "github" | "apple" | "microsoft"
}
```

### 5. **Configuration Externalization** ⚙️
All provider config via environment variables or config files:
```typescript
// packages/@n8n/config/src/configs/social-auth.config.ts
export const socialAuthConfig = {
  enabled: env.N8N_SOCIAL_AUTH_ENABLED === 'true',
  providers: {
    google: {
      clientId: env.N8N_GOOGLE_CLIENT_ID,
      clientSecret: env.N8N_GOOGLE_CLIENT_SECRET,
      enabled: env.N8N_GOOGLE_AUTH_ENABLED === 'true'
    },
    github: { /* ... */ },
    apple: { /* ... */ },
    microsoft: { /* ... */ }
  }
};
```

---

## 🏗️ Step-by-Step Implementation Guide

### Phase 1: Module Structure Setup (Week 1)

#### Step 1.1: Create Module Directory

```bash
mkdir -p packages/cli/src/modules/social-auth/{providers,shared}
```

**Directory Structure:**
```
packages/cli/src/modules/social-auth/
├── social-auth.module.ts         # Module registration
├── social-auth.controller.ts     # OAuth callback endpoints
├── social-auth.service.ts        # Core social auth logic
├── social-auth.types.ts          # TypeScript interfaces
├── providers/
│   ├── google.provider.ts        # Google OAuth implementation
│   ├── github.provider.ts        # GitHub OAuth implementation
│   ├── apple.provider.ts         # Apple Sign In implementation
│   ├── microsoft.provider.ts     # Microsoft OAuth implementation
│   └── base.provider.ts          # Abstract base class
└── shared/
    ├── oauth-client.ts           # OAuth 2.0 client wrapper
    └── provider-registry.ts      # Dynamic provider discovery
```

#### Step 1.2: Create Configuration

**File:** `packages/@n8n/config/src/configs/social-auth.config.ts`

```typescript
import { Config, Env } from '../decorators';

@Config
export class SocialAuthConfig {
  /** Enable social authentication module */
  @Env('N8N_SOCIAL_AUTH_ENABLED')
  enabled: boolean = false;

  /** Callback URL base (e.g., https://your-n8n.com) */
  @Env('N8N_SOCIAL_AUTH_CALLBACK_BASE_URL')
  callbackBaseUrl: string = '';

  /** Google OAuth */
  @Env('N8N_GOOGLE_AUTH_ENABLED')
  googleEnabled: boolean = false;

  @Env('N8N_GOOGLE_CLIENT_ID')
  googleClientId: string = '';

  @Env('N8N_GOOGLE_CLIENT_SECRET')
  googleClientSecret: string = '';

  /** GitHub OAuth */
  @Env('N8N_GITHUB_AUTH_ENABLED')
  githubEnabled: boolean = false;

  @Env('N8N_GITHUB_CLIENT_ID')
  githubClientId: string = '';

  @Env('N8N_GITHUB_CLIENT_SECRET')
  githubClientSecret: string = '';

  /** Apple Sign In */
  @Env('N8N_APPLE_AUTH_ENABLED')
  appleEnabled: boolean = false;

  @Env('N8N_APPLE_CLIENT_ID')
  appleClientId: string = '';

  @Env('N8N_APPLE_TEAM_ID')
  appleTeamId: string = '';

  @Env('N8N_APPLE_KEY_ID')
  appleKeyId: string = '';

  @Env('N8N_APPLE_PRIVATE_KEY')
  applePrivateKey: string = '';

  /** Microsoft OAuth */
  @Env('N8N_MICROSOFT_AUTH_ENABLED')
  microsoftEnabled: boolean = false;

  @Env('N8N_MICROSOFT_CLIENT_ID')
  microsoftClientId: string = '';

  @Env('N8N_MICROSOFT_CLIENT_SECRET')
  microsoftClientSecret: string = '';
}
```

---

### Phase 2: Base Provider Implementation (Week 1-2)

#### Step 2.1: Abstract Base Provider

**File:** `packages/cli/src/modules/social-auth/providers/base.provider.ts`

```typescript
import type { Response } from 'express';

export interface SocialAuthProfile {
  providerId: string;       // Unique ID from provider
  email: string;            // User email (required)
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface OAuth2Tokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export abstract class BaseSocialAuthProvider {
  abstract providerType: 'google' | 'github' | 'apple' | 'microsoft';
  abstract displayName: string;

  /**
   * Generate authorization URL and redirect user to provider
   */
  abstract initiateLogin(res: Response): Promise<void>;

  /**
   * Handle OAuth callback, exchange code for tokens
   */
  abstract handleCallback(code: string, state: string): Promise<{
    profile: SocialAuthProfile;
    tokens: OAuth2Tokens;
  }>;

  /**
   * Generate CSRF state token (store in session/Redis)
   */
  protected generateState(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Validate state to prevent CSRF attacks
   */
  protected validateState(state: string, expectedState: string): boolean {
    return crypto.timingSafeEqual(
      Buffer.from(state),
      Buffer.from(expectedState)
    );
  }
}
```

#### Step 2.2: Google Provider Implementation

**File:** `packages/cli/src/modules/social-auth/providers/google.provider.ts`

```typescript
import { Service } from '@n8n/di';
import { BaseSocialAuthProvider, type SocialAuthProfile } from './base.provider';
import { SocialAuthConfig } from '@n8n/config';
import type { Response } from 'express';
import { OAuth2Client } from 'google-auth-library';

@Service()
export class GoogleAuthProvider extends BaseSocialAuthProvider {
  providerType = 'google' as const;
  displayName = 'Google';

  private oauth2Client: OAuth2Client;

  constructor(private readonly config: SocialAuthConfig) {
    super();

    this.oauth2Client = new OAuth2Client({
      clientId: config.googleClientId,
      clientSecret: config.googleClientSecret,
      redirectUri: `${config.callbackBaseUrl}/auth/google/callback`
    });
  }

  async initiateLogin(res: Response): Promise<void> {
    const state = this.generateState();
    // Store state in Redis/session (see social-auth.service.ts)

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['email', 'profile'],
      state,
      // PKCE for additional security
      code_challenge_method: 'S256'
    });

    res.redirect(authUrl);
  }

  async handleCallback(code: string, state: string): Promise<{
    profile: SocialAuthProfile;
    tokens: OAuth2Tokens;
  }> {
    // Exchange code for tokens
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);

    // Get user profile
    const ticket = await this.oauth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: this.config.googleClientId
    });

    const payload = ticket.getPayload()!;

    return {
      profile: {
        providerId: payload.sub,              // Google user ID
        email: payload.email!,
        firstName: payload.given_name,
        lastName: payload.family_name,
        avatarUrl: payload.picture
      },
      tokens: {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : undefined
      }
    };
  }
}
```

#### Step 2.3: GitHub Provider Implementation

**File:** `packages/cli/src/modules/social-auth/providers/github.provider.ts`

```typescript
import { Service } from '@n8n/di';
import { BaseSocialAuthProvider, type SocialAuthProfile } from './base.provider';
import { SocialAuthConfig } from '@n8n/config';
import type { Response } from 'express';

@Service()
export class GitHubAuthProvider extends BaseSocialAuthProvider {
  providerType = 'github' as const;
  displayName = 'GitHub';

  constructor(private readonly config: SocialAuthConfig) {
    super();
  }

  async initiateLogin(res: Response): Promise<void> {
    const state = this.generateState();

    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', this.config.githubClientId);
    authUrl.searchParams.set('redirect_uri',
      `${this.config.callbackBaseUrl}/auth/github/callback`);
    authUrl.searchParams.set('scope', 'user:email');
    authUrl.searchParams.set('state', state);

    res.redirect(authUrl.toString());
  }

  async handleCallback(code: string, state: string): Promise<{
    profile: SocialAuthProfile;
    tokens: OAuth2Tokens;
  }> {
    // Exchange code for access token
    const tokenResponse = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: this.config.githubClientId,
          client_secret: this.config.githubClientSecret,
          code,
          redirect_uri: `${this.config.callbackBaseUrl}/auth/github/callback`
        })
      }
    );

    const tokens = await tokenResponse.json();

    // Fetch user profile
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Accept': 'application/json'
      }
    });

    const user = await userResponse.json();

    // Fetch primary email if not public
    let email = user.email;
    if (!email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Accept': 'application/json'
        }
      });
      const emails = await emailsResponse.json();
      email = emails.find((e: any) => e.primary)?.email;
    }

    return {
      profile: {
        providerId: user.id.toString(),
        email,
        firstName: user.name?.split(' ')[0],
        lastName: user.name?.split(' ').slice(1).join(' '),
        avatarUrl: user.avatar_url
      },
      tokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token
      }
    };
  }
}
```

---

### Phase 3: Core Service & Controller (Week 2)

#### Step 3.1: Social Auth Service

**File:** `packages/cli/src/modules/social-auth/social-auth.service.ts`

```typescript
import { Service } from '@n8n/di';
import { AuthService } from '@/auth/auth.service';
import { UserRepository } from '@/databases/repositories/user.repository';
import { AuthIdentityRepository } from '@/databases/repositories/auth-identity.repository';
import { SocialAuthConfig } from '@n8n/config';
import type { BaseSocialAuthProvider } from './providers/base.provider';
import type { User } from '@/databases/entities/user';
import { UserError } from '@n8n/core';

@Service()
export class SocialAuthService {
  constructor(
    private readonly authService: AuthService,
    private readonly userRepository: UserRepository,
    private readonly authIdentityRepository: AuthIdentityRepository,
    private readonly config: SocialAuthConfig
  ) {}

  /**
   * Find or create user from social auth profile
   */
  async findOrCreateUserFromSocial(
    provider: BaseSocialAuthProvider,
    profile: SocialAuthProfile
  ): Promise<User> {
    // 1. Check if auth_identity already exists
    const authIdentity = await this.authIdentityRepository.findOne({
      where: {
        providerId: profile.providerId,
        providerType: provider.providerType
      },
      relations: ['user']
    });

    if (authIdentity) {
      // Existing user, return
      return authIdentity.user;
    }

    // 2. Check if user with this email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: profile.email.toLowerCase() }
    });

    if (existingUser) {
      // Link existing user to social provider
      await this.authIdentityRepository.save({
        userId: existingUser.id,
        providerId: profile.providerId,
        providerType: provider.providerType
      });

      return existingUser;
    }

    // 3. Create new user
    const newUser = await this.userRepository.save({
      email: profile.email.toLowerCase(),
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      password: null, // Social login users have no password
      roleSlug: 'global:member', // Default role
      isOwner: false
    });

    // 4. Create auth_identity link
    await this.authIdentityRepository.save({
      userId: newUser.id,
      providerId: profile.providerId,
      providerType: provider.providerType
    });

    return newUser;
  }

  /**
   * Get list of enabled social providers
   */
  getEnabledProviders(): string[] {
    const enabled: string[] = [];

    if (this.config.googleEnabled) enabled.push('google');
    if (this.config.githubEnabled) enabled.push('github');
    if (this.config.appleEnabled) enabled.push('apple');
    if (this.config.microsoftEnabled) enabled.push('microsoft');

    return enabled;
  }
}
```

#### Step 3.2: Social Auth Controller

**File:** `packages/cli/src/modules/social-auth/social-auth.controller.ts`

```typescript
import { Get, RestController } from '@/decorators';
import { SocialAuthService } from './social-auth.service';
import { AuthService } from '@/auth/auth.service';
import { GoogleAuthProvider } from './providers/google.provider';
import { GitHubAuthProvider } from './providers/github.provider';
import type { Response } from 'express';
import { UserError } from '@n8n/core';

@RestController('/auth')
export class SocialAuthController {
  constructor(
    private readonly socialAuthService: SocialAuthService,
    private readonly authService: AuthService,
    private readonly googleProvider: GoogleAuthProvider,
    private readonly githubProvider: GitHubAuthProvider
  ) {}

  /**
   * GET /auth/providers
   * Returns list of enabled social auth providers
   */
  @Get('/providers')
  async getProviders() {
    return {
      providers: this.socialAuthService.getEnabledProviders()
    };
  }

  /**
   * GET /auth/google
   * Initiates Google OAuth flow
   */
  @Get('/google')
  async googleLogin(res: Response) {
    await this.googleProvider.initiateLogin(res);
  }

  /**
   * GET /auth/google/callback
   * Handles Google OAuth callback
   */
  @Get('/google/callback')
  async googleCallback(req: any, res: Response) {
    try {
      const { code, state } = req.query;

      if (!code || !state) {
        throw new UserError('Missing OAuth parameters');
      }

      // Handle callback
      const { profile } = await this.googleProvider.handleCallback(
        code as string,
        state as string
      );

      // Find or create user
      const user = await this.socialAuthService.findOrCreateUserFromSocial(
        this.googleProvider,
        profile
      );

      // Issue session cookie
      this.authService.issueCookie(res, user, false);

      // Redirect to app
      return res.redirect('/');
    } catch (error) {
      return res.redirect('/login?error=oauth_failed');
    }
  }

  /**
   * GET /auth/github
   * Initiates GitHub OAuth flow
   */
  @Get('/github')
  async githubLogin(res: Response) {
    await this.githubProvider.initiateLogin(res);
  }

  /**
   * GET /auth/github/callback
   * Handles GitHub OAuth callback
   */
  @Get('/github/callback')
  async githubCallback(req: any, res: Response) {
    try {
      const { code, state } = req.query;

      if (!code || !state) {
        throw new UserError('Missing OAuth parameters');
      }

      const { profile } = await this.githubProvider.handleCallback(
        code as string,
        state as string
      );

      const user = await this.socialAuthService.findOrCreateUserFromSocial(
        this.githubProvider,
        profile
      );

      this.authService.issueCookie(res, user, false);

      return res.redirect('/');
    } catch (error) {
      return res.redirect('/login?error=oauth_failed');
    }
  }
}
```

---

### Phase 4: Frontend Integration (Week 3)

#### Step 4.1: Social Login Buttons Component

**File:** `packages/frontend/editor-ui/src/features/auth/components/SocialLoginButtons.vue`

```vue
<template>
  <div v-if="enabledProviders.length > 0" class="social-login">
    <div class="divider">
      <span>{{ $t('auth.orContinueWith') }}</span>
    </div>

    <div class="social-buttons">
      <button
        v-if="enabledProviders.includes('google')"
        @click="loginWith('google')"
        class="social-button google"
      >
        <img src="@/assets/icons/google.svg" alt="Google" />
        {{ $t('auth.continueWithGoogle') }}
      </button>

      <button
        v-if="enabledProviders.includes('github')"
        @click="loginWith('github')"
        class="social-button github"
      >
        <img src="@/assets/icons/github.svg" alt="GitHub" />
        {{ $t('auth.continueWithGitHub') }}
      </button>

      <button
        v-if="enabledProviders.includes('apple')"
        @click="loginWith('apple')"
        class="social-button apple"
      >
        <img src="@/assets/icons/apple.svg" alt="Apple" />
        {{ $t('auth.continueWithApple') }}
      </button>

      <button
        v-if="enabledProviders.includes('microsoft')"
        @click="loginWith('microsoft')"
        class="social-button microsoft"
      >
        <img src="@/assets/icons/microsoft.svg" alt="Microsoft" />
        {{ $t('auth.continueWithMicrosoft') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRestApi } from '@/composables/useRestApi';

const restApi = useRestApi();
const enabledProviders = ref<string[]>([]);

onMounted(async () => {
  try {
    const { providers } = await restApi.getSocialAuthProviders();
    enabledProviders.value = providers;
  } catch (error) {
    console.error('Failed to fetch social providers', error);
  }
});

const loginWith = (provider: string) => {
  // Redirect to OAuth initiation endpoint
  window.location.href = `/auth/${provider}`;
};
</script>

<style scoped>
.social-login {
  margin-top: var(--spacing--lg);
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: var(--spacing--md) 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--color--foreground);
}

.divider span {
  padding: 0 var(--spacing--sm);
  color: var(--color--text--tint-2);
  font-size: var(--font-size--xs);
}

.social-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--spacing--sm);
}

.social-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing--sm);
  padding: var(--spacing--sm) var(--spacing--md);
  border: 1px solid var(--color--foreground);
  border-radius: var(--radius);
  background: var(--color--background);
  color: var(--color--text);
  cursor: pointer;
  transition: all 0.2s;
}

.social-button:hover {
  background: var(--color--foreground--tint-1);
}

.social-button img {
  width: 20px;
  height: 20px;
}
</style>
```

#### Step 4.2: Add to Login Page

**File:** `packages/frontend/editor-ui/src/features/auth/views/Login.vue`

```vue
<template>
  <div class="login-page">
    <!-- Existing email/password form -->
    <form @submit.prevent="handleLogin">
      <!-- ... existing inputs ... -->
    </form>

    <!-- NEW: Social login buttons -->
    <SocialLoginButtons />
  </div>
</template>

<script setup lang="ts">
import SocialLoginButtons from '../components/SocialLoginButtons.vue';
// ... existing imports
</script>
```

#### Step 4.3: Add i18n Translations

**File:** `packages/@n8n/i18n/locales/en/index.json`

```json
{
  "auth": {
    "orContinueWith": "Or continue with",
    "continueWithGoogle": "Continue with Google",
    "continueWithGitHub": "Continue with GitHub",
    "continueWithApple": "Continue with Apple",
    "continueWithMicrosoft": "Continue with Microsoft"
  }
}
```

---

### Phase 5: Testing & Documentation (Week 4)

#### Step 5.1: Unit Tests

**File:** `packages/cli/test/unit/modules/social-auth/social-auth.service.test.ts`

```typescript
import { SocialAuthService } from '@/modules/social-auth/social-auth.service';
import { GoogleAuthProvider } from '@/modules/social-auth/providers/google.provider';
import type { SocialAuthProfile } from '@/modules/social-auth/providers/base.provider';

describe('SocialAuthService', () => {
  let service: SocialAuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockAuthIdentityRepository: jest.Mocked<AuthIdentityRepository>;

  beforeEach(() => {
    mockUserRepository = createMock<UserRepository>();
    mockAuthIdentityRepository = createMock<AuthIdentityRepository>();

    service = new SocialAuthService(
      /* ... inject mocks ... */
    );
  });

  describe('findOrCreateUserFromSocial', () => {
    it('should return existing user if auth_identity exists', async () => {
      const existingUser = { id: 'user-1', email: 'test@example.com' };
      mockAuthIdentityRepository.findOne.mockResolvedValue({
        userId: existingUser.id,
        providerId: 'google:123',
        providerType: 'google',
        user: existingUser
      });

      const provider = new GoogleAuthProvider(/* ... */);
      const profile: SocialAuthProfile = {
        providerId: 'google:123',
        email: 'test@example.com'
      };

      const result = await service.findOrCreateUserFromSocial(provider, profile);

      expect(result).toEqual(existingUser);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should link existing user if email matches', async () => {
      const existingUser = { id: 'user-1', email: 'test@example.com' };
      mockAuthIdentityRepository.findOne.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue(existingUser);

      const provider = new GoogleAuthProvider(/* ... */);
      const profile: SocialAuthProfile = {
        providerId: 'google:456',
        email: 'test@example.com'
      };

      const result = await service.findOrCreateUserFromSocial(provider, profile);

      expect(result).toEqual(existingUser);
      expect(mockAuthIdentityRepository.save).toHaveBeenCalledWith({
        userId: existingUser.id,
        providerId: 'google:456',
        providerType: 'google'
      });
    });

    it('should create new user if neither exists', async () => {
      const newUser = {
        id: 'user-2',
        email: 'new@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };

      mockAuthIdentityRepository.findOne.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue(newUser);

      const provider = new GoogleAuthProvider(/* ... */);
      const profile: SocialAuthProfile = {
        providerId: 'google:789',
        email: 'new@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = await service.findOrCreateUserFromSocial(provider, profile);

      expect(result).toEqual(newUser);
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockAuthIdentityRepository.save).toHaveBeenCalled();
    });
  });
});
```

#### Step 5.2: E2E Tests

**File:** `packages/testing/playwright/tests/social-auth.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Social Authentication', () => {
  test('should show social login buttons on login page', async ({ page }) => {
    await page.goto('/login');

    // Check if Google button is visible (if enabled)
    const googleButton = page.locator('button:has-text("Continue with Google")');
    await expect(googleButton).toBeVisible();
  });

  test('should redirect to Google OAuth on button click', async ({ page }) => {
    await page.goto('/login');

    const googleButton = page.locator('button:has-text("Continue with Google")');

    // Click button and wait for navigation
    await Promise.all([
      page.waitForNavigation(),
      googleButton.click()
    ]);

    // Should redirect to Google OAuth
    expect(page.url()).toContain('accounts.google.com');
  });

  // Note: Full OAuth flow testing requires test credentials
  // or mocking the OAuth provider
});
```

#### Step 5.3: Documentation

**File:** `packages/cli/src/modules/social-auth/README.md`

```markdown
# Social Authentication Module

## Overview
Enables users to log in using social identity providers (Google, GitHub, Apple, Microsoft).

## Configuration

### Environment Variables
```bash
# Enable module
N8N_SOCIAL_AUTH_ENABLED=true
N8N_SOCIAL_AUTH_CALLBACK_BASE_URL=https://your-n8n.com

# Google
N8N_GOOGLE_AUTH_ENABLED=true
N8N_GOOGLE_CLIENT_ID=your-google-client-id
N8N_GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub
N8N_GITHUB_AUTH_ENABLED=true
N8N_GITHUB_CLIENT_ID=your-github-client-id
N8N_GITHUB_CLIENT_SECRET=your-github-client-secret
```

### OAuth App Setup

#### Google
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `https://your-n8n.com/auth/google/callback`

#### GitHub
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Add callback URL: `https://your-n8n.com/auth/github/callback`

## Architecture

- **Modular**: All code isolated in `src/modules/social-auth/`
- **Feature Flag**: Disable via `N8N_SOCIAL_AUTH_ENABLED=false`
- **Provider Pattern**: Easy to add new providers

## Adding New Providers

1. Create `providers/new-provider.provider.ts` extending `BaseSocialAuthProvider`
2. Implement `initiateLogin()` and `handleCallback()`
3. Add config to `@n8n/config/src/configs/social-auth.config.ts`
4. Register provider in `social-auth.controller.ts`
5. Add frontend button to `SocialLoginButtons.vue`

## Security Considerations

- All providers use OAuth 2.0 Authorization Code flow
- CSRF protection via state parameter
- PKCE recommended for additional security
- Users created with `password: null` (social-only login)
```

---

## 🔄 Fork & Upstream Strategy

### Maintaining Your Fork with Social Login

#### Approach 1: Feature Branch (Recommended)

```bash
# Your fork structure
main (tracks upstream/master)
└── feature/social-auth (your custom feature)

# Workflow
1. Develop social auth in feature/social-auth branch
2. Keep main synced with upstream
3. Regularly rebase feature/social-auth onto main
4. Deploy from feature/social-auth

# Commands
git checkout main
git pull upstream master
git checkout feature/social-auth
git rebase main
```

**Pros:**
- ✅ Easy to sync with upstream
- ✅ Clear separation of custom code
- ✅ Can cherry-pick upstream fixes

**Cons:**
- ❌ Requires manual rebasing
- ❌ Risk of rebase conflicts

---

#### Approach 2: Modular Package (Best for Isolation)

```bash
# Create separate package
packages/@yourcompany/n8n-social-auth/
├── package.json
├── src/
│   ├── providers/
│   ├── social-auth.controller.ts
│   └── social-auth.service.ts
└── README.md

# Link to n8n via pnpm workspace
{
  "name": "n8n",
  "dependencies": {
    "@yourcompany/n8n-social-auth": "workspace:*"
  }
}
```

**Pros:**
- ✅ Complete isolation
- ✅ Zero conflicts with upstream
- ✅ Publishable to private npm registry

**Cons:**
- ❌ Requires module system understanding
- ❌ More complex build setup

---

## 📊 Merge Path Analysis

### Likelihood of Upstream Acceptance

| Aspect | Score | Notes |
|--------|-------|-------|
| **Feature Value** | 9/10 | High user demand for social login |
| **Code Quality** | 8/10 | If follows n8n patterns |
| **Modularity** | 9/10 | Isolated module, easy to review |
| **Testing** | 8/10 | If includes unit + E2E tests |
| **Documentation** | 9/10 | Clear setup instructions needed |
| **Enterprise Impact** | 6/10 | May conflict with SAML/LDAP offerings |

**Overall: 70-80% chance** if:
- Code follows n8n conventions
- No conflicts with enterprise features
- Comprehensive tests included
- Documentation is excellent

### Preparing for PR

**Pre-submission Checklist:**
- [ ] All code in `packages/cli/src/modules/social-auth/`
- [ ] Feature flag `N8N_SOCIAL_AUTH_ENABLED` works
- [ ] Zero modifications to core auth system
- [ ] Unit tests: >80% coverage
- [ ] E2E tests: Happy path + error cases
- [ ] Documentation: README + setup guide
- [ ] i18n: All strings translated
- [ ] TypeScript: No `any` types
- [ ] Linting: `pnpm lint` passes
- [ ] Build: `pnpm build` succeeds
- [ ] Tested on: SQLite, PostgreSQL, MySQL

---

## 🎯 Quick Start Checklist

### Week 1: Setup & Google Provider
- [ ] Create module directory structure
- [ ] Add configuration to `@n8n/config`
- [ ] Implement `BaseSocialAuthProvider`
- [ ] Implement `GoogleAuthProvider`
- [ ] Create `SocialAuthService`
- [ ] Create `SocialAuthController`

### Week 2: Additional Providers
- [ ] Implement `GitHubAuthProvider`
- [ ] Implement `AppleAuthProvider` (if needed)
- [ ] Implement `MicrosoftAuthProvider` (if needed)
- [ ] Add provider registry system

### Week 3: Frontend Integration
- [ ] Create `SocialLoginButtons.vue` component
- [ ] Integrate into login page
- [ ] Add i18n translations
- [ ] Test OAuth flow end-to-end

### Week 4: Testing & Documentation
- [ ] Write unit tests (>80% coverage)
- [ ] Write E2E tests
- [ ] Create README documentation
- [ ] Test on all databases
- [ ] Prepare PR (if submitting upstream)

---

## 🔒 Security Best Practices

1. **Never Log Tokens**: OAuth tokens should never appear in logs
2. **HTTPS Only**: Social login requires HTTPS (use ngrok for local dev)
3. **State Validation**: Always validate CSRF state parameter
4. **Email Verification**: Consider requiring email verification for new social users
5. **Account Linking**: Warn users before linking social account to existing email

---

**Guide Completed By:** Commander Agent
**Methodology:** BMAD Modular Development Approach
**Estimated Effort:** 4 weeks (1 developer)
**Risk Level:** Low (modular design minimizes risk)
