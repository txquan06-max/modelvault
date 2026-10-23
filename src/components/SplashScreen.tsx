import { useEffect, useState } from 'react';

export const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onFinish, 500); // 等待淡出动画结束
    }, 2000); // 启动页显示 2 秒
    return () => clearTimeout(timer);
  }, [onFinish]);

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
        正在唤醒塑灵终端...
      </p>
    </div>
  );
};