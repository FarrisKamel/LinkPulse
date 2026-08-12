import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// Test config lives in vitest.config.ts (kept separate to avoid a Vite 8 /
// Vitest plugin-type clash).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Proxy API calls to the backend so the browser makes same-origin
    // requests (no CORS). Target is overridable for Docker, where the backend
    // is reachable as http://backend:8000.
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
