import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${process.env.VITE_PNAS_PORT || 8000}`,
        changeOrigin: true,
      },
      '/health': {
        target: `http://127.0.0.1:${process.env.VITE_PNAS_PORT || 8000}`,
        changeOrigin: true,
      },
      '/version': {
        target: `http://127.0.0.1:${process.env.VITE_PNAS_PORT || 8000}`,
        changeOrigin: true,
      }
    }
  },
  preview: {
    host: true,
    port: 5173
  }
})
