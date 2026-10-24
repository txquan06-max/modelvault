import './i18n';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { StorageManager } from './core/StorageManager';
import { ErrorBoundary } from './ErrorBoundary';

const isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__;

StorageManager.init().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );

  if (isTauri) {
    initTauriFeatures();
  }
});

async function initTauriFeatures() {
  try {
    const { check } = await import('@tauri-apps/plugin-updater');
    const update = await check();
    
    if (update) {
      // 🌟 红线遵守：绝对不用 window.confirm，改为向全局派发事件，由 App.tsx 渲染自定义弹窗
      window.dispatchEvent(new CustomEvent('tauri-update-available', { detail: update }));
    }
  } catch (err) {
    console.warn('[Tauri] Auto-update check skipped:', err);
  }
}

// Service Worker 注册 (仅限非 Tauri 环境)
if ('serviceWorker' in navigator && !isTauri) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('SW registration failed: ', err);
    });
  });
}