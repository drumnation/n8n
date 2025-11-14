/**
 * Test configuration presets
 * Reusable settings for consistent test configuration
 */

export * as coverage from './coverage.js';
export * as timeouts from './timeouts.js';
export * as pools from './pools.js';
export * as reporters from './reporters.js';

// Re-export commonly used items at top level
export {CoverageMultiplierReporter} from './reporters.js';
export {excludePatterns, includePatterns} from './coverage.js';
