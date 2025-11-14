// Re-export common utilities and types
export {timing} from './timing.js';
export * from './themes.js';
export * from './types.js';

// For apps that need environment detection, import from specific endpoints:
// - '@kit/logger/node' for Node.js apps
// - '@kit/logger/browser' for browser apps
// - '@kit/logger/react' for React components
