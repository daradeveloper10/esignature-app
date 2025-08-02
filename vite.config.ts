import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync } from 'fs'
import { resolve } from 'path'

export default defineConfig({
  root: './',
  plugins: [
    react(),
    {
      name: 'copy-netlify-toml',
      writeBundle() {
        try {
          const source = resolve('netlify.toml')
          const dest = resolve('dist/netlify.toml')
          
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
  base: '/',
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
