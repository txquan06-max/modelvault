import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const ScrollToTop = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 监听全局滚动事件，寻找最近的滚动容器
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.scrollTop > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // 因为 scroll 事件不冒泡，需要在捕获阶段监听
    document.addEventListener('scroll', handleScroll, true);
    return () => document.removeEventListener('scroll', handleScroll, true);
  }, []);

  const scrollToTop = () => {
    // 找到当前正在滚动的元素
    const scrollableElements = document.querySelectorAll('.scroll-content, .timeline-container, .journal-list');
    scrollableElements.forEach(el => {
      if (el.scrollTop > 0) {
        el.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
    // 兜底：也滚一下 window
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      title={t('scroll_to_top') || '回到顶部'}
      style={{
        position: 'fixed',
        bottom: '80px', // 留出底部空间（防止挡住移动端导航）
        right: '20px',
        zIndex: 9999,
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: 'rgba(59, 130, 246, 0.8)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        color: '#fff',
        fontSize: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.8)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.8)'; }}
    >
      ↑
    </button>
  );
};