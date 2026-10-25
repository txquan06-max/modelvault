import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * 启动页
 * - 图标：使用应用 logo `/icon-512.png`，加载失败降级为 emoji
 * - 副标题：t('splash_waking')（语言包最后一批补 key）
 * - 逻辑：1.5s 后自动淡出 → onFinish()
 */
export const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const { t } = useTranslation();
  const [fadeOut, setFadeOut] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // 使用 useRef 保存回调，防止父组件重渲染导致倒计时无限重置
  const onFinishRef = useRef(onFinish);
  useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => onFinishRef.current(), 500); // 等待淡出动画结束
    }, 1500); // 启动页显示 1.5 秒

    return () => clearTimeout(timer);
  }, []); // 依赖数组留空，确保只执行一次

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#09090b', zIndex: 99999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      transition: 'opacity 0.5s ease-out', opacity: fadeOut ? 0 : 1, pointerEvents: 'none'
    }}>
      {/* 应用 logo；加载失败降级到 emoji */}
      {!logoError ? (
        <img
          src="/app-icon.png"
          alt="ModelJourney"
          onError={() => setLogoError(true)}
          style={{
            width: '96px',
            height: '96px',
            borderRadius: '20px',
            objectFit: 'contain',
            animation: 'pulse 2s infinite alternate',
            filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.4))',
          }}
        />
      ) : (
        <div style={{ fontSize: '64px', animation: 'pulse 2s infinite alternate' }}>🤖</div>
      )}

      <h1 style={{ color: '#fff', fontSize: '24px', letterSpacing: '4px', marginTop: '20px', fontWeight: 'bold' }}>
        MODELVAULT
      </h1>
      <p style={{ color: '#3b82f6', fontSize: '12px', marginTop: '10px', letterSpacing: '2px' }}>
        {t('splash_waking')}
      </p>
    </div>
  );
};