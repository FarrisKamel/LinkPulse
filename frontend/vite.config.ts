import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// Test config lives in vitest.config.ts (kept separate to avoid a Vite 8 /
// Vitest plugin-type clash).
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
