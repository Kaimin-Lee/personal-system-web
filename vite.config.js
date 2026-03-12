import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:40910', // 确保这里的端口是你后端的真实端口
        changeOrigin: true
      }
    }
  }
})