/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rolldownOptions: {
      output: {
        // Long-lived vendor chunks: libraries change far less often than app code, so they stay
        // cached across deploys, and no single chunk grows past the 500 kB warning.
        codeSplitting: {
          groups: [
            { name: 'vendor-takeoff', test: /node_modules[\\/]@takeoff-/ },
            {
              name: 'vendor-react',
              test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/,
            },
            { name: 'vendor', test: /node_modules/ },
          ],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.test.{ts,tsx}'],
    // Route-level tests render the whole app and lazy-load pages; on a cold, shared CI runner
    // they take several times longer than locally. A generous ceiling avoids false timeouts
    // without hiding real hangs.
    testTimeout: 15_000,
  },
});
