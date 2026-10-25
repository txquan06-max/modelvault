import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { AudioManager } from '../core/AudioManager';
import { BOTS, type BotType, QuoteEngine } from '../core/QuoteEngine';
import { useAppStore } from '../store/useAppStore';

const isTauriEnv = typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__;

export const FocusPanel = ({
  isPip, handleStart, handlePause, handleResume, handleComplete,
  handleConfirmStageDone, handleCancelDone, handleFinishPart,
  isFinishingPart, setIsFinishingPart, finishPartPhoto, setFinishPartPhoto, handleConfirmFinishPart,
  lastSession, timeboxTarget, timeboxElapsed, bgImage,
  showToast, handleSetTimeboxTarget, handleCheckin, handleFocus,
  chatMessages, setChatMessages, ambientType, setAmbientType, 
  handleOpenWebPiP, handleToggleMiniMode, 
  isAddingModel, setIsAddingModel, isAddingTask, setIsAddingTask,
  newModelNameInput, setNewModelNameInput, selectedGunpla, setSelectedGunpla, searchResults, setSearchResults,
  // 🌟 新增：搜索状态与触发器
  isSearching, triggerModelSearch,
  newModelGrade, setNewModelGrade, newModelSeriesInput, setNewModelSeriesInput, useDefaultTasks, setUseDefaultTasks,
  newTaskName, setNewTaskName, handleAddModel, handleAddTask, isWholeBuild, setIsWholeBuild,
  bgSize, bgPosition, currentModel, currentTask, currentStage,
  getModelName, equippedTitleDef, onClose
}: any) => {

  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';

  const {
    models, currentModelId, setCurrentModelId,
    tasks, currentTaskId, setCurrentTaskId, currentStageId, setCurrentStageId,
    timerState, activeSeconds, todayTotal, username, level, levelProgress,
    isCheckedIn, checkinStreak, currentBot
  } = useAppStore();

  const [charIndex, setCharIndex] = useState(0);
  const [isImmersive, setIsImmersive] = useState(false);
  const typingRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const lastMsgIdRef = useRef<string | null>(null);
  const [avatarBounce, setAvatarBounce] = useState(false);
  const hiddenAtRef = useRef<number | null>(null);

  const [pipLayout, setPipLayout] = useState<'left' | 'right'>(() => {
    return (localStorage.getItem('mv_pip_layout') as 'left' | 'right') || 'left';
  });
  const [localTime, setLocalTime] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setLocalTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const togglePipLayout = () => {
    const next = pipLayout === 'left' ? 'right' : 'left';
    setPipLayout(next);
    localStorage.setItem('mv_pip_layout', next);
  };

  const botData = BOTS[currentBot as BotType] || BOTS['tu'];

  const handleAvatarClick = () => {
    setAvatarBounce(true);
    setTimeout(() => setAvatarBounce(false), 300);
    const text = QuoteEngine.getRandom(i18n.language, currentStageId);
    const newMsg = { id: crypto.randomUUID(), botId: currentBot, text, timestamp: Date.now() };
    setChatMessages((prev: any[]) => [...prev, newMsg].slice(-5));
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
      } else if (document.visibilityState === 'visible') {
        if (hiddenAtRef.current && timerState === 'Running') {
          const hiddenDuration = (Date.now() - hiddenAtRef.current) / 1000;
          if (hiddenDuration > 15) {
            AudioManager.playDistraction();
            const alertText = isZh 
              ? `喂！你刚才去哪了？离开了 ${Math.floor(hiddenDuration)} 秒，专注被你打断了哦！` 
              : `Hey! Where did you go? You left for ${Math.floor(hiddenDuration)}s, your focus was broken!`;
            setChatMessages((prev: any[]) => [...prev, { id: crypto.randomUUID(), botId: currentBot, text: alertText, timestamp: Date.now() }].slice(-5));
          }
        }
        hiddenAtRef.current = null;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [timerState, currentBot, isZh, setChatMessages]);

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

  useEffect(() => {
    if (isTimeUp && timerState === 'Running') {
      handlePause();
    }
  }, [isTimeUp, timerState]);

  useEffect(() => {
    if (!isImmersive) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsImmersive(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isImmersive]);

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
      } catch (err) { showToast(t('imageProcessingFailed')); }
    }
    e.target.value = '';
  };

  const pipClass = `pip-container ${timerState === 'Running' ? 'pip-running' : ''}`;
  const availableModels = models.filter((m: any) => m.status !== 'Completed');

  const renderChatHistory = (isPipView: boolean) => (
    <div style={{
      background: `linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))`,
      border: `1px solid ${botData.color}50`,
      borderRadius: '12px',
      padding: isPipView ? '8px' : '16px',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '8px',
      boxShadow: `0 4px 16px rgba(0, 0, 0, 0.5)`,
      backdropFilter: 'blur(12px)', transition: 'all 0.3s',
      flex: 1, height: '100%', minHeight: isPipView ? '100px' : 0,
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
          <div key={msg.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
            <div style={{ width: isPipView ? 'clamp(16px, 4vw, 24px)' : '32px', height: isPipView ? 'clamp(16px, 4vw, 24px)' : '32px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `1px solid ${msgBotData.color}`, background: '#111' }}>
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

  if (isPip) {
    const controlPanel = (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
          <div style={{ fontSize: 'clamp(9px, 2vw, 11px)', color: '#888', fontWeight: 'bold' }}>🕒 {localTime}</div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={onClose} style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: 'clamp(10px, 2.5vw, 12px)' }} title={isZh ? '退出' : 'Close'}>✕</button>
            <button onClick={togglePipLayout} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: 'clamp(10px, 2.5vw, 12px)', transition: 'all 0.2s', flexShrink: 0 }} title={t('pip_switch_layout')}>⇄</button>
          </div>
        </div>
        <select value={currentModelId} onChange={(e) => { setCurrentModelId(e.target.value); }} disabled={timerState !== 'Idle' || lastSession !== null || isFinishingPart} style={{ padding: '4px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: 'clamp(9px, 2.5vw, 11px)', outline: 'none', width: '100%' }}>
          {availableModels.map((m: any) => <option key={m.id} value={m.id}>{getModelName(m)} {m.isRebuilding ? '🔧' : ''}</option>)}
        </select>
        <select value={currentTaskId} onChange={(e) => { setCurrentTaskId(e.target.value); }} disabled={timerState !== 'Idle' || tasks.length === 0 || lastSession !== null || isFinishingPart} style={{ padding: '4px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: 'clamp(9px, 2.5vw, 11px)', outline: 'none', width: '100%', marginBottom: '4px' }}>
          {tasks.map((t_item: any) => <option key={t_item.id} value={t_item.id}>{t_item.status === 'Completed' ? '✅ ' : ''}{t(t_item.name)}</option>)}
        </select>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <div style={{ fontSize: 'clamp(9px, 2vw, 11px)', color: '#10b981', fontWeight: 'bold' }}>⏳ {t('today')}: {formatTime(todayTotal)}</div>
          {!isCheckedIn ? (
            <button className="mini-btn" style={{ background: '#f59e0b', color: '#000', border: 'none', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', fontSize: 'clamp(8px, 2vw, 10px)', cursor: 'pointer' }} onClick={handleCheckin}>📅 {t('checkin')}</button>
          ) : (
            <span style={{ color: '#10b981', fontSize: 'clamp(8px, 2vw, 10px)', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>✅ {t('checkedIn')} ({checkinStreak}{isZh ? '天' : 'd'})</span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <div className={`timer-display ${timerState.toLowerCase()} ${isTimeUp ? 'time-up' : ''}`} style={{ fontSize: 'clamp(36px, 12vh, 64px)', margin: 0, lineHeight: 1, textShadow: `0 0 20px ${botData.color}40`, textAlign: 'center' }}>
            {formatTime(activeSeconds)}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
          {timerState === 'Idle' && !lastSession && (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {[0, 15, 30, 60].map(min => (
                <button key={min} style={{ background: timeboxTarget === min * 60 ? 'rgba(59, 130, 246, 0.8)' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '2px 6px', borderRadius: '4px', fontSize: 'clamp(8px, 2vw, 10px)', cursor: 'pointer' }} onClick={() => handleSetTimeboxTarget(min)}>
                  {min === 0 ? t('timeboxNone') : `${min}m`}
                </button>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '4px' }}>
            {(['none', 'rain', 'wind', 'cafe'] as const).map(type => (
              <button key={type} onClick={() => { setAmbientType(type); }} style={{ background: ambientType === type ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255,255,255,0.05)', color: ambientType === type ? '#c4b5fd' : '#888', border: `1px solid ${ambientType === type ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`, padding: '2px 4px', borderRadius: '10px', fontSize: 'clamp(8px, 2vw, 10px)', cursor: 'pointer' }}>
                {type === 'none' ? '🔇' : type === 'rain' ? '🌧️' : type === 'wind' ? '🌬️' : '☕'}
              </button>
            ))}
          </div>
          {isFinishingPart ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
              <input type="text" value={finishPartPhoto.startsWith('data:') ? t('localImageSelected') : finishPartPhoto} onChange={e => setFinishPartPhoto(e.target.value)} placeholder={t('addPhotoUrl')} style={{ fontSize: '10px', padding: '4px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', outline: 'none' }} disabled={finishPartPhoto.startsWith('data:')} />
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
    );

    return (
      <div className={pipClass}>
        {bgImage && <img src={bgImage} alt="bg" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: bgSize as any, objectPosition: bgPosition, zIndex: 0, opacity: 1 }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(30, 30, 30, 0.85)', zIndex: 1, backdropFilter: 'blur(10px)' }} />
        <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', flexDirection: pipLayout === 'left' ? 'row' : 'row-reverse', padding: '8px', boxSizing: 'border-box', gap: '8px' }}>
          {controlPanel}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>{renderChatHistory(true)}</div>
        </div>
      </div>
    );
  }

  if (isImmersive) {
    const immersiveContent = (
      <div style={{ position: 'fixed', inset: 0, background: '#09090b', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.3s ease-out' }}>
        <div style={{ position: 'absolute', width: '80vw', height: '80vw', maxWidth: '600px', maxHeight: '600px', borderRadius: '50%', background: `radial-gradient(circle, ${botData.color}15 0%, transparent 70%)`, animation: 'pulse 4s infinite alternate', pointerEvents: 'none' }} />
        <button onClick={() => { setIsImmersive(false); }} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: '24px', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 100000, touchAction: 'manipulation' }}>✕</button>
        
        <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '20px' }}>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', zIndex: 10 }}>
             <select value={currentModelId} onChange={(e) => { setCurrentModelId(e.target.value); }} disabled={timerState !== 'Idle'} style={{ padding: '8px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '8px', outline: 'none' }}>
                {availableModels.map((m: any) => <option key={m.id} value={m.id}>{getModelName(m)}</option>)}
             </select>
             <select value={currentTaskId} onChange={(e) => { setCurrentTaskId(e.target.value); }} disabled={timerState !== 'Idle' || tasks.length === 0} style={{ padding: '8px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '8px', outline: 'none' }}>
                {tasks.map((t_item: any) => <option key={t_item.id} value={t_item.id}>{t(t_item.name)}</option>)}
             </select>
          </div>

          <div className={`timer-display ${timerState.toLowerCase()} ${isTimeUp ? 'time-up' : ''}`} style={{ fontSize: 'clamp(80px, 20vw, 120px)', fontVariantNumeric: 'tabular-nums', fontWeight: 200, margin: '20px 0', textShadow: `0 0 40px ${botData.color}40` }}>{formatTime(activeSeconds)}</div>
          <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {timerState === 'Idle' && <button className="btn start" style={{ width: '140px', padding: '16px', fontSize: '18px', borderRadius: '30px' }} onClick={handleStart} disabled={!currentTaskId}>{t('start')}</button>}
            {timerState === 'Running' && <button className="btn pause" style={{ width: '140px', padding: '16px', fontSize: '18px', borderRadius: '30px' }} onClick={handlePause}>{t('pause')}</button>}
            {timerState === 'Paused' && (<><button className="btn resume" style={{ width: '140px', padding: '16px', fontSize: '18px', borderRadius: '30px' }} onClick={handleResume}>{t('resume')}</button><button className="btn complete" style={{ width: '140px', padding: '16px', fontSize: '18px', borderRadius: '30px' }} onClick={handleComplete}>{t('complete')}</button></>)}
          </div>
          <div style={{ color: '#555', fontSize: '12px', marginTop: '40px' }}>{t('hint_exit_immersive')}</div>
          <div style={{ marginTop: '20px', width: '100%', maxWidth: '500px', height: '200px' }}>{renderChatHistory(false)}</div>
        </div>
      </div>
    );
    return createPortal(immersiveContent, document.body);
  }

  const leftContent = (
    <>
      <div className="profile-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div 
            onClick={handleAvatarClick}
            style={{ 
              width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', 
              border: `2px solid ${botData.color}`, boxShadow: `0 0 10px ${botData.color}50`, 
              background: '#111', flexShrink: 0, cursor: 'pointer',
              transform: avatarBounce ? 'scale(1.2) translateY(-5px)' : 'scale(1) translateY(0)',
              transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
            title={t('title_poke_animold')}
          >
            <img src={botData.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>{username}</span>
              <span style={{ fontSize: '11px', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>Lv.{level}</span>
              {equippedTitleDef && <span style={{ fontSize: '11px', color: equippedTitleDef.color, background: `${equippedTitleDef.color}20`, padding: '2px 6px', borderRadius: '4px', border: `1px solid ${equippedTitleDef.color}50`, fontWeight: 'bold' }}>[{t(equippedTitleDef.nameKey)}]</span>}
            </div>
            <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>🕒 {localTime}</div>
          </div>
        </div>
        <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: `${levelProgress.percent}%`, height: '100%', background: `linear-gradient(90deg, ${botData.color}, #8b5cf6)`, borderRadius: '3px', transition: 'width 0.3s' }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ fontSize: '13px', color: '#10b981', fontWeight: 'bold', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>⏳ {t('today')}: {formatTime(todayTotal)}</div>
        {!isCheckedIn ? (
          <button className="mini-btn" style={{ background: '#f59e0b', color: '#000', border: 'none', fontWeight: 'bold', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }} onClick={handleCheckin}>📅 {t('checkin')}</button>
        ) : (
          <span style={{ color: '#10b981', fontSize: '12px', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '6px' }}>✅ {t('checkedIn')} ({checkinStreak}{isZh ? '天' : 'd'})</span>
        )}
      </div>

      <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>{renderChatHistory(false)}</div>
    </>
  );

  const rightContent = (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px', width: '100%' }}>
        <div className="add-controls" style={{ marginBottom: 0 }}>
          <button id="btn-add-model" className="add-btn-large" onClick={() => { setIsAddingModel(true); }} disabled={timerState !== 'Idle' || isFinishingPart}>+ {t('addModel')}</button>
          <button id="btn-add-task" className="add-btn-large" onClick={() => { setIsAddingTask(true); }} disabled={timerState !== 'Idle' || !currentModelId || isFinishingPart}>+ {t('addTask')}</button>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start', width: '100%', flexWrap: 'wrap' }}>
          {!isTauriEnv && (
            <button id="btn-web-pip" onClick={handleOpenWebPiP} style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#3b82f6', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', flexShrink: 0 }}>📺 {isZh ? '网页悬浮窗' : 'Web PiP'}</button>
          )}
          <button id="btn-mini-mode" onClick={handleToggleMiniMode} style={{ background: 'rgba(139, 92, 246, 0.2)', border: '1px solid #8b5cf6', color: '#8b5cf6', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', flexShrink: 0 }}>🔍 {isZh ? '专注极简模式' : 'Focus Mini Mode'}</button>
          <button onClick={() => { setIsImmersive(true); }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: botData.color, fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', padding: '6px 12px', borderRadius: '6px', flexShrink: 0 }}>⛶ {isZh ? '沉浸模式' : 'Immersive Mode'}</button>
        </div>
      </div>

      {isAddingModel && (
        <div className="inline-form vertical-form" style={{ position: 'relative', marginBottom: '16px' }}>
          <div className="search-autocomplete">
            <input 
              id="new-model-name" 
              autoFocus 
              placeholder={t('modelName')} 
              value={newModelNameInput} 
              onChange={e => { setNewModelNameInput(e.target.value); setSelectedGunpla(null); }} 
              onBlur={() => setTimeout(() => setSearchResults([]), 200)} 
              onFocus={(e: any) => { handleFocus(e); triggerModelSearch(); }} 
            />
            {/* 🌟 修复：状态机渲染（搜索中 / 无结果 / 结果列表） */}
            {!selectedGunpla && newModelNameInput.trim().length >= 2 && (
              <div className="autocomplete-dropdown">
                {isSearching && searchResults.length === 0 && (
                  <div className="autocomplete-item" style={{ textAlign: 'center', color: '#aaa', fontStyle: 'italic', cursor: 'default' }}>
                    🔄 {isZh ? '搜索中...' : 'Searching...'}
                  </div>
                )}
                {!isSearching && searchResults.length === 0 && (
                  <div className="autocomplete-item" style={{ textAlign: 'center', color: '#666', fontStyle: 'italic', cursor: 'default' }}>
                    ❌ {isZh ? '未找到匹配的机体，可手动输入名称' : 'No matching kits found. You can enter a custom name.'}
                  </div>
                )}
                {searchResults.map((item: any, idx: number) => {
                  const displayName = isZh ? item.name.zh : item.name.en;
                  const displaySeries = isZh ? item.series.zh : item.series.en;
                  return (
                    <div key={idx} className="autocomplete-item" onClick={() => { setNewModelNameInput(displayName); setNewModelSeriesInput(displaySeries); setNewModelGrade(item.grade); setSelectedGunpla(item); setSearchResults([]); }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span className="ac-grade">{item.grade}</span><strong style={{ color: '#fff' }}>{displayName}</strong></div>
                      <div className="ac-series">| {displaySeries}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <select id="new-model-grade" value={newModelGrade} onChange={e => { setNewModelGrade(e.target.value); }}>{['HG', 'RG', 'MG', 'MGEX', 'MGSD', 'FM', 'PG'].map(g => <option key={g} value={g}>{g}</option>)}</select>
          <input id="new-model-series" placeholder={t('series')} value={newModelSeriesInput} onChange={e => setNewModelSeriesInput(e.target.value)} disabled={!!selectedGunpla} onFocus={handleFocus} />
          <label className="checkbox-label">
            <input type="checkbox" checked={useDefaultTasks} onChange={e => { setUseDefaultTasks(e.target.checked); }} />
            {t('useDefaultTasks')}
          </label>
          {useDefaultTasks && (
            <label className="checkbox-label">
              <input type="checkbox" checked={isWholeBuild} onChange={e => { setIsWholeBuild(e.target.checked); }} />
              {t('whole_build')}
            </label>
          )}
          <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '8px' }}>
            <button className="btn start" style={{ flex: 1, padding: '8px' }} onClick={handleAddModel}>{t('save')}</button>
            <button className="btn no" style={{ flex: 1, padding: '8px' }} onClick={() => { setIsAddingModel(false); setSearchResults([]); }}>{t('cancel')}</button>
          </div>
        </div>
      )}

      {isAddingTask && (
        <div className="inline-form" style={{ marginBottom: '16px' }}>
          <input id="new-task-name" autoFocus placeholder={t('taskName')} value={newTaskName} onChange={e => setNewTaskName(e.target.value)} onKeyDown={e => {
            if (e.key === 'Enter' && newTaskName.trim()) {
              handleAddTask(newTaskName.trim()); setNewTaskName(''); setIsAddingTask(false);
            }
          }} onFocus={handleFocus} />
          <button onClick={() => { setIsAddingTask(false); }}>{t('cancel')}</button>
        </div>
      )}

      <div className="selector-group" style={{ marginBottom: '16px' }}>
        <div className="selector-row">
          <select value={currentModelId} onChange={(e) => { setCurrentModelId(e.target.value); }} disabled={timerState !== 'Idle' || lastSession !== null || isFinishingPart} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 14px', borderRadius: '8px', outline: 'none' }}>
            {availableModels.map((m: any) => <option key={m.id} value={m.id}>{getModelName(m)} {m.isRebuilding ? '🔧' : ''}</option>)}
          </select>
        </div>
        <div className="selector-row">
          <select value={currentTaskId} onChange={(e) => { setCurrentTaskId(e.target.value); }} disabled={timerState !== 'Idle' || tasks.length === 0 || lastSession !== null || isFinishingPart} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 14px', borderRadius: '8px', outline: 'none' }}>
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
        <div className="timebox-selector" style={{ justifyContent: 'center', margin: '10px 0', flexWrap: 'wrap', gap: '8px' }}>
          <span className="timebox-label" style={{ fontSize: '14px' }}>{t('timebox')}:</span>
          {[0, 10, 30, 60].map(min => (
            <button key={min} className={`timebox-btn ${timeboxTarget === min * 60 ? 'active' : ''}`} style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 'bold' }} onClick={() => handleSetTimeboxTarget(min)}>
              {min === 0 ? t('timeboxNone') : `${min}m`}
            </button>
          ))}
        </div>
      )}

      <div id="tour-timer" className={`timer-display ${timerState.toLowerCase()} ${isTimeUp ? 'time-up' : ''}`} style={{ fontSize: '88px', textShadow: '0 0 30px rgba(255,255,255,0.2)', width: '100%', margin: '14px 0' }}>{formatTime(activeSeconds)}</div>

      {timeboxTarget > 0 && timeboxElapsed > 0 && !isFinishingPart && (
        <div className={`timebox-remaining ${isTimeUp ? 'time-up' : ''}`} style={{ fontSize: '14px', marginBottom: '8px' }}>{isTimeUp ? t('timeboxEnd') : `⏳ ${formatTime(remainingSeconds)}`}</div>
      )}

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '8px 0', flexWrap: 'wrap' }}>
        {(['none', 'rain', 'wind', 'cafe'] as const).map(type => (
          <button key={type} onClick={() => { setAmbientType(type); }} style={{ background: ambientType === type ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255,255,255,0.05)', color: ambientType === type ? '#c4b5fd' : '#888', border: `1px solid ${ambientType === type ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`, padding: '6px 12px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
            {type === 'none' ? t('ambient_none') : type === 'rain' ? t('ambient_rain') : type === 'wind' ? t('ambient_wind') : t('ambient_cafe')}
          </button>
        ))}
      </div>

      {currentTask && timerState !== 'Running' && !lastSession && !isFinishingPart && (
        <div className="stages-panel" style={{ justifyContent: 'center', margin: '10px 0', flexWrap: 'wrap' }}>
          {currentTask.stages.map((stage: any) => (
            <button key={stage.id} className={`stage-btn ${stage.id === currentStageId ? 'active' : ''} ${stage.status === 'Completed' ? 'done' : ''}`} onClick={() => { setCurrentStageId(stage.id); }} disabled={timerState === 'Paused'}>
              {t(stage.nameKey)} {stage.status === 'Completed' ? '✓' : ''}
            </button>
          ))}
        </div>
      )}

      {isFinishingPart ? (
        <div className="inline-confirm" style={{ background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '12px', width: '100%', boxSizing: 'border-box' }}>
          <div className="confirm-text">🎉 {t('finishPart')}!</div>
          <div style={{ width: '100%', display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            <input type="text" value={finishPartPhoto.startsWith('data:') ? t('localImageSelected') : finishPartPhoto} onChange={e => setFinishPartPhoto(e.target.value)} placeholder={t('addPhotoUrl')} className="photo-input" style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid #555', color: '#fff', padding: '10px', borderRadius: '6px', outline: 'none', minWidth: '150px' }} disabled={finishPartPhoto.startsWith('data:')} onFocus={handleFocus} />
            <label className="btn no" style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', margin: 0, borderRadius: '6px', flexShrink: 0 }}>📁<input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} /></label>
          </div>
          {finishPartPhoto.startsWith('data:') && <img src={finishPartPhoto} alt="preview" style={{ width: '100%', maxHeight: '100px', objectFit: 'contain', borderRadius: '4px', marginTop: '12px' }} />}
          <div className="confirm-actions" style={{ marginTop: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <button className="btn yes" onClick={handleConfirmFinishPart}>{t('confirm')}</button>
            <button className="btn no" onClick={() => setIsFinishingPart(false)}>{t('cancel')}</button>
          </div>
        </div>
      ) : lastSession ? (
        <div className="inline-confirm" style={{ background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '12px', width: '100%', boxSizing: 'border-box' }}>
          <div className="confirm-text">{t('saved')}: {formatTime(lastSession.duration)}<br /><span>{t('confirmStage')}</span></div>
          <div className="confirm-actions" style={{ marginTop: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <button className="btn yes" onClick={handleConfirmStageDone}>{t('yesDone')}</button>
            <button className="btn no" onClick={handleCancelDone}>{t('keepWorking')}</button>
          </div>
        </div>
      ) : (
        <div className="controls" style={{ width: '100%', marginTop: '12px', flexWrap: 'wrap' }}>
          {timerState === 'Idle' && <button className="btn start" style={{ padding: '14px', fontSize: '16px' }} onClick={handleStart} disabled={!currentTaskId}>{t('start')}</button>}
          {timerState === 'Running' && <button className="btn pause" style={{ padding: '14px', fontSize: '16px' }} onClick={handlePause}>{t('pause')}</button>}
          {timerState === 'Paused' && (<><button className="btn resume" style={{ padding: '14px', fontSize: '16px' }} onClick={handleResume}>{t('resume')}</button><button className="btn complete" style={{ padding: '14px', fontSize: '16px' }} onClick={handleComplete}>{t('complete')}</button></>)}
        </div>
      )}
      {timerState === 'Running' && <button className="btn complete-outline" style={{ padding: '12px', marginTop: '10px', fontSize: '15px' }} onClick={handleComplete}>{t('complete')}</button>}
    </>
  );

  return (
    <div className="focus-layout">
      <div className="focus-left">{leftContent}</div>
      <div className="focus-right">{rightContent}</div>
    </div>
  );
};