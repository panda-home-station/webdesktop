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
        '@src/components': path.resolve(__dirname, 'src/desktop/components'),
        '@src/sdk': path.resolve(__dirname, 'src/shared/sdk'),
        '@shared/sdk': path.resolve(__dirname, 'src/shared/sdk'),
        '@desktop/components': path.resolve(__dirname, 'src/desktop/components'),
        '@desktop/layouts': path.resolve(__dirname, 'src/desktop/layouts'),
        '@desktop/state': path.resolve(__dirname, 'src/desktop/state'),
        // TrueNAS source paths - point to directories
        '@truenas/api': path.resolve(__dirname, 'src/truenas/api'),
        '@truenas/stores': path.resolve(__dirname, 'src/shared/stores'),
        '@truenas/services': path.resolve(__dirname, 'src/truenas/services'),
        '@truenas/types': path.resolve(__dirname, 'src/shared/types'),
        '@truenas/utils': path.resolve(__dirname, 'src/shared/utils'),
        '@truenas/components': path.resolve(__dirname, 'src/truenas/components'),
        '@truenas/stores/storage-dashboard': path.resolve(__dirname, 'src/shared/stores/storage-dashboard'),
        '@truenas/stores/pool-manager': path.resolve(__dirname, 'src/shared/stores/pool-manager'),
        '@truenas/stores/disk': path.resolve(__dirname, 'src/shared/stores/disk'),
        '@truenas/stores/vdevs': path.resolve(__dirname, 'src/shared/stores/vdevs'),
        '@truenas/components/dashboard': path.resolve(__dirname, 'src/truenas/components/dashboard'),
        '@truenas/components/pool-manager': path.resolve(__dirname, 'src/truenas/components/pool-manager'),
        '@truenas/components/disk-manager': path.resolve(__dirname, 'src/truenas/components/disk-manager'),
        '@truenas/components/vdevs': path.resolve(__dirname, 'src/truenas/components/vdevs'),
        '@truenas/components/datasets': path.resolve(__dirname, 'src/truenas/components/datasets'),
        '@truenas/services/pool': path.resolve(__dirname, 'src/truenas/services/pool'),
        '@truenas/services/disk': path.resolve(__dirname, 'src/truenas/services/disk'),
        '@truenas/services/dataset': path.resolve(__dirname, 'src/truenas/services/dataset'),
        '@truenas/types/pool': path.resolve(__dirname, 'src/shared/types/pool-types'),
        '@truenas/types/disk': path.resolve(__dirname, 'src/shared/types/disk-types'),
        '@truenas/types/dataset': path.resolve(__dirname, 'src/shared/types/dataset-types'),
        '@truenas/types/storage': path.resolve(__dirname, 'src/shared/types/storage-types'),
        '@truenas/types/vdev-enum': path.resolve(__dirname, 'src/shared/types/vdev-enum-types'),
        '@truenas/types/vdev-status': path.resolve(__dirname, 'src/shared/types/vdev-status-enum'),
        '@truenas/types/dedup-enum': path.resolve(__dirname, 'src/shared/types/dedup-enum-types'),
        '@truenas/utils/storage': path.resolve(__dirname, 'src/shared/utils/storage.utils'),
        '@truenas/utils/topology': path.resolve(__dirname, 'src/shared/utils/topology.utils'),
        '@truenas/utils/dataset': path.resolve(__dirname, 'src/shared/utils/dataset.utils'),
        '@shared/stores': path.resolve(__dirname, 'src/shared/stores'),
        '@shared/types': path.resolve(__dirname, 'src/shared/types'),
        // App styles
        '@apps/system-settings/styles': path.resolve(__dirname, 'apps/system-settings/src/styles'),
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
        '/websocket/shell': {
          target: `http://${truenasRemote}`,
          changeOrigin: true,
          ws: true,
        },
      },
    },
    preview: {
      host: true,
      port: 5173,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      coverage: {
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/**',
          'src/test/**',
          '**/*.d.ts',
          '**/*.interface.ts',
          '**/*.enum.ts',
          'vite.config.ts',
        ],
      },
    },
  };
});
