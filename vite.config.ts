import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  base: './',  // GitHub Pages compatibility
  define: {
    __DEV__: JSON.stringify(mode !== 'production'),
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
  test: {
    include: ['src/__tests__/**/*.test.ts'],
  },
}));
