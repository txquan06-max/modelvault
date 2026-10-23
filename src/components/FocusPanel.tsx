import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AudioManager } from '../core/AudioManager';
import { BOTS, type BotType } from '../core/QuoteEngine'; 

export const FocusPanel = ({
  isPip, currentModelId, setCurrentModelId, currentTaskId, setCurrentTaskId, currentStageId, setCurrentStageId,
  models, tasks, currentTask, currentStage, timerState, activeSeconds, lastSession, todayTotal,
  timeboxTarget, timeboxElapsed, handleStart, handlePause, handleResume, handleComplete,
  handleConfirmStageDone, handleCancelDone, handleFinishPart,
  isFinishingPart, setIsFinishingPart, finishPartPhoto, setFinishPartPhoto, handleConfirmFinishPart,
  currentModel, getModelName, t, i18n, bgImage, bgSize, bgPosition, showToast, handleSetTimeboxTarget,
  username, level, levelProgress, isCheckedIn, checkinStreak, handleCheckin, handleFocus,
  currentBot, chatMessages,
  ambientType, setAmbientType, handleOpenPiP,
  equippedTitleDef
}: any) => {
  
  const [charIndex, setCharIndex] = useState(0);
  const [isImmersive, setIsImmersive] = useState(false);
  const typingRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const lastMsgIdRef = useRef<string | null>(null);
  
  const isZh = i18n.language === 'zh';
  const botData = BOTS[currentBot as BotType] || BOTS['tu'];

  const touchStartY = useRef<number>(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    if (touchEndY - touchStartY.current > 80) {
      AudioManager.playClick();
      setIsImmersive(false);
    }
  };

  useEffect(() => {
    const lastMsg = chatMessages[chatMessages.length - 1];
    if (!lastMsg) return;
    if (lastMsgIdRef.current === lastMsg.id) return;
    lastMsgIdRef.current = lastMsg.id;

    setCharIndex(0);
    let currentIdx = 0;
    const textLength = lastMsg.text.length;
    
    if (typingRef.current) clearInterval(typingRef.current);
    
    typingRef.current = setInterval(() => {
      currentIdx++;
      setCharIndex(currentIdx);
      if (currentIdx < textLength) {
        if (currentIdx % 3 === 0) AudioManager.playTypeTick(); 
      } else {
        clearInterval(typingRef.current);
      }
    }, 100); 
    
    return () => { if (typingRef.current) clearInterval(typingRef.current); };
  }, [chatMessages]);

  const currentTaskName = currentTask && currentTask.name ? t(currentTask.name) : t('noTask');
  const formatTime = (totalSec: number) => { 
    const h = Math.floor(totalSec / 3600); 
    const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0'); 
    const s = (totalSec % 60).toString().padStart(2, '0'); 
    if (h > 0) return `${h}:${m}:${s}`; 
    return `${m}:${s}`; 
  };
  const remainingSeconds = timeboxTarget > 0 ? Math.max(0, timeboxTarget - timeboxElapsed) : 0;
  const isTimeUp = timeboxTarget > 0 && remainingSeconds === 0 && timeboxElapsed > 0;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width; let height = img.height;
            if (width > 800) { height = Math.round((height * 800) / width); width = 800; }
            canvas.width = width; canvas.height = height;
            canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
            setFinishPartPhoto(canvas.toDataURL('image/webp', 0.6));
          };
        };
      } catch (err) { showToast(isZh ? '图片处理失败' : 'Image processing failed'); }
    }
    e.target.value = '';
  };

  const pipClass = `pip-container ${timerState === 'Running' ? 'pip-running' : ''}`;
  const availableModels = models.filter((m: any) => m.status !== 'Completed');
  const localTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 🌟 渲染聊天记录，普通视图高度设为 100%，并在 flex 中自动撑开
  const renderChatHistory = (isPipView: boolean) => (
    <div style={{ 
      background: `linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))`, 
      border: `1px solid ${botData.color}50`, 
      borderRadius: '12px', 
      padding: isPipView ? '8px' : '16px', 
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '8px',
      boxShadow: `0 4px 16px rgba(0, 0, 0, 0.5)`,
      backdropFilter: 'blur(12px)', transition: 'all 0.3s',
      flex: isPipView ? 1 : 1, // 网页端也设为 1 撑满
      height: '100%', 
      minHeight: isPipView ? '100px' : 0, // 网页端不限制最小高度，让它随容器缩放
      overflow: 'hidden', position: 'relative',
      maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%)',
      WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%)'
    }}>
      {chatMessages.map((msg: any, idx: number) => {
        const isLatest = idx === chatMessages.length - 1;
        const msgBotData = BOTS[msg.botId as BotType] || BOTS['tu']; 
        const msgBotName = isZh ? msgBotData.name : msgBotData.enName;
        const displayTxt = isLatest ? msg.text.slice(0, charIndex) : msg.text;
        
        return (
          <div key={msg.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <div style={{ 
              width: isPipView ? 'clamp(16px, 4vw, 24px)' : '32px', 
              height: isPipView ? 'clamp(16px, 4vw, 24px)' : '32px', 
              borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `1px solid ${msgBotData.color}`, background: '#111' 
            }}>
              <img src={msgBotData.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1, marginTop: '2px' }}>
              <div style={{ color: msgBotData.color, fontWeight: 'bold', fontSize: isPipView ? 'clamp(9px, 2vw, 11px)' : '13px', marginBottom: '2px' }}>{msgBotName}</div>
              <div style={{ fontSize: isPipView ? 'clamp(10px, 2.5vw, 13px)' : '14px', color: '#e2e8f0', lineHeight: '1.4', wordBreak: 'break-word' }}>
                {displayTxt}
                {isLatest && charIndex < msg.text.length && <span style={{ animation: 'pulse 1s infinite', color: msgBotData.color, fontWeight: 'bold' }}>_</span>}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={chatEndRef} />
    </div>
  );

  // ==============================
  // 🌟 悬浮窗视图 (左右分栏)
  // ==============================
  if (isPip) {
    return (
      <div className={pipClass}>
        {bgImage && <img src={bgImage} alt="bg" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: bgSize as any, objectPosition: bgPosition, zIndex: 0, opacity: 1 }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(30, 30, 30, 0.85)', zIndex: 1, backdropFilter: 'blur(10px)' }} />
        
        <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', flexDirection: 'row', padding: '8px', boxSizing: 'border-box', gap: '8px' }}>
          
          {/* 左侧控制区 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <select id="pip-model-select" value={currentModelId} onChange={(e) => { AudioManager.playClick(); setCurrentModelId(e.target.value); }} disabled={timerState !== 'Idle' || lastSession !== null || isFinishingPart} style={{ padding: '4px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: 'clamp(9px, 2.5vw, 11px)', outline: 'none', width: '100%' }}>
                {availableModels.map((m: any) => <option key={m.id} value={m.id}>{getModelName(m)} {m.isRebuilding ? '🔧' : ''}</option>)}
              </select>
              <select id="pip-task-select" value={currentTaskId} onChange={(e) => { AudioManager.playClick(); setCurrentTaskId(e.target.value); }} disabled={timerState !== 'Idle' || tasks.length === 0 || lastSession !== null || isFinishingPart} style={{ padding: '4px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: 'clamp(9px, 2.5vw, 11px)', outline: 'none', width: '100%' }}>
                {tasks.map((t_item: any) => <option key={t_item.id} value={t_item.id}>{t_item.status === 'Completed' ? '✅ ' : ''}{t(t_item.name)}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <div className={`timer-display ${timerState.toLowerCase()} ${isTimeUp ? 'time-up' : ''}`} style={{ fontSize: 'clamp(32px, 12vw, 56px)', margin: 0, lineHeight: 1, textShadow: `0 0 20px ${botData.color}40`, textAlign: 'center' }}>
                {formatTime(activeSeconds)}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
              {timerState === 'Idle' && !lastSession && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {[0, 15, 30, 60].map(min => (
                    <button key={min} style={{ background: timeboxTarget === min * 60 ? 'rgba(59, 130, 246, 0.8)' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '4px 6px', borderRadius: '4px', fontSize: 'clamp(8px, 2.5vw, 10px)', cursor: 'pointer' }} onClick={() => handleSetTimeboxTarget(min)}>
                      {min === 0 ? (isZh ? '不限' : '∞') : `${min}m`}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {(['none', 'rain', 'wind', 'cafe'] as const).map(type => (
                  <button key={type} onClick={() => { AudioManager.playClick(); setAmbientType(type); }} style={{ background: ambientType === type ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255,255,255,0.05)', color: ambientType === type ? '#c4b5fd' : '#888', border: `1px solid ${ambientType === type ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`, padding: '2px 4px', borderRadius: '10px', fontSize: 'clamp(8px, 2vw, 10px)', cursor: 'pointer' }}>
                    {type === 'none' ? '🔇' : type === 'rain' ? '🌧️' : type === 'wind' ? '🌬️' : '☕'}
                  </button>
                ))}
              </div>

              {isFinishingPart ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                  <input id="pip-photo-url" type="text" value={finishPartPhoto.startsWith('data:') ? t('localImageSelected') : finishPartPhoto} onChange={e => setFinishPartPhoto(e.target.value)} placeholder={t('addPhotoUrl')} style={{ fontSize: '10px', padding: '4px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', outline: 'none' }} disabled={finishPartPhoto.startsWith('data:')} />
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn yes" style={{ flex: 1, padding: '6px', fontSize: '11px', borderRadius: '4px' }} onClick={handleConfirmFinishPart}>{t('confirm')}</button>
                    <button className="btn no" style={{ flex: 1, padding: '6px', fontSize: '11px', borderRadius: '4px' }} onClick={() => setIsFinishingPart(false)}>{t('cancel')}</button>
                  </div>
                </div>
              ) : lastSession ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                  <div style={{ fontSize: '10px', color: '#10b981', textAlign: 'center', fontWeight: 'bold' }}>{t('saved')}: {formatTime(lastSession.duration)}</div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn yes" style={{ flex: 1, padding: '6px', fontSize: '11px', borderRadius: '4px' }} onClick={handleConfirmStageDone}>{t('yesDone')}</button>
                    <button className="btn no" style={{ flex: 1, padding: '6px', fontSize: '11px', borderRadius: '4px' }} onClick={handleCancelDone}>{t('keepWorking')}</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '4px', width: '100%' }}>
                  {timerState === 'Idle' && <button className="btn start" style={{ padding: '8px', fontSize: '13px', borderRadius: '6px', width: '100%' }} onClick={handleStart} disabled={!currentTaskId}>{t('start')}</button>}
                  {timerState === 'Running' && <button className="btn pause" style={{ padding: '8px', fontSize: '13px', borderRadius: '6px', width: '100%' }} onClick={handlePause}>{t('pause')}</button>}
                  {timerState === 'Paused' && (
                    <>
                      <button className="btn resume" style={{ flex: 1, padding: '6px', fontSize: '11px', borderRadius: '6px' }} onClick={handleResume}>{t('resume')}</button>
                      <button className="btn complete" style={{ flex: 1, padding: '6px', fontSize: '11px', borderRadius: '6px' }} onClick={handleComplete}>{t('complete')}</button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 右侧聊天区 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {renderChatHistory(true)}
          </div>
        </div>
      </div>
    );
  }

  // ==============================
  // 🌟 沉浸模式视图
  // ==============================
  if (isImmersive) {
    const immersiveContent = (
      <div 
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ position: 'fixed', inset: 0, background: '#09090b', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.3s ease-out' }}
      >
        <div style={{ position: 'absolute', width: '80vw', height: '80vw', maxWidth: '600px', maxHeight: '600px', borderRadius: '50%', background: `radial-gradient(circle, ${botData.color}15 0%, transparent 70%)`, animation: 'pulse 4s infinite alternate', pointerEvents: 'none' }} />
        
        <button 
          onClick={() => { AudioManager.playClick(); setIsImmersive(false); }} 
          style={{ 
            position: 'absolute', top: '20px', right: '20px', 
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', 
            color: '#fff', fontSize: '24px', width: '48px', height: '48px', 
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            cursor: 'pointer', zIndex: 100000, touchAction: 'manipulation' 
          }}
        >
          ✕
        </button>

        <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '20px' }}>
          <div style={{ color: botData.color, fontSize: '16px', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '10px', opacity: 0.8, textAlign: 'center' }}>
            {currentModel ? getModelName(currentModel) : ''} - {currentTaskName}
          </div>
          
          <div className={`timer-display ${timerState.toLowerCase()} ${isTimeUp ? 'time-up' : ''}`} style={{ fontSize: 'clamp(80px, 20vw, 120px)', fontVariantNumeric: 'tabular-nums', fontWeight: 200, margin: '20px 0', textShadow: `0 0 40px ${botData.color}40` }}>
            {formatTime(activeSeconds)}
          </div>

          <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
             {timerState === 'Idle' && <button className="btn start" style={{ width: '140px', padding: '16px', fontSize: '18px', borderRadius: '30px' }} onClick={handleStart} disabled={!currentTaskId}>{t('start')}</button>}
             {timerState === 'Running' && <button className="btn pause" style={{ width: '140px', padding: '16px', fontSize: '18px', borderRadius: '30px' }} onClick={handlePause}>{t('pause')}</button>}
             {timerState === 'Paused' && (
               <>
                 <button className="btn resume" style={{ width: '140px', padding: '16px', fontSize: '18px', borderRadius: '30px' }} onClick={handleResume}>{t('resume')}</button>
                 <button className="btn complete" style={{ width: '140px', padding: '16px', fontSize: '18px', borderRadius: '30px' }} onClick={handleComplete}>{t('complete')}</button>
               </>
             )}
          </div>
          
          <div style={{ color: '#555', fontSize: '12px', marginTop: '40px' }}>↓ 向下滑动退出 ↓</div>

          <div style={{ marginTop: '20px', width: '100%', maxWidth: '500px', height: '200px' }}>
             {renderChatHistory(false)}
          </div>
        </div>
      </div>
    );
    return createPortal(immersiveContent, document.body);
  }

  // ==============================
  // 🌟 普通网页视图 (左侧聊天撑满，右侧控制)
  // ==============================
  return (
    <div className="focus-layout">
      
      {/* 左侧：陪伴与聊天区 */}
      <div className="focus-left">
        <div className="profile-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', border: `2px solid ${botData.color}`, boxShadow: `0 0 10px ${botData.color}50`, background: '#111', flexShrink: 0 }}>
              <img src={botData.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>{username}</span>
                <span style={{ fontSize: '11px', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>Lv.{level}</span>
                {equippedTitleDef && (
                  <span style={{ fontSize: '11px', color: equippedTitleDef.color, background: `${equippedTitleDef.color}20`, padding: '2px 6px', borderRadius: '4px', border: `1px solid ${equippedTitleDef.color}50`, fontWeight: 'bold' }}>
                    [{t(equippedTitleDef.nameKey)}]
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>🕒 {localTime}</div>
            </div>
          </div>
          
          <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${levelProgress.percent}%`, height: '100%', background: `linear-gradient(90deg, ${botData.color}, #8b5cf6)`, borderRadius: '3px', transition: 'width 0.3s' }} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '13px', color: '#10b981', fontWeight: 'bold', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            ⏳ {t('today')}: {formatTime(todayTotal)}
          </div>
          {!isCheckedIn ? (
            <button className="mini-btn" style={{ background: '#f59e0b', color: '#000', border: 'none', fontWeight: 'bold', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }} onClick={handleCheckin}>
              📅 {isZh ? '打卡' : 'Check-in'}
            </button>
          ) : (
            <span style={{ color: '#10b981', fontSize: '12px', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '6px' }}>✅ {isZh ? '已打卡' : 'Checked in'} ({checkinStreak}{isZh ? '天' : 'd'})</span>
          )}
        </div>

        {/* 🌟 下方使用 flex: 1 撑满容器剩余高度 */}
        <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {renderChatHistory(false)}
        </div>
      </div>

      {/* 右侧：核心控制区 */}
      <div className="focus-right">
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '10px', flexWrap: 'wrap', width: '100%' }}>
          <button id="btn-pip" onClick={() => { AudioManager.playClick(); handleOpenPiP(); }} style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#3b82f6', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
            📺 {isZh ? '开启悬浮窗' : 'Open PiP'}
          </button>
          <button onClick={() => { AudioManager.playClick(); setIsImmersive(true); }} style={{ background: 'transparent', border: 'none', color: botData.color, fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>
            ⛶ {isZh ? '沉浸模式' : 'Immersive'}
          </button>
        </div>

        <div className="selector-group" style={{ marginBottom: '20px' }}>
          <div className="selector-row">
            <select id="pip-model-select" value={currentModelId} onChange={(e) => { AudioManager.playClick(); setCurrentModelId(e.target.value); }} disabled={timerState !== 'Idle' || lastSession !== null || isFinishingPart} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 14px', borderRadius: '8px', outline: 'none' }}>
              {availableModels.map((m: any) => <option key={m.id} value={m.id}>{getModelName(m)} {m.isRebuilding ? '🔧' : ''}</option>)}
            </select>
          </div>
          <div className="selector-row">
            <select id="pip-task-select" value={currentTaskId} onChange={(e) => { AudioManager.playClick(); setCurrentTaskId(e.target.value); }} disabled={timerState !== 'Idle' || tasks.length === 0 || lastSession !== null || isFinishingPart} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 14px', borderRadius: '8px', outline: 'none' }}>
              {tasks.map((t_item: any) => <option key={t_item.id} value={t_item.id}>{t_item.status === 'Completed' ? '✅ ' : ''}{t(t_item.name)}</option>)}
            </select>
          </div>
        </div>

        <div className="task-header">
          <div className="task-name">{currentTaskName}{currentModel?.isRebuilding && <span className="rebuild-badge">🔧 {t('rebuilding')}</span>}</div>
          {currentTask && currentTask.status !== 'Completed' && timerState === 'Idle' && !lastSession && !isFinishingPart && (
             <button className="finish-part-btn" onClick={handleFinishPart}>✓ {t('finishPart')}</button>
          )}
        </div>
        <div className={`task-status ${currentTask?.status === 'Completed' ? 'status-completed' : currentTask?.status === 'InProgress' ? 'status-inprogress' : 'status-notstarted'}`}>
          {currentStage ? `${t(currentStage.nameKey)} (+${currentStage.xpReward}XP)` : t('noStage')}
        </div>
        {timerState === 'Idle' && !lastSession && (
          <div className="timebox-selector" style={{ justifyContent: 'center', margin: '20px 0', flexWrap: 'wrap', gap: '6px' }}>
            <span className="timebox-label">{t('timebox')}:</span>
            {[0, 10, 30, 60].map(min => (
              <button key={min} className={`timebox-btn ${timeboxTarget === min * 60 ? 'active' : ''}`} onClick={() => handleSetTimeboxTarget(min)}>
                {min === 0 ? t('timeboxNone') : `${min}m`}
              </button>
            ))}
          </div>
        )}
        
        <div id="tour-timer" className={`timer-display ${timerState.toLowerCase()} ${isTimeUp ? 'time-up' : ''}`} style={{ fontSize: '96px', textShadow: '0 0 30px rgba(255,255,255,0.2)', width: '100%', margin: '30px 0' }}>{formatTime(activeSeconds)}</div>
        
        {timeboxTarget > 0 && timeboxElapsed > 0 && !isFinishingPart && (
          <div className={`timebox-remaining ${isTimeUp ? 'time-up' : ''}`} style={{ fontSize: '14px' }}>{isTimeUp ? t('timeboxEnd') : `⏳ ${formatTime(remainingSeconds)}`}</div>
        )}
        
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', margin: '15px 0', flexWrap: 'wrap' }}>
          {(['none', 'rain', 'wind', 'cafe'] as const).map(type => (
            <button
              key={type}
              onClick={() => { AudioManager.playClick(); setAmbientType(type); }}
              style={{ 
                background: ambientType === type ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255,255,255,0.05)', 
                color: ambientType === type ? '#c4b5fd' : '#888', 
                border: `1px solid ${ambientType === type ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`, 
                padding: '6px 10px', borderRadius: '16px', fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {type === 'none' ? (isZh ? '🔇 静音' : '🔇 Mute') : type === 'rain' ? (isZh ? '🌧️ 雨声' : '🌧️ Rain') : type === 'wind' ? (isZh ? '🌬️ 风声' : '🌬️ Wind') : (isZh ? '☕ 白噪音' : '☕ Cafe')}
            </button>
          ))}
        </div>

        {currentTask && timerState !== 'Running' && !lastSession && !isFinishingPart && (
          <div className="stages-panel" style={{ justifyContent: 'center', margin: '20px 0', flexWrap: 'wrap' }}>
            {currentTask.stages.map((stage: any) => (
              <button key={stage.id} className={`stage-btn ${stage.id === currentStageId ? 'active' : ''} ${stage.status === 'Completed' ? 'done' : ''}`} onClick={() => { AudioManager.playClick(); setCurrentStageId(stage.id); }} disabled={timerState === 'Paused'}>
                {t(stage.nameKey)} {stage.status === 'Completed' ? '✓' : ''}
              </button>
            ))}
          </div>
        )}
        
        {isFinishingPart ? (
          <div className="inline-confirm" style={{ background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '12px', width: '100%', boxSizing: 'border-box' }}>
            <div className="confirm-text">🎉 {t('finishPart')}!</div>
            <div style={{ width: '100%', display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              <input id="pip-photo-url" type="text" value={finishPartPhoto.startsWith('data:') ? t('localImageSelected') : finishPartPhoto} onChange={e => setFinishPartPhoto(e.target.value)} placeholder={t('addPhotoUrl')} className="photo-input" style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid #555', color: '#fff', padding: '10px', borderRadius: '6px', outline: 'none', minWidth: '150px' }} disabled={finishPartPhoto.startsWith('data:')} onFocus={handleFocus} />
              <label className="btn no" style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', margin: 0, borderRadius: '6px', flexShrink: 0 }}>
                📁<input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>
            {finishPartPhoto.startsWith('data:') && <img src={finishPartPhoto} alt="preview" style={{ width: '100%', maxHeight: '100px', objectFit: 'contain', borderRadius: '4px', marginTop: '12px' }} />}
            <div className="confirm-actions" style={{ marginTop: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <button className="btn yes" onClick={handleConfirmFinishPart}>{t('confirm')}</button>
              <button className="btn no" onClick={() => setIsFinishingPart(false)}>{t('cancel')}</button>
            </div>
          </div>
        ) : lastSession ? (
          <div className="inline-confirm" style={{ background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '12px', width: '100%', boxSizing: 'border-box' }}>
            <div className="confirm-text">{t('saved')}: {formatTime(lastSession.duration)}<br/><span>{t('confirmStage')}</span></div>
            <div className="confirm-actions" style={{ marginTop: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <button className="btn yes" onClick={handleConfirmStageDone}>{t('yesDone')}</button>
              <button className="btn no" onClick={handleCancelDone}>{t('keepWorking')}</button>
            </div>
          </div>
        ) : (
          <div className="controls" style={{ width: '100%', marginTop: '20px', flexWrap: 'wrap' }}>
            {timerState === 'Idle' && <button className="btn start" style={{ padding: '16px', fontSize: '18px' }} onClick={handleStart} disabled={!currentTaskId}>{t('start')}</button>}
            {timerState === 'Running' && <button className="btn pause" style={{ padding: '16px', fontSize: '18px' }} onClick={handlePause}>{t('pause')}</button>}
            {timerState === 'Paused' && (<><button className="btn resume" style={{ padding: '16px', fontSize: '18px' }} onClick={handleResume}>{t('resume')}</button><button className="btn complete" style={{ padding: '16px', fontSize: '18px' }} onClick={handleComplete}>{t('complete')}</button></>)}
          </div>
        )}
        {timerState === 'Running' && <button className="btn complete-outline" style={{ padding: '14px', marginTop: '12px', fontSize: '16px' }} onClick={handleComplete}>{t('complete')}</button>}
      </div>
    </div>
  );
};