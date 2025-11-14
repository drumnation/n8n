import {createLogger} from './src/node.js';
import {timing} from './src/timing.js';
import type {Logger} from './src/types.js';

// Example 1: Basic logger with different themes
export function basicThemeExamples() {
  console.log('=== Theme Examples ===');

  // Dracula theme
  const draculaLogger = createLogger({
    theme: 'dracula',
    scope: 'Dracula',
    level: 'debug',
  });

  draculaLogger.error('Error message with Dracula theme');
  draculaLogger.warn('Warning message');
  draculaLogger.info('Info message');
  draculaLogger.debug('Debug message');
  draculaLogger.trace('Trace message');

  // Nord theme
  const nordLogger = createLogger({
    theme: 'nord',
    scope: 'Nord',
    level: 'debug',
  });

  nordLogger.info('Clean Nordic design theme');
  nordLogger.debug('Perfect for Arctic development environments');

  // Monochrome for CI/CD
  const ciLogger = createLogger({
    theme: 'monochrome',
    scope: 'CI',
    level: 'info',
  });

  ciLogger.info('CI/CD friendly monochrome output');
  ciLogger.warn('Build warning detected');
}

// Example 2: Environment variable configuration
export function environmentConfigExamples() {
  console.log('=== Environment Configuration ===');

  // Node.js environment variables:
  // LOG_LEVEL=debug LOG_THEME=solarized npm run dev
  const envLogger = createLogger({scope: 'EnvConfig'});
  envLogger.info('Logger configured via environment variables');

  // Browser environment variables (Vite):
  // VITE_LOG_LEVEL=debug VITE_LOG_THEME=gruvbox npm run dev
  envLogger.debug('Browser logger uses VITE_ prefixed variables');
}

// Example 3: Structured logging with metadata
export function structuredLoggingExamples() {
  console.log('=== Structured Logging ===');

  const apiLogger = createLogger({
    scope: 'API',
    theme: 'nightowl',
  });

  // Request logging
  apiLogger.info('Incoming HTTP request', {
    method: 'GET',
    url: '/api/accounts',
    userAgent: 'Mozilla/5.0...',
    ip: '192.168.1.100',
    requestId: 'req-123456',
  });

  // Database operation
  apiLogger.debug('Database query executed', {
    operation: 'SELECT',
    table: 'accounts',
    duration: '45ms',
    rowCount: 12,
    requestId: 'req-123456',
  });

  // Error with context
  apiLogger.error('Payment processing failed', {
    userId: 'user-789',
    amount: 150.0,
    currency: 'USD',
    error: 'Insufficient funds',
    requestId: 'req-123456',
  });
}

// Example 4: Child loggers for context propagation
export function childLoggerExamples() {
  console.log('=== Child Loggers ===');

  const baseLogger = createLogger({
    scope: 'UserService',
    theme: 'gruvbox',
  });

  // Create child logger with user context
  const userLogger = baseLogger.child({
    userId: 'user-456',
    requestId: 'req-789',
  });

  userLogger.info('User authentication started');
  userLogger.debug('Checking user credentials');

  // Create nested child for specific operation
  const authLogger = userLogger.child({
    operation: 'two-factor-auth',
  });

  authLogger.info('2FA token generated');
  authLogger.warn('2FA attempt from new device');
}

// Example 5: Performance monitoring with timing wrapper
export async function timingExamples() {
  console.log('=== Timing Examples ===');

  const perfLogger = createLogger({
    scope: 'Performance',
    theme: 'solarized',
    level: 'debug',
  });

  // External API call timing
  const plaidData = await timing(
    perfLogger,
    'plaid.getAccounts',
    async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 150));
      return {accounts: [{id: '1', name: 'Checking'}]};
    },
    {userId: 'user-123', itemId: 'item-456'},
  );

  // Database operation timing
  const dbResult = await timing(
    perfLogger,
    'db.findTransactions',
    async () => {
      // Simulate database query
      await new Promise((resolve) => setTimeout(resolve, 600)); // Slow query
      return {transactions: [], count: 0};
    },
    {userId: 'user-123', dateRange: '30d'},
  );

  console.log('Results:', {plaidData, dbResult});
}

// Example 6: Performance-conscious logging
export function performanceExamples() {
  console.log('=== Performance Patterns ===');

  const logger = createLogger({
    scope: 'HighPerf',
    level: 'info', // Set to info to skip expensive debug calls
  });

  // Check log level before expensive operations
  if (logger.isLevelEnabled('debug')) {
    const expensiveData = JSON.stringify({
      largeObject: 'expensive to serialize',
      computedValue: Math.random() * 1000,
    });
    logger.debug('Expensive debug information', {data: expensiveData});
  }

  // Regular logging without checks
  logger.info('Regular operation completed', {
    result: 'success',
    duration: '50ms',
  });
}

// Example 7: React integration patterns
export function reactIntegrationExamples() {
  console.log('=== React Integration Examples ===');

  // App.tsx setup
  const appSetupCode = `
import { LoggerProvider } from '@kit/logger/react';

function App() {
  return (
    <LoggerProvider theme="nord" level="debug">
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </Router>
    </LoggerProvider>
  );
}`;

  // Component usage
  const componentUsageCode = `
import { useLogger } from '@kit/logger/react';

function Dashboard() {
  const logger = useLogger();

  useEffect(() => {
    logger.info('Dashboard mounted', { userId: user.id });
    
    return () => {
      logger.debug('Dashboard unmounted');
    };
  }, [logger]);

  const handleAction = async () => {
    const actionLogger = logger.child({ action: 'submit-form' });
    
    try {
      actionLogger.debug('Form submission started');
      await submitForm();
      actionLogger.info('Form submitted successfully');
    } catch (error) {
      actionLogger.error('Form submission failed', { error: error.message });
    }
  };

  return <div>Dashboard Content</div>;
}`;

  console.log('React setup example:', appSetupCode);
  console.log('Component usage example:', componentUsageCode);
}

// Example 8: Backend server integration
export function backendIntegrationExamples() {
  console.log('=== Backend Integration Examples ===');

  const expressMiddlewareCode = `
import { createLogger } from '@kit/logger/node';
import { timing } from '@kit/logger/timing';

const logger = createLogger({ 
  scope: 'API',
  theme: process.env.NODE_ENV === 'production' ? 'monochrome' : 'dracula'
});

// Request logger middleware
app.use((req, res, next) => {
  const requestId = generateUUID();
  req.requestId = requestId;
  req.logger = logger.child({ requestId, scope: 'HTTP' });

  req.logger.info('Request started', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    req.logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: duration + 'ms'
    });
  });

  next();
});

// Service function with timing
async function getAccountData(userId: string, logger: Logger) {
  return timing(
    logger,
    'plaid.getAccounts',
    async () => {
      const response = await plaidClient.accountsGet({
        access_token: accessToken
      });
      return response.data;
    },
    { userId, service: 'plaid' }
  );
}`;

  console.log('Express middleware example:', expressMiddlewareCode);
}

// Example 9: Custom theme definition
export function customThemeExamples() {
  console.log('=== Custom Theme Examples ===');

  // Note: Custom themes would require extending the themes.ts file
  const customThemeCode = `
// In themes.ts, you could add:
export const themes = {
  ...existingThemes,
  cyberpunk: {
    error: '#ff0040',
    warn: '#ffaa00',
    info: '#00ffaa',
    debug: '#0080ff',
    trace: '#aa00ff',
    fatal: '#ff4080',
    timestamp: '#808080',
    scope: '#ffffff',
  },
};

// Usage:
const cyberpunkLogger = createLogger({ 
  theme: 'cyberpunk',
  scope: 'Matrix'
});`;

  console.log('Custom theme definition:', customThemeCode);
}

// Example 10: CI/CD and monitoring patterns
export function cicdExamples() {
  console.log('=== CI/CD and Monitoring Examples ===');

  const ciLogger = createLogger({
    theme: 'monochrome', // No colors for CI logs
    scope: 'CI',
    level: 'info', // Reduce verbosity in CI
  });

  ciLogger.info('Build started', {
    branch: 'main',
    commit: 'abc123',
    buildNumber: '456',
  });

  ciLogger.warn('Test coverage below threshold', {
    current: 78.5,
    required: 80,
    diff: -1.5,
  });

  ciLogger.error('Deployment failed', {
    stage: 'production',
    reason: 'Health check timeout',
    rollback: true,
  });
}

// Run all examples
export async function runAllExamples() {
  basicThemeExamples();
  environmentConfigExamples();
  structuredLoggingExamples();
  childLoggerExamples();
  await timingExamples();
  performanceExamples();
  reactIntegrationExamples();
  backendIntegrationExamples();
  customThemeExamples();
  cicdExamples();
}
