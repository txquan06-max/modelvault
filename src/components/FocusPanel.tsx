// src/components/FocusPanel.tsx
import React, { useState, useEffect, useRef } from 'react';
import { AudioManager } from '../core/AudioManager';
import { QuoteEngine, BOTS, type BotType } from '../core/QuoteEngine';

interface ChatMessage {
  id: string;
  botId: BotType;
  text: string;
  timestamp: number;
}

export const FocusPanel = ({
  isPip, currentModelId, setCurrentModelId, currentTaskId, setCurrentTaskId, currentStageId, setCurrentStageId,
  models, tasks, currentTask, currentStage, timerState, activeSeconds, lastSession, todayTotal,
  timeboxTarget, timeboxElapsed, handleStart, handlePause, handleResume, handleComplete,
  handleConfirmStageDone, handleCancelDone, handleFinishPart,
  isFinishingPart, setIsFinishingPart, finishPartPhoto, setFinishPartPhoto, handleConfirmFinishPart,
  currentModel, getModelName, t, i18n, bgImage, bgSize, bgPosition, showToast, handleSetTimeboxTarget,
  username, level, levelProgress, isCheckedIn, checkinStreak, handleCheckin, handleFocus,
  currentBot,
  // 🌟 接收动态频率
  webChatInterval, pipChatInterval
}: any) => {
  
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem('mv_chat_messages');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return []; 
  });

  const [typingText, setTypingText] = useState('');
  const typingRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const botData = BOTS[currentBot as keyof typeof BOTS];

  useEffect(() => {
    sessionStorage.setItem('mv_chat_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    QuoteEngine.setBot(currentBot);
    if (messages.length === 0) {
      const initText = QuoteEngine.getStartQuote(i18n.language);
      setMessages([{ id: crypto.randomUUID(), botId: currentBot, text: initText, timestamp: Date.now() }]);
    }
  }, [currentBot, i18n.language, messages.length]);

  // 🌟 核心修改：动态频率、页面隐藏停止、防重复机制
  useEffect(() => {
    let chatTimer: any;

    const startTimer = () => {
      const interval = isPip ? pipChatInterval : webChatInterval;
      chatTimer = setInterval(() => {
        // 再次检查是否可见，双重保险
        if (document.visibilityState !== 'visible' && !isPip) return;
        
        const newText = QuoteEngine.getRandom(i18n.language); // 引擎自带防重复洗牌
        setMessages(prev => {
          const newMsgs = [...prev, { id: crypto.randomUUID(), botId: currentBot, text: newText, timestamp: Date.now() }];
          return newMsgs.slice(-5); // 保持最近5条
        });
      }, interval);
    };

    const stopTimer = () => {
      if (chatTimer) clearInterval(chatTimer);
    };

    // 页面可见性变化处理
    const handleVisibilityChange = () => {
      if (isPip) return; // 悬浮窗不受此限制
      if (document.visibilityState === 'visible') {
        startTimer();
      } else {
        stopTimer(); // 最小化或切后台时停止
      }
    };

    // 初始启动
    if (isPip || document.visibilityState === 'visible') {
      startTimer();
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopTimer();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentBot, i18n.language, isPip, webChatInterval, pipChatInterval]);

  const pushMessage = (type: 'start' | 'pause' | 'complete') => {
    const text = type === 'start' ? QuoteEngine.getStartQuote(i18n.language) 
               : type === 'pause' ? QuoteEngine.getPauseQuote(i18n.language) 
               : QuoteEngine.getCompleteQuote(i18n.language);
    setMessages(prev => [...prev, { id: crypto.randomUUID(), botId: currentBot, text, timestamp: Date.now() }].slice(-5));
  };

  const lastMsgIdRef = useRef<string | null>(null);
  
  // 🌟 核心修改：打字速度降低（100ms），音效频率降低（每3个字响一次）
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg) return;
    
    if (lastMsgIdRef.current === lastMsg.id) return;
    lastMsgIdRef.current = lastMsg.id;

    setTypingText('');
    let index = 0;
    const text = lastMsg.text;
    
    if (typingRef.current) clearInterval(typingRef.current);
    
    typingRef.current = setInterval(() => {
      if (index < text.length) {
        setTypingText(prev => prev + text.charAt(index));
        // 每 3 个字符响一次，不显得急促
        if (index % 3 === 0) AudioManager.playTypeTick();
        index++;
      } else {
        clearInterval(typingRef.current);
      }
    }, 100); // 从 60ms 改为 100ms，速度明显放慢，更优雅
    
    return () => { if (typingRef.current) clearInterval(typingRef.current); };
  }, [messages]);

  const handleLocalStart = () => { pushMessage('start'); handleStart(); };
  const handleLocalPause = () => { pushMessage('pause'); handlePause(); };
  const handleLocalComplete = () => { pushMessage('complete'); handleComplete(); };

  const currentTaskName = currentTask && currentTask.name ? t(currentTask.name) : t('noTask');
  const formatTime = (totalSec: number) => { const h = Math.floor(totalSec / 3600); const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0'); const s = (totalSec % 60).toString().padStart(2, '0'); if (h > 0) return `${h}:${m}:${s}`; return `${m}:${s}`; };
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
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            setFinishPartPhoto(canvas.toDataURL('image/jpeg', 0.6));
          };
        };
      } catch (err) { showToast(t('imageProcessingFailed') || 'Image processing failed'); }
    }
    e.target.value = '';
  };

  const pipClass = `pip-container ${timerState === 'Running' ? 'pip-running' : ''}`;
  const availableModels = models.filter((m: any) => m.status !== 'Completed');
  const localTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const renderChatHistory = (isPipView: boolean) => (
    <div style={{ 
      background: `linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))`, 
      border: `1px solid ${botData.color}50`, 
      borderRadius: '16px', 
      padding: '12px 16px', 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'flex-end', 
      gap: '12px',
      boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px ${botData.color}15`,
      backdropFilter: 'blur(12px)',
      transition: 'all 0.3s',
      flex: isPipView ? 'none' : 1,
      height: isPipView ? '120px' : '220px', 
      overflow: 'hidden', 
      position: 'relative',
      maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%)',
      WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%)'
    }}>
      {messages.map((msg, idx) => {
        const isLatest = idx === messages.length - 1;
        const msgBotData = BOTS[msg.botId];
        const msgBotName = i18n.language === 'zh' ? msgBotData.name : msgBotData.enName;
        const displayTxt = (isLatest && typingText.length < msg.text.length) ? typingText : msg.text;
        
        return (
          <div key={msg.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ 
              width: isPipView ? '24px' : '32px', 
              height: isPipView ? '24px' : '32px', 
              borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
              border: `2px solid ${msgBotData.color}`, boxShadow: `0 0 8px ${msgBotData.color}60`,
              background: '#111'
            }}>
              <img src={msgBotData.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1, marginTop: '2px' }}>
              <div style={{ color: msgBotData.color, fontWeight: 'bold', fontSize: isPipView ? '11px' : '13px', marginBottom: '4px' }}>
                {msgBotName}
              </div>
              <div style={{ fontSize: isPipView ? '12px' : '14px', color: '#e2e8f0', lineHeight: '1.5', fontFamily: 'system-ui, -apple-system, sans-serif', wordBreak: 'break-word' }}>
                {displayTxt}
                {isLatest && typingText.length < msg.text.length && (
                  <span style={{ animation: 'pulse 1s infinite', color: msgBotData.color, fontWeight: 'bold' }}>_</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={chatEndRef} />
    </div>
  );

  if (isPip) {
    return (
      <div className={pipClass}>
        {bgImage && <img src={bgImage} alt="bg" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: bgSize as any, objectPosition: bgPosition, zIndex: 0, opacity: 1 }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(30, 30, 30, 0.8)', zIndex: 1, backdropFilter: 'blur(10px)' }} />
        
        <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px', boxSizing: 'border-box' }}>
          {availableModels.length === 0 ? (
            <div style={{ color: '#aaa', textAlign: 'center', fontSize: '14px' }}>{t('noActiveModel')}</div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <select id="pip-model-select" value={currentModelId} onChange={(e) => { AudioManager.playClick(); setCurrentModelId(e.target.value); }} disabled={timerState !== 'Idle' || lastSession !== null || isFinishingPart} style={{ padding: '4px', background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '12px', outline: 'none' }}>
                  {availableModels.map((m: any) => <option key={m.id} value={m.id}>{getModelName(m)} {m.isRebuilding ? '🔧' : ''}</option>)}
                </select>
                <select id="pip-task-select" value={currentTaskId} onChange={(e) => { AudioManager.playClick(); setCurrentTaskId(e.target.value); }} disabled={timerState !== 'Idle' || tasks.length === 0 || lastSession !== null || isFinishingPart} style={{ padding: '4px', background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '12px', outline: 'none' }}>
                  {tasks.map((t_item: any) => <option key={t_item.id} value={t_item.id}>{t_item.status === 'Completed' ? '✅ ' : ''}{t(t_item.name)}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginTop: '10px' }}>
                <div className={`timer-display ${timerState.toLowerCase()} ${isTimeUp ? 'time-up' : ''}`} style={{ fontSize: '42px', fontWeight: 300, textShadow: '0 0 15px rgba(255,255,255,0.3)' }}>{formatTime(activeSeconds)}</div>
                
                {timerState === 'Idle' && !lastSession && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    {[0, 15, 30, 60].map(min => (
                      <button key={min} style={{ background: timeboxTarget === min * 60 ? 'rgba(59, 130, 246, 0.8)' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => handleSetTimeboxTarget(min)}>
                        {min === 0 ? t('timeboxNone') : `${min}m`}
                      </button>
                    ))}
                  </div>
                )}
                
                {currentTask && timerState !== 'Running' && !lastSession && !isFinishingPart && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginTop: '4px' }}>
                    {currentTask.stages.map((stage: any) => (
                      <button key={stage.id} style={{ background: stage.id === currentStageId ? 'rgba(59, 130, 246, 0.8)' : 'rgba(255,255,255,0.1)', color: stage.status === 'Completed' ? '#10b981' : '#fff', border: 'none', padding: '4px 6px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => { AudioManager.playClick(); setCurrentStageId(stage.id); }} disabled={timerState === 'Paused'}>
                        {t(stage.nameKey)} {stage.status === 'Completed' ? '✓' : ''}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {isFinishingPart ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <input id="pip-photo-url" type="text" value={finishPartPhoto.startsWith('data:') ? t('localImageSelected') : finishPartPhoto} onChange={e => setFinishPartPhoto(e.target.value)} placeholder={t('addPhotoUrl')} style={{ fontSize: '11px', padding: '6px', background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', outline: 'none' }} disabled={finishPartPhoto.startsWith('data:')} />
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn yes" style={{ flex: 1, padding: '6px', fontSize: '12px', borderRadius: '6px' }} onClick={handleConfirmFinishPart}>{t('confirm')}</button>
                      <button className="btn no" style={{ flex: 1, padding: '6px', fontSize: '12px', borderRadius: '6px' }} onClick={() => setIsFinishingPart(false)}>{t('cancel')}</button>
                    </div>
                  </div>
                ) : lastSession ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '12px', color: '#10b981', textAlign: 'center', fontWeight: 'bold' }}>{t('saved')}: {formatTime(lastSession.duration)}</div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn yes" style={{ flex: 1, padding: '6px', fontSize: '12px', borderRadius: '6px' }} onClick={handleConfirmStageDone}>{t('yesDone')}</button>
                      <button className="btn no" style={{ flex: 1, padding: '6px', fontSize: '12px', borderRadius: '6px' }} onClick={handleCancelDone}>{t('keepWorking')}</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {timerState === 'Idle' && <button className="btn start" style={{ flex: 1, padding: '8px', fontSize: '13px', borderRadius: '6px' }} onClick={handleLocalStart} disabled={!currentTaskId}>{t('start')}</button>}
                    {timerState === 'Running' && <button className="btn pause" style={{ flex: 1, padding: '8px', fontSize: '13px', borderRadius: '6px' }} onClick={handleLocalPause}>{t('pause')}</button>}
                    {timerState === 'Paused' && (
                      <>
                        <button className="btn resume" style={{ flex: 1, padding: '8px', fontSize: '13px', borderRadius: '6px' }} onClick={handleResume}>{t('resume')}</button>
                        <button className="btn complete" style={{ flex: 1, padding: '8px', fontSize: '13px', borderRadius: '6px' }} onClick={handleLocalComplete}>{t('complete')}</button>
                      </>
                    )}
                  </div>
                )}

                {renderChatHistory(true)}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="focus-layout">
      
      <div className="focus-left">
        
        <div className="profile-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
          <div style={{ 
            width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden',
            border: `2px solid ${botData.color}`, boxShadow: `0 0 10px ${botData.color}50`,
            background: '#111'
          }}>
            <img src={botData.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>
              {username} <span style={{ fontSize: '11px', color: '#f59e0b', marginLeft: '6px', background: 'rgba(245, 158, 11, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>Lv.{level}</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${levelProgress.percent}%`, height: '100%', background: `linear-gradient(90deg, ${botData.color}, #8b5cf6)`, borderRadius: '3px', transition: 'width 0.3s' }} />
            </div>
          </div>
          <div style={{ fontSize: '13px', color: '#ccc', fontVariantNumeric: 'tabular-nums' }}>🕒 {localTime}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', color: '#10b981', fontWeight: 'bold', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            ⏳ {t('today')}: {formatTime(todayTotal)}
          </div>
          {!isCheckedIn ? (
            <button className="mini-btn" style={{ background: '#f59e0b', color: '#000', border: 'none', fontWeight: 'bold', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }} onClick={handleCheckin}>
              📅 打卡
            </button>
          ) : (
            <span style={{ color: '#10b981', fontSize: '12px', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '6px' }}>✅ 已打卡 ({checkinStreak}天)</span>
          )}
        </div>

        {renderChatHistory(false)}
      </div>

      <div className="focus-right">
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
          <div className="timebox-selector" style={{ justifyContent: 'center', margin: '20px 0' }}>
            <span className="timebox-label">{t('timebox')}:</span>
            {[0, 10, 30, 60].map(min => (
              <button key={min} className={`timebox-btn ${timeboxTarget === min * 60 ? 'active' : ''}`} onClick={() => handleSetTimeboxTarget(min)}>
                {min === 0 ? t('timeboxNone') : `${min}m`}
              </button>
            ))}
          </div>
        )}
        
        <div className={`timer-display ${timerState.toLowerCase()} ${isTimeUp ? 'time-up' : ''}`} style={{ fontSize: '72px', textShadow: '0 0 30px rgba(255,255,255,0.2)' }}>{formatTime(activeSeconds)}</div>
        
        {timeboxTarget > 0 && timeboxElapsed > 0 && !isFinishingPart && (
          <div className={`timebox-remaining ${isTimeUp ? 'time-up' : ''}`}>{isTimeUp ? t('timeboxEnd') : `⏳ ${formatTime(remainingSeconds)}`}</div>
        )}
        
        {currentTask && timerState !== 'Running' && !lastSession && !isFinishingPart && (
          <div className="stages-panel" style={{ justifyContent: 'center', margin: '20px 0' }}>
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
            <div style={{ width: '100%', display: 'flex', gap: '8px', marginTop: '12px' }}>
              <input id="pip-photo-url" type="text" value={finishPartPhoto.startsWith('data:') ? t('localImageSelected') : finishPartPhoto} onChange={e => setFinishPartPhoto(e.target.value)} placeholder={t('addPhotoUrl')} className="photo-input" style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid #555', color: '#fff', padding: '10px', borderRadius: '6px', outline: 'none' }} disabled={finishPartPhoto.startsWith('data:')} onFocus={handleFocus} />
              <label className="btn no" style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', margin: 0, borderRadius: '6px' }}>
                📁<input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>
            {finishPartPhoto.startsWith('data:') && <img src={finishPartPhoto} alt="preview" style={{ width: '100%', maxHeight: '100px', objectFit: 'contain', borderRadius: '4px', marginTop: '12px' }} />}
            <div className="confirm-actions" style={{ marginTop: '16px' }}>
              <button className="btn yes" onClick={handleConfirmFinishPart}>{t('confirm')}</button>
              <button className="btn no" onClick={() => setIsFinishingPart(false)}>{t('cancel')}</button>
            </div>
          </div>
        ) : lastSession ? (
          <div className="inline-confirm" style={{ background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '12px', width: '100%', boxSizing: 'border-box' }}>
            <div className="confirm-text">{t('saved')}: {formatTime(lastSession.duration)}<br/><span>{t('confirmStage')}</span></div>
            <div className="confirm-actions" style={{ marginTop: '16px' }}>
              <button className="btn yes" onClick={handleConfirmStageDone}>{t('yesDone')}</button>
              <button className="btn no" onClick={handleCancelDone}>{t('keepWorking')}</button>
            </div>
          </div>
        ) : (
          <div className="controls" style={{ width: '100%', marginTop: '20px' }}>
            {timerState === 'Idle' && <button className="btn start" style={{ padding: '16px', fontSize: '18px' }} onClick={handleLocalStart} disabled={!currentTaskId}>{t('start')}</button>}
            {timerState === 'Running' && <button className="btn pause" style={{ padding: '16px', fontSize: '18px' }} onClick={handleLocalPause}>{t('pause')}</button>}
            {timerState === 'Paused' && (<><button className="btn resume" style={{ padding: '16px', fontSize: '18px' }} onClick={handleResume}>{t('resume')}</button><button className="btn complete" style={{ padding: '16px', fontSize: '18px' }} onClick={handleLocalComplete}>{t('complete')}</button></>)}
          </div>
        )}
        {timerState === 'Running' && <button className="btn complete-outline" style={{ padding: '12px', marginTop: '12px' }} onClick={handleLocalComplete}>{t('complete')}</button>}
      </div>
    </div>
  );
};