import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  base: './',  // GitHub Pages compatibility
  define: {
    __DEV__: JSON.stringify(mode !== 'production'),
  },
  build: {
    target: ['es2020', 'chrome111', 'firefox114', 'safari16.4', 'edge111'],
    outDir: 'dist',
  },
  test: {
    include: ['src/__tests__/**/*.test.ts'],
  },
}));
