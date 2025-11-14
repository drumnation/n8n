/**
 * Playwright test configuration for browser E2E tests
 * - Extends unified base configuration
 * - Multi-browser testing with desktop and mobile viewports
 * - Visual regression and coverage support
 */

import {
  createPlaywrightConfig,
  browserProjects,
  webServerPresets,
} from './base';

export default createPlaywrightConfig('browser-e2e', {
  testDir: './tests/e2e',
  testMatch: [
    '**/*.e2e.test.ts',
    '**/*.e2e.spec.ts',
    '**/e2e/**/*.test.ts',
    '**/e2e/**/*.spec.ts',
  ],
  baseURL: process.env['TEST_BASE_URL'] || (process.env.PORT ? `http://localhost:${process.env.PORT}` : 'http://localhost:3000'),
  projects: [
    browserProjects.chromium,
    browserProjects.firefox,
    browserProjects.webkit,
    browserProjects.mobile.chrome,
    browserProjects.mobile.safari,
  ],
  webServer: process.env['TEST_BASE_URL']
    ? undefined
    : webServerPresets.dev(parseInt(process.env.PORT || '3000')),
});
