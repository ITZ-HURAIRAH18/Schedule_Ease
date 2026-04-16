import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [react(), tailwindcss(), basicSsl()],
  server: {
    host: true, // ✅ Correct place for host setting
    port: 5173, // ✅ Explicit port to avoid conflicts
    https: true, // ✅ Enable HTTPS for camera/mic access on mobile
    strictPort: false, // ✅ Allow port fallback if 5173 is in use
    open: false, // ✅ Don't auto-open browser (let user control)
    // ✅ Proxy API requests to backend to avoid CORS issues
    proxy: {
      '/api': {
        target: 'http://localhost:5002', // Backend HTTP fallback server
        changeOrigin: true,
        secure: false,
        rejectUnauthorized: false,
      },
      '/socket.io': {
        target: 'http://localhost:5002', // Backend HTTP fallback server for Socket.IO
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket proxying
        rejectUnauthorized: false,
      },
    },
  },
  define: {
    global: 'window', // ✅ Fix "global is not defined" error for browser builds
  },
})
