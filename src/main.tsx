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
    // 延迟 5 秒再检查更新，避免抢首屏资源 / 阻塞 UI 初始化
    setTimeout(() => {
      checkForUpdates().catch((err) => {
        // 静默失败：离线、GitHub 无更新 JSON、pubkey 未配置等都会走到这里
        console.warn('[Tauri] Auto-update check skipped:', err);
      });
    }, 5000);
  }
});

/**
 * 检查更新（可被手动触发，如「个人中心 → 检查更新」按钮）
 * - 有更新时派发 'tauri-update-available' 事件，App.tsx 弹窗展示
 * - 无更新时返回 null
 */
async function checkForUpdates() {
  if (!isTauri) return null;
  try {
    const { check } = await import('@tauri-apps/plugin-updater');
    const update = await check();
    if (update) {
      console.log(`[Tauri] Update available: v${update.version}`);
      // 派发事件给 App.tsx 的更新弹窗
      window.dispatchEvent(new CustomEvent('tauri-update-available', { detail: update }));
    } else {
      console.log('[Tauri] No updates available');
    }
    return update;
  } catch (err: any) {
    // 明确区分错误类型，方便排查（不影响应用运行）
    const msg = err?.message || String(err);
    if (msg.includes('pubkey') || msg.includes('signature')) {
      console.error(
        '[Tauri] ❌ Updater 配置错误：pubkey 未正确配置。\n' +
        '请参考 tauri.conf.json 里的 plugins.updater.pubkey 字段。'
      );
    } else if (msg.includes('404') || msg.includes('Not Found')) {
      console.warn('[Tauri] 更新清单 URL 不存在（可能是首次发布，还没上传 latest.json）');
    } else if (msg.includes('network') || msg.includes('fetch')) {
      console.warn('[Tauri] 网络错误（可能是离线）');
    } else {
      console.warn('[Tauri] Update check failed:', msg);
    }
    throw err;
  }
}

// 暴露给全局，方便后续在「个人中心」加「检查更新」按钮：
//   window.__checkForUpdates?.()
if (typeof window !== 'undefined') {
  (window as any).__checkForUpdates = () => {
    checkForUpdates().catch(() => {});
  };
}

// Service Worker 注册 (仅限非 Tauri 环境)
if ('serviceWorker' in navigator && !isTauri) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('SW registration failed: ', err);
    });
  });
}