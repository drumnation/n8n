# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2025-10-21

### Added

- Initial documented release of universal logger package
- Node.js logger implementation with Pino
- Browser logger implementation with console fallback
- React integration with hooks and context
- Structured logging with scope support
- Multiple log levels: silent, error, warn, info, debug, trace
- Environment-aware log level configuration
- `LOG_LEVEL` environment variable for Node.js
- `VITE_LOG_LEVEL` environment variable for browser
- `createLogger` factory function for Node.js
- `createLogger` factory function for browser
- `useLogger` React hook for component logging
- `LoggerProvider` React context provider
- Child logger support with additional context
- Performance-optimized level checking with `isLevelEnabled`
- Request correlation and session tracking support
- TypeScript type definitions for all logging functions
- Pino pretty printing for development
- Structured metadata support for all log levels
- Error stack trace logging
- Subpath exports for node, browser, react, and types
- Integration with `@kit/env-loader` for configuration
- Automatic environment detection (development vs production)
- Default log levels: info (development), error (production)
- Zero-dependency browser implementation
- Comprehensive TypeScript types
- ESLint configuration
- Prettier configuration
- Vitest for testing
- Test coverage support

### Configuration

- Environment-based log level control
- Configurable scope for logger instances
- Optional context metadata for child loggers
- Performance optimizations for production
- Silent mode for testing

[Unreleased]: https://github.com/scala/content-manager-express/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/scala/content-manager-express/releases/tag/v1.1.0
