import { useEffect, useState } from 'react';
import { AudioManager } from '../core/AudioManager';

export interface AchievementData {
  id: string;
  nameKey: string;
  descKey: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

const RARITY_COLORS = {
  common: '#9ca3af',     // 灰
  uncommon: '#10b981',   // 绿
  rare: '#3b82f6',       // 蓝
  epic: '#8b5cf6',       // 紫
  legendary: '#f59e0b',  // 金
};

export const AchievementOverlay = ({ achievement, onClose, t, i18n }: { achievement: AchievementData | null, onClose: () => void, t: any, i18n: any }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (achievement) {
      setShow(true);
      AudioManager.playAchievement();
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300); // 等待淡出动画
      }, 3500); // 展示 3.5 秒后自动关闭
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  if (!achievement) return null;

  const isZh = i18n.language === 'zh';
  const color = RARITY_COLORS[achievement.rarity];

  return (
    <div style={{ 
      position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center', 
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', 
      opacity: show ? 1 : 0, transition: 'opacity 0.3s ease-out', pointerEvents: show ? 'auto' : 'none' 
    }}>
      <div style={{
        background: `linear-gradient(145deg, rgba(30,30,30,0.95), rgba(20,20,20,0.95))`,
        border: `2px solid ${color}`,
        boxShadow: `0 0 50px ${color}60, inset 0 0 20px ${color}20`,
        borderRadius: '16px', padding: '40px 30px', textAlign: 'center', position: 'relative',
        transform: show ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(20px)', 
        transition: 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        maxWidth: '320px', width: '90%'
      }}>
        {/* 顶部光效扫过 */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${color}, transparent)`, animation: 'scan 2s linear infinite' }} />
        
        <div style={{ fontSize: '60px', marginBottom: '20px', filter: `drop-shadow(0 0 20px ${color})` }}>🏆</div>
        <h2 style={{ color: color, fontSize: '14px', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 'bold' }}>
          {isZh ? '成就解锁' : 'Achievement Unlocked'}
        </h2>
        <h1 style={{ color: '#fff', fontSize: '24px', margin: '0 0 12px 0', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
          {t(achievement.nameKey)}
        </h1>
        <p style={{ color: '#ccc', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
          {t(achievement.descKey)}
        </p>
        
        {/* 点击任意处关闭 */}
        <button onClick={() => { setShow(false); setTimeout(onClose, 300); }} style={{ position: 'absolute', inset: 0, background: 'transparent', border: 'none', cursor: 'pointer', zIndex: 10 }} />
      </div>
    </div>
  );
};