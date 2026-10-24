import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    // 把所有的 JS、CSS、图片（小于此大小的）全部转成 Base64 塞进 HTML 里
    assetsInlineLimit: 100000000, 
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
  },
});