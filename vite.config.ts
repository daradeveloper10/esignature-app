import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-netlify-toml',
      writeBundle() {
        try {
          const source = path.resolve(__dirname, 'netlify.toml')
          const dest = path.resolve(__dirname, 'dist/netlify.toml')
          
          if (existsSync(source)) {
            copyFileSync(source, dest)
            console.log('✅ netlify.toml copied to dist folder')
          } else {
            console.warn('⚠️ netlify.toml not found in project root')
          }
        } catch (error) {
          console.error('❌ Failed to copy netlify.toml:', error)
        }
      }
    }
  ],
  base: '/', // Change this line from './' to '/'
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})
