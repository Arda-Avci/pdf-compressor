import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3020,
    fs: {
      allow: ['..'],
    },
    proxy: {
      '/api': 'http://localhost:3021',
    },
  },
})
