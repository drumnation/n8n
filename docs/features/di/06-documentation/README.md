# Dependency Injection Module

## Overview

The DI module (@n8n/di) provides inversion of control and dependency injection capabilities for n8n, enabling loose coupling, better testability, and modular architecture through container-based service management.

**Module Path**: `packages/@n8n/di/`

## Core Components

### Container
- Service registration
- Dependency resolution
- Lifecycle management
- Scope handling

## Service Registration
```typescript
// Register service
@Service()
export class WorkflowService {
  constructor(
    private readonly db: DatabaseService,
    private readonly cache: CacheService
  ) {}
}

// Register with token
Container.set('ConfigService', new ConfigService());
```

## Dependency Injection
```typescript
// Constructor injection
@Service()
class MyService {
  constructor(
    @Inject() private workflowService: WorkflowService
  ) {}
}

// Property injection
@Service()
class MyService {
  @Inject('ConfigService')
  private config: ConfigService;
}
```

## Best Practices
1. Use constructor injection preferably
2. Register services at startup
3. Avoid circular dependencies
4. Use interfaces for abstraction
5. Scope services appropriately