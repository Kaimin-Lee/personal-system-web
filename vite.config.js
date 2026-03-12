import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url' // 1. 引入 node 的 URL 解析模块

export default defineConfig({
  plugins: [vue()],
  
  // 2. 增加 resolve.alias 配置，让 vite 认识 @ 符号
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:40910',
        changeOrigin: true
      }
    }
  }
})