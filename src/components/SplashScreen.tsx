import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const { t } = useTranslation();
  const [fadeOut, setFadeOut] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const onFinishRef = useRef(onFinish);
  useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => onFinishRef.current(), 500); 
    }, 1500); 

    return () => clearTimeout(timer);
  }, []); 

  // 🌟 修复 Tauri 下静态资源路径 404 的问题
  // Vite 打包时会将其解析为相对路径（如 ./logo.png），兼容 web 和 tauri
  const logoUrl = new URL('/logo.png', import.meta.url).href;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#09090b', zIndex: 99999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      transition: 'opacity 0.5s ease-out', opacity: fadeOut ? 0 : 1, pointerEvents: 'none'
    }}>
      {!logoError ? (
        <img
          src={logoUrl}
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
        MODELJOURNEY
      </h1>
      <p style={{ color: '#3b82f6', fontSize: '12px', marginTop: '10px', letterSpacing: '2px' }}>
        {t('splash_waking')}
      </p>
    </div>
  );
};