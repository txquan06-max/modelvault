// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// 如果你还用了 vite-plugin-singlefile，也可以保留
// import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [
    react(),
    // viteSingleFile()
  ],
  // 🌟 核心修复：配置 server.watch.ignored
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      // 明确忽略 src-tauri 目录，避免监视 Rust 编译产物
      ignored: ['**/src-tauri/**'],
    },
  },
  // ... 其他配置（build, envPrefix 等）
});