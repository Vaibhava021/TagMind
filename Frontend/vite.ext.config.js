// // vite.ext.config.js 
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    // crx({
    //   manifest,
    //   contentScripts: {
    //     injectCss: true,
    //   }
    // }),
    crx({
      manifest
    }), 
    tailwindcss(),
  ],

  // resolve: {
  //   alias: {
  //     'react-router-dom': resolve(
  //       __dirname,
  //       'src/stubs/react-router-dom-stub.js'
  //     ),
  //   }
  // },

  build: {
    outDir: 'ext_build',
  },

  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
})