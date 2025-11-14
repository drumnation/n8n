/**
 * Unit test configuration for Node.js environments
 * Re-exports unit config but overrides environment to node
 */
import unitConfig from './configs/vitest/unit';
import {mergeConfig} from 'vitest/config.js';

export default mergeConfig(unitConfig, {
  test: {
    environment: 'node',
  },
});
