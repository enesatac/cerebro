import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

/** Runs the generators in scripts/ (not part of the test suite). */
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
  test: { include: ['scripts/**/*.gen.ts'], environment: 'node' },
});
