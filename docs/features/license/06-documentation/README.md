# License Management Module

## Overview

The License module manages n8n enterprise licensing, feature activation, and compliance monitoring. It validates license keys, enforces feature restrictions, and tracks usage against licensed limits.

**Module Path**: `packages/cli/src/license/`

## Core Components

### License Manager
- License key validation
- Feature flag activation
- Usage tracking
- Expiration monitoring

### License Features
```typescript
interface LicenseFeatures {
  sso: boolean;
  ldap: boolean;
  advancedPermissions: boolean;
  externalSecrets: boolean;
  workflowHistory: boolean;
  debugInEditor: boolean;
  binaryDataS3: boolean;
  multipleMainInstances: boolean;
  variables: boolean;
  sourceControl: boolean;
  auditLogs: boolean;
  workflowSharing: boolean;
}
```

## License Validation
```typescript
// Check license validity
const isValid = await licenseManager.validate();

// Check specific feature
const hasSSO = await licenseManager.hasFeature('sso');

// Get usage metrics
const usage = await licenseManager.getUsage();
```

## Configuration
```bash
N8N_LICENSE_KEY=YOUR_LICENSE_KEY
N8N_LICENSE_ACTIVATION_KEY=ACTIVATION_KEY
N8N_LICENSE_SERVER_URL=https://license.n8n.io
```

## CLI Commands
```bash
# Show license info
n8n license:info

# Clear license
n8n license:clear

# Activate license
n8n license:activate --key=LICENSE_KEY
```

## Best Practices
1. Store license keys securely
2. Monitor expiration dates
3. Track feature usage
4. Plan for license renewal
5. Test in staging first