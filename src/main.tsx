import './i18n';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { StorageManager } from './core/StorageManager';
import { ErrorBoundary } from './ErrorBoundary';

// 🌟 判断 Tauri 环境
const isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__;

StorageManager.init().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );

  // ============================================
  // 🌟 Tauri 原生能力：自动更新 + 系统托盘
  // 仅在 Tauri 环境下执行
  // ============================================
  if (isTauri) {
    initTauriFeatures();
  }
});

async function initTauriFeatures() {
  try {
    // 1. 自动更新检测 (需要安装 @tauri-apps/plugin-updater 和 @tauri-apps/plugin-process)
    const { check } = await import('@tauri-apps/plugin-updater');
    const { relaunch } = await import('@tauri-apps/plugin-process');
    
    const update = await check();
    if (update) {
      const confirmed = window.confirm(
        `🎉 发现新版本 v${update.version}！\n\n更新内容：\n${update.body || '常规更新与 Bug 修复'}\n\n是否立即下载并安装？（约需 1-2 分钟）`
      );
      if (confirmed) {
        // 使用浏览器通知显示下载进度
        let downloaded = 0;
        let contentLength = 0;
        
        await update.downloadAndInstall((event) => {
          switch (event.event) {
            case 'Started':
              contentLength = event.data.contentLength || 0;
              console.log(`[Updater] Started downloading ${contentLength} bytes`);
              break;
            case 'Progress':
              downloaded += event.data.chunkLength;
              console.log(`[Updater] Downloaded ${downloaded} / ${contentLength}`);
              break;
            case 'Finished':
              console.log('[Updater] Download finished, installing...');
              break;
          }
        });
        
        await relaunch();
      }
    }
  } catch (err) {
    console.warn('[Tauri] Auto-update check skipped:', err);
  }

  try {
    // 2. 系统托盘 (需要配置 @tauri-apps/api 与 src-tauri/tauri.conf.json)
    // 在 Rust 侧通过 SystemTray 处理，此处仅作前端逻辑感知
    console.log('[Tauri] Desktop features initialized.');
  } catch (err) {
    console.warn('[Tauri] Tray features skipped:', err);
  }
}

// ============================================
// Service Worker 注册 (仅限非 Tauri 环境)
// Tauri 原生壳不需要离线缓存，避免二次缓存导致更新混乱
// ============================================
if ('serviceWorker' in navigator && !isTauri) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('SW registration failed: ', err);
    });
  });
}