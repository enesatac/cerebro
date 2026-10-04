/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // With VITE_DATA_SOURCE=http the dev server forwards the API (and the SSO round trip) to
  // the API (../backend), so the browser sees one origin and the session cookie just works.
  const target =
    loadEnv(mode, process.cwd(), 'CEREBRO_').CEREBRO_API_TARGET ?? 'http://localhost:8080';
  const proxy = { target, changeOrigin: false };
  return {
    plugins: [react()],
    server: {
      proxy: { '/api': proxy, '/oauth2': proxy, '/login/oauth2': proxy },
    },
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
  };
});
