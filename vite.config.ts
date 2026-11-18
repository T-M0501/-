import { defineConfig } from 'vitest/config';

// GitHub Pages はサブパス配信になるため、相対パスでビルドする
export default defineConfig({
  base: './',
  build: {
    chunkSizeWarningLimit: 2000,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
