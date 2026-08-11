import { defineConfig } from 'vitest/config'

// Vitest config, deliberately separate from vite.config.ts. No plugins here:
// Vite's built-in esbuild transforms the TSX for tests, so we avoid the
// plugin-type mismatch between the project's Vite 8 and Vitest's bundled Vite.
export default defineConfig({
  test: {
    // jsdom gives tests a browser-like DOM to render components into.
    environment: 'jsdom',
  },
})
