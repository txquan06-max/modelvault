import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const { t } = useTranslation();
  const [fadeOut, setFadeOut] = useState(false);
  
  // 使用 useRef 保存回调，防止父组件重渲染导致倒计时无限重置
  const onFinishRef = useRef(onFinish);
  useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => onFinishRef.current(), 500); // 等待淡出动画结束
    }, 1250); // 启动页显示 1.25 秒
    
    return () => clearTimeout(timer);
  }, []); // 依赖数组留空，确保只执行一次

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#09090b', zIndex: 99999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      transition: 'opacity 0.5s ease-out', opacity: fadeOut ? 0 : 1, pointerEvents: 'none'
    }}>
      <div style={{ fontSize: '64px', animation: 'pulse 2s infinite alternate' }}>🤖</div>
      <h1 style={{ color: '#fff', fontSize: '24px', letterSpacing: '4px', marginTop: '20px', fontWeight: 'bold' }}>
        MODELVAULT
      </h1>
      <p style={{ color: '#3b82f6', fontSize: '12px', marginTop: '10px', letterSpacing: '2px' }}>
        {t('splash_waking')}
      </p>
    </div>
  );
};