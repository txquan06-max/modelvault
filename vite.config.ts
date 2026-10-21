import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    // 强制只使用一份 react
    dedupe: ['react', 'react-dom']
  },
  optimizeDeps: {
    // 强制预构建，防止多个实例
    include: ['react', 'react-dom', 'react-i18next', 'i18next']
  }
})