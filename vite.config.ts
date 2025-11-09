import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, "src", "webapp"),
  server: {
    host: true,
    port: 5175,
    strictPort: true,
    allowedHosts: true,
    proxy: { "/api": { target: "http://localhost:3000", changeOrigin: true } }
  },
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true
  }
})
