import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/dev/',
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          console.log(`[Vite Proxy] Redirigiendo: ${path} → http://localhost:3001${path}`);
          return path;
        },
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.error('[Vite Proxy] ❌ Error:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[Vite Proxy] 📤 Request: ${req.method} ${req.url} → http://localhost:3001${req.url}`);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log(`[Vite Proxy] 📥 Response: ${proxyRes.statusCode} from ${req.url}`);
          });
        }
      }
    }
  }
})
