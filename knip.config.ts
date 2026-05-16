import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  project: ['src/**/*.{ts,tsx}'],
  exclude: ['duplicates'],
};

export default config;
