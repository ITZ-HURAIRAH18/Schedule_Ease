import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

const BACKEND_URL = process.env.VITE_BACKEND_URL || 'https://127.0.0.1:5001';

export default defineConfig({
  plugins: [react(), tailwindcss(), basicSsl()],
  server: {
    host: true,
    port: 5173,
    https: true,
    strictPort: false,
    open: false,
    proxy: {
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
        rejectUnauthorized: false,
      },
      '/api/socket.io': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
        ws: true,
        rejectUnauthorized: false,
      },
    },
  },
  define: {
    global: 'window',
  },
})
