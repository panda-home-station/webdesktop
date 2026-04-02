import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const truenasRemote = env.VITE_TRUENAS_REMOTE || 'localhost'

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@src': path.resolve(__dirname, './src'),
        '@api': path.resolve(__dirname, './src/api'),
      },
    },
    server: {
      host: true,
      port: 5173,
      strictPort: false,
      // Proxy TrueNAS API to the configured remote server
      proxy: {
        '/api': {
          target: `http://${truenasRemote}`,
          changeOrigin: true,
          ws: true, // Enable WebSocket proxying
        },
        '/_upload': {
          target: `http://${truenasRemote}`,
          changeOrigin: true,
        },
        '/_download': {
          target: `http://${truenasRemote}`,
          changeOrigin: true,
        },
      }
    },
    preview: {
      host: true,
      port: 5173
    }
  }
})
