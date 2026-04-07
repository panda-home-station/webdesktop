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
        '@truenas/stores/storage-dashboard': path.resolve(__dirname, 'src/truenas/stores/storage-dashboard.store'),
        '@truenas/stores/pool-manager': path.resolve(__dirname, 'src/truenas/stores/pool-manager.store'),
        '@truenas/stores/disk': path.resolve(__dirname, 'src/truenas/stores/disk.store'),
        '@truenas/stores/vdevs': path.resolve(__dirname, 'src/truenas/stores/vdevs.store'),
        '@truenas/components/dashboard': path.resolve(__dirname, 'src/truenas/components/dashboard'),
        '@truenas/components/pool-manager': path.resolve(__dirname, 'src/truenas/components/pool-manager'),
        '@truenas/components/disk-manager': path.resolve(__dirname, 'src/truenas/components/disk-manager'),
        '@truenas/components/vdevs': path.resolve(__dirname, 'src/truenas/components/vdevs'),
        '@truenas/components/datasets': path.resolve(__dirname, 'src/truenas/components/datasets'),
        '@truenas/services/pool': path.resolve(__dirname, 'src/truenas/services/pool.service'),
        '@truenas/services/disk': path.resolve(__dirname, 'src/truenas/services/disk.service'),
        '@truenas/services/dataset': path.resolve(__dirname, 'src/truenas/services/dataset.service'),
        '@truenas/types/pool': path.resolve(__dirname, 'src/truenas/types/pool-types'),
        '@truenas/types/disk': path.resolve(__dirname, 'src/truenas/types/disk-types'),
        '@truenas/types/dataset': path.resolve(__dirname, 'src/truenas/types/dataset-types'),
        '@truenas/types/storage': path.resolve(__dirname, 'src/truenas/types/storage-types'),
        '@truenas/types/vdev-enum': path.resolve(__dirname, 'src/truenas/types/vdev-enum-types'),
        '@truenas/types/vdev-status': path.resolve(__dirname, 'src/truenas/types/vdev-status-enum'),
        '@truenas/types/dedup-enum': path.resolve(__dirname, 'src/truenas/types/dedup-enum-types'),
        '@truenas/utils/storage': path.resolve(__dirname, 'src/truenas/utils/storage.utils'),
        '@truenas/utils/topology': path.resolve(__dirname, 'src/truenas/utils/topology.utils'),
        '@truenas/utils/dataset': path.resolve(__dirname, 'src/truenas/utils/dataset.utils'),
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
});
