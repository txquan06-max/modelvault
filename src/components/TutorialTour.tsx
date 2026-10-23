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
  const [displayStep, setDisplayStep] = useState<TourStep | null>(steps[0]);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const step = steps[currentStep];
    if (!step) return;

    // 🌟 核心防闪烁逻辑：先清空 rect，隐藏弹窗内容，只留黑色遮罩
    setRect(null);
    
    const timer = setTimeout(() => {
      setDisplayStep(step);
      if (step.page && step.page !== activeTab) {
        setActiveTab(step.page);
        setTimeout(() => updateRect(step.targetId), 400); 
      } else {
        updateRect(step.targetId);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [currentStep, activeTab]); // 仅当步骤或页面变化时触发

  const updateRect = (targetId: string) => {
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        setRect(el.getBoundingClientRect());
      }, 400);
    } else {
      setRect(new DOMRect(window.innerWidth / 2, window.innerHeight / 2, 0, 0));
    }
  };

  if (!displayStep) return null;

  const getTooltipStyle = () => {
    if (!rect || rect.width === 0) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    const padding = 20;
    let top = rect.bottom + padding;
    let left = rect.left;

    if (top + 200 > window.innerHeight) top = rect.top - 200 - padding;
    if (left + 300 > window.innerWidth) left = window.innerWidth - 300 - 20;

    return { top: `${top}px`, left: `${left}px` };
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
      {/* 黑色遮罩，无论是否定位都常驻，防止背景乱点 */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 9997 }} onClick={(e) => e.stopPropagation()} />

      {rect && (
        <>
          <div style={{
            position: 'fixed',
            top: rect.top - 4, left: rect.left - 4,
            width: rect.width + 8, height: rect.height + 8,
            borderRadius: '8px',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
            border: '2px solid #3b82f6',
            pointerEvents: 'none',
            transition: 'all 0.3s ease-out',
            zIndex: 9998
          }} />

          <div
            ref={tooltipRef}
            style={{
              position: 'fixed', ...getTooltipStyle(),
              width: '320px', background: '#1e1e24', border: '1px solid #3b82f6',
              borderRadius: '12px', padding: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '10px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#3b82f6', fontSize: '12px', fontWeight: 'bold' }}>
                STEP {currentStep + 1} / {steps.length}
              </span>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '14px' }}>✕</button>
            </div>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '18px' }}>{displayStep.title}</h3>
            <p style={{ margin: 0, color: '#ccc', fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {displayStep.content}
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
        </>
      )}
    </div>
  );
};