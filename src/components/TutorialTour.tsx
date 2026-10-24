import { useState, useEffect, useRef } from 'react';
import { AudioManager } from '../core/AudioManager';

export interface TourStep {
  targetId: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  page?: 'focus' | 'journal' | 'hangar' | 'gallery' | 'gundam' | 'profile';
}

interface Props {
  steps: TourStep[];
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export const TutorialTour = ({ steps, onClose, activeTab, setActiveTab }: Props) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [ready, setReady] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  const step = steps[currentStep];

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!step) return;
    setReady(false);
    
    if (step.page && step.page !== activeTab) {
      setActiveTab(step.page);
      const timer = setTimeout(() => {
        updateRect(step.targetId);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      updateRect(step.targetId);
    }
  }, [currentStep, activeTab, step]);

  const updateRect = (targetId: string) => {
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        setRect(el.getBoundingClientRect());
        setReady(true);
      }, 300);
    } else {
      // 兜底：如果找不到元素，居中显示气泡
      setRect(new DOMRect(window.innerWidth / 2, window.innerHeight / 2, 0, 0));
      setReady(true);
    }
  };

  if (!step) return null;

  // 🌟 核心修复：智能防越界计算算法
  const getTooltipStyle = () => {
    if (!rect || rect.width === 0) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const padding = 16;
    const tooltipWidth = 300;
    const tooltipHeight = 200; // 预估高度

    let top = rect.bottom + padding;
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;

    // 防底部越界：如果下方放不下，翻转到上方
    if (top + tooltipHeight > windowSize.height) {
      top = rect.top - tooltipHeight - padding;
    }
    
    // 防顶部越界：如果上方也放不下，强行贴紧顶部
    if (top < padding) {
      top = padding;
    }

    // 防右侧越界
    if (left + tooltipWidth > windowSize.width) {
      left = windowSize.width - tooltipWidth - padding;
    }

    // 防左侧越界
    if (left < padding) {
      left = padding;
    }

    return { top: `${top}px`, left: `${left}px` };
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
      {/* 高亮遮罩层 */}
      {rect && rect.width > 0 ? (
        <div style={{
          position: 'fixed',
          top: rect.top - 6, left: rect.left - 6,
          width: rect.width + 12, height: rect.height + 12,
          borderRadius: '8px',
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
          border: '2px solid #3b82f6',
          pointerEvents: 'none',
          transition: 'all 0.3s ease-out',
          zIndex: 9998,
          opacity: ready ? 1 : 0
        }} />
      ) : (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9998, opacity: ready ? 1 : 0 }} />
      )}

      {/* 气泡内容 */}
      <div
        style={{
          position: 'fixed', ...getTooltipStyle(),
          width: `${300}px`, background: '#1e1e24', border: '1px solid #3b82f6',
          borderRadius: '12px', padding: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
          zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '10px',
          opacity: ready ? 1 : 0, transition: 'opacity 0.3s',
          maxHeight: '80vh', overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#3b82f6', fontSize: '12px', fontWeight: 'bold' }}>
            STEP {currentStep + 1} / {steps.length}
          </span>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '14px' }}>✕</button>
        </div>
        <h3 style={{ margin: 0, color: '#fff', fontSize: '18px' }}>{step.title}</h3>
        <p style={{ margin: 0, color: '#ccc', fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
          {step.content}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
          <button
            disabled={currentStep === 0}
            onClick={() => { AudioManager.playClick(); setCurrentStep(s => s - 1); }}
            style={{ padding: '6px 16px', borderRadius: '6px', background: 'transparent', border: '1px solid #555', color: currentStep === 0 ? '#444' : '#fff', cursor: currentStep === 0 ? 'not-allowed' : 'pointer' }}
          >上一步</button>
          
          {currentStep === steps.length - 1 ? (
            <button
              onClick={() => { AudioManager.playAchievement(); onClose(); }}
              style={{ padding: '6px 16px', borderRadius: '6px', background: '#10b981', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
            >完成教程</button>
          ) : (
            <button
              onClick={() => { AudioManager.playClick(); setCurrentStep(s => s + 1); }}
              style={{ padding: '6px 16px', borderRadius: '6px', background: '#3b82f6', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
            >下一步</button>
          )}
        </div>
      </div>
    </div>
  );
};