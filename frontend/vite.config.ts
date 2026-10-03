import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// In dev, /api and /media are proxied to the FastAPI backend so the browser
// only ever talks to one origin.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '..', '')
  const backend = env.BACKEND_URL || 'http://localhost:8000'
  return {
    plugins: [react(), tailwindcss()],
    envDir: '..',
    server: {
      port: 5173,
      proxy: {
        '/api': backend,
        '/media': backend,
      },
    },
  }
})
