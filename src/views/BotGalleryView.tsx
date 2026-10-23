import React, { useState } from 'react';
import { BOTS, type BotType } from '../core/QuoteEngine';
import { AudioManager } from '../core/AudioManager';

interface Props {
  unlockedBots: BotType[];
  currentBot: BotType;
  level: number;
  coins: number;
  checkinStreak: number;
  onUnlock: (botId: BotType, cost: number) => void;
  onEquip: (botId: BotType) => void;
  i18n: any;
}

export const BotGalleryView: React.FC<Props> = ({ unlockedBots, currentBot, level, coins, checkinStreak, onUnlock, onEquip, i18n }) => {
  const [selectedBot, setSelectedBot] = useState<BotType | null>(null);

  const handleCardClick = (botId: BotType) => {
    AudioManager.playClick();
    setSelectedBot(botId);
  };

  const handleUnlockClick = (botId: BotType, cost: number) => {
    onUnlock(botId, cost);
    setSelectedBot(null);
  };

  return (
    <div className="view-content" style={{ width: '100%', padding: '10px' }}>
      {/* 🌟 修改标题 */}
      <h2 style={{ fontSize: '18px', color: '#fff', marginBottom: '16px', borderLeft: '4px solid #3b82f6', paddingLeft: '10px' }}>
        {i18n.language === 'zh' ? '塑灵图鉴 / Animold Archive' : 'Animold Archive / 塑灵图鉴'}
      </h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
        {Object.values(BOTS).map(bot => {
          const isUnlocked = unlockedBots.includes(bot.id);
          const isEquipped = currentBot === bot.id;
          
          return (
            <div 
              key={bot.id} 
              onClick={() => handleCardClick(bot.id)}
              style={{
                background: isUnlocked ? `linear-gradient(180deg, rgba(30,30,30,0) 0%, ${bot.color}40 100%)` : 'rgba(20,20,20,0.8)',
                border: `2px solid ${isEquipped ? bot.color : isUnlocked ? 'rgba(255,255,255,0.1)' : '#333'}`,
                borderRadius: '12px',
                overflow: 'hidden',
                cursor: 'pointer',
                position: 'relative',
                aspectRatio: '3/4',
                transition: 'all 0.2s',
                boxShadow: isEquipped ? `0 0 15px ${bot.color}60` : 'none'
              }}
            >
              <div style={{ 
                width: '100%', height: '100%', 
                backgroundImage: `url(${bot.portrait})`, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center top',
                filter: isUnlocked ? 'none' : 'brightness(0) opacity(0.3)'
              }} />
              
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', textAlign: 'center' }}>
                <div style={{ color: isUnlocked ? bot.color : '#666', fontWeight: 'bold', fontSize: '14px' }}>
                  {isUnlocked ? (i18n.language === 'zh' ? bot.name : bot.enName) : '???'}
                </div>
                {isEquipped && <div style={{ fontSize: '10px', color: '#10b981', marginTop: '2px' }}>{i18n.language === 'zh' ? '出战中' : 'Active'}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {selectedBot && (() => {
        const bot = BOTS[selectedBot];
        const isUnlocked = unlockedBots.includes(selectedBot);
        const meetsLevel = level >= bot.unlockLevel;
        const meetsStreak = !bot.unlockStreak || checkinStreak >= bot.unlockStreak;
        const canAfford = coins >= bot.unlockCost;

        return (
          <div className="modal-overlay" onClick={() => setSelectedBot(null)}>
            <div className="modal-content" style={{ width: '90%', maxWidth: '400px', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
              <div style={{ width: '100%', height: '260px', backgroundImage: `url(${bot.portrait})`, backgroundSize: 'cover', backgroundPosition: 'center top', position: 'relative' }}>
                 <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #2d2d2d 0%, transparent 60%)' }} />
                 <button onClick={() => setSelectedBot(null)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer' }}>✕</button>
              </div>
              
              <div style={{ padding: '0 20px 20px 20px', marginTop: '-20px', zIndex: 2, position: 'relative' }}>
                <h3 style={{ color: bot.color, fontSize: '22px', margin: '0 0 4px 0', textShadow: '0 2px 4px rgba(0,0,0,0.8)', fontWeight: 'bold' }}>
                  {i18n.language === 'zh' ? bot.name : bot.enName}
                </h3>
                {/* 🌟 新增：显示塑灵代号 */}
                <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 'bold', marginBottom: '10px', background: 'rgba(245, 158, 11, 0.1)', display: 'inline-block', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  {i18n.language === 'zh' ? bot.speciesZh : bot.speciesEn}
                </div>
                <p style={{ fontSize: '13px', color: '#ccc', lineHeight: '1.6', marginBottom: '20px', textAlign: 'justify' }}>
                  {i18n.language === 'zh' ? bot.backgroundZh : bot.backgroundEn}
                </p>

                {isUnlocked ? (
                  <button 
                    className="btn start" 
                    style={{ width: '100%', padding: '12px', fontSize: '15px' }}
                    disabled={currentBot === bot.id}
                    onClick={() => { onEquip(bot.id); setSelectedBot(null); }}
                  >
                    {currentBot === bot.id ? (i18n.language === 'zh' ? '当前出战中' : 'Currently Active') : (i18n.language === 'zh' ? '设为出战塑灵' : 'Set as Active Animold')}
                  </button>
                ) : (
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid #444' }}>
                    <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px' }}>{i18n.language === 'zh' ? '解锁条件：' : 'Unlock Requirements:'}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', marginBottom: '12px' }}>
                      <span style={{ color: meetsLevel ? '#10b981' : '#ef4444' }}>{meetsLevel ? '✅' : '❌'} Lv.{bot.unlockLevel}</span>
                      {bot.unlockStreak && <span style={{ color: meetsStreak ? '#10b981' : '#ef4444' }}>{meetsStreak ? '✅' : '❌'} {i18n.language === 'zh' ? `连续打卡 ${bot.unlockStreak} 天` : `Streak ${bot.unlockStreak} days`}</span>}
                      <span style={{ color: canAfford ? '#10b981' : '#ef4444' }}>{canAfford ? '✅' : '❌'} {bot.unlockCost} 🪙 (当前: {coins})</span>
                    </div>
                    <button 
                      className="btn" 
                      style={{ width: '100%', padding: '10px', background: (meetsLevel && meetsStreak && canAfford) ? '#f59e0b' : '#555', color: (meetsLevel && meetsStreak && canAfford) ? '#000' : '#888' }}
                      disabled={!meetsLevel || !meetsStreak || !canAfford}
                      onClick={() => handleUnlockClick(bot.id, bot.unlockCost)}
                    >
                      {i18n.language === 'zh' ? '缔结契约并解锁' : 'Contract & Unlock'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};