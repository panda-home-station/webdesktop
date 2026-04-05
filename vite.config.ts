import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const truenasRemote = env.VITE_TRUENAS_REMOTE || 'localhost'
  return {
    plugins: [react()],
    resolve: {
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.service.ts', '.store.ts'],
      alias: {
        // Root src paths
        '@src': path.resolve(__dirname, 'src'),
        // TrueNAS source paths - point to directories
        '@truenas/api': path.resolve(__dirname, 'src/truenas/api'),
        '@truenas/stores': path.resolve(__dirname, 'src/truenas/stores'),
        '@truenas/services': path.resolve(__dirname, 'src/truenas/services'),
        '@truenas/types': path.resolve(__dirname, 'src/truenas/types'),
        '@truenas/utils': path.resolve(__dirname, 'src/truenas/utils'),
        '@truenas/components': path.resolve(__dirname, 'src/truenas/components'),
      },
    },
    server: {
      host: true,
      port: 5173,
      strictPort: false,
      proxy: {
        '/api': {
          target: `http://${truenasRemote}`,
          changeOrigin: true,
          ws: true,
        },
        '/_upload': {
          target: `http://${truenasRemote}`,
          changeOrigin: true,
        },
        '/_download': {
          target: `http://${truenasRemote}`,
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: true,
      port: 5173,
    },
  };
})
