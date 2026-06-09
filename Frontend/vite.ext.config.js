// vite.ext.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'
import tailwindcss from '@tailwindcss/vite'


export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
    tailwindcss(),
  ],
  build:{
    outDir: 'ext_build'
  },
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    hmr: {
        host: 'localhost',
        port: 5173,
        protocol: 'ws' // Crucial for CRXJS development mode
      },
    cors: true 
  }
  
})