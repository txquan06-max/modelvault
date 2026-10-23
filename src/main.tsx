import './i18n';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { StorageManager } from './core/StorageManager';
import { ErrorBoundary } from './ErrorBoundary';

StorageManager.init().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
});

// ============================================
// 基础 Service Worker 注册
// ⚠️ 这里【只注册，不处理更新】
//   更新监听、提示条 UI、SKIP_WAITING 逻辑全部在 App.tsx 中处理
//   这样避免了"检测到新版本就自动 reload 打断用户专注"的旧问题
// ============================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('SW registration failed: ', err);
    });
  });
}