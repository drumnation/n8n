# Security Audit Module

## Overview

The Security Audit module performs automated security scanning, vulnerability detection, and compliance checking across n8n workflows, credentials, and configurations.

**Module Path**: `packages/cli/src/security-audit/`

## Core Components

### Security Scanner
- Workflow vulnerability scanning
- Credential exposure detection
- Configuration audit
- Dependency vulnerability checks

## Audit Categories
```typescript
interface AuditCategories {
  credentials: {
    exposed: boolean;
    weakEncryption: boolean;
    expired: boolean;
  };
  workflows: {
    sqlInjection: boolean;
    commandInjection: boolean;
    insecureDeserialization: boolean;
  };
  configuration: {
    weakPasswords: boolean;
    missingEncryption: boolean;
    insecureDefaults: boolean;
  };
}
```

## CLI Commands
```bash
# Run security audit
n8n audit --categories=credentials,workflows

# Generate risk report
n8n audit --risk-report --output=audit.json
```

## Best Practices
1. Run audits regularly
2. Fix critical issues immediately
3. Monitor for new vulnerabilities
4. Keep dependencies updated
5. Document security policies