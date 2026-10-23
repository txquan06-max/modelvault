import React, { useState, useEffect, useRef } from 'react';
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
  currentBot, chatMessages 
}: any) => {
  
  const [charIndex, setCharIndex] = useState(0);
  // 🌟 新增：沉浸模式状态
  const [isImmersive, setIsImmersive] = useState(false);
  const typingRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const lastMsgIdRef = useRef<string | null>(null);
  
  const botData = BOTS[currentBot as BotType] || BOTS['tu'];

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
            canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
            setFinishPartPhoto(canvas.toDataURL('image/jpeg', 0.6));
          };
        };
      } catch (err) { showToast('图片处理失败'); }
    }
    e.target.value = '';
  };

  const pipClass = `pip-container ${timerState === 'Running' ? 'pip-running' : ''}`;
  const availableModels = models.filter((m: any) => m.status !== 'Completed');

  const renderChatHistory = (isPipView: boolean) => (
    <div style={{ 
      background: `linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))`, 
      border: `1px solid ${botData.color}50`, 
      borderRadius: '16px', 
      padding: '12px 16px', 
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '12px',
      boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px ${botData.color}15`,
      backdropFilter: 'blur(12px)', transition: 'all 0.3s',
      flex: isPipView ? 'none' : 1,
      height: isPipView ? '120px' : '220px', 
      overflow: 'hidden', position: 'relative',
      maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%)',
      WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%)'
    }}>
      {chatMessages.map((msg: any, idx: number) => {
        const isLatest = idx === chatMessages.length - 1;
        const msgBotData = BOTS[msg.botId as BotType] || BOTS['tu']; 
        const msgBotName = i18n.language === 'zh' ? msgBotData.name : msgBotData.enName;
        const displayTxt = isLatest ? msg.text.slice(0, charIndex) : msg.text;
        
        return (
          <div key={msg.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ width: isPipView ? '24px' : '32px', height: isPipView ? '24px' : '32px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `2px solid ${msgBotData.color}`, boxShadow: `0 0 8px ${msgBotData.color}60`, background: '#111' }}>
              <img src={msgBotData.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1, marginTop: '2px' }}>
              <div style={{ color: msgBotData.color, fontWeight: 'bold', fontSize: isPipView ? '11px' : '13px', marginBottom: '4px' }}>{msgBotName}</div>
              <div style={{ fontSize: isPipView ? '12px' : '14px', color: '#e2e8f0', lineHeight: '1.5', fontFamily: 'system-ui, -apple-system, sans-serif', wordBreak: 'break-word' }}>
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
                    {timerState === 'Idle' && <button className="btn start" style={{ flex: 1, padding: '8px', fontSize: '13px', borderRadius: '6px' }} onClick={handleStart} disabled={!currentTaskId}>{t('start')}</button>}
                    {timerState === 'Running' && <button className="btn pause" style={{ flex: 1, padding: '8px', fontSize: '13px', borderRadius: '6px' }} onClick={handlePause}>{t('pause')}</button>}
                    {timerState === 'Paused' && (
                      <>
                        <button className="btn resume" style={{ flex: 1, padding: '8px', fontSize: '13px', borderRadius: '6px' }} onClick={handleResume}>{t('resume')}</button>
                        <button className="btn complete" style={{ flex: 1, padding: '8px', fontSize: '13px', borderRadius: '6px' }} onClick={handleComplete}>{t('complete')}</button>
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

  // 🌟 沉浸模式 UI 渲染
  if (isImmersive) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#09090b', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.5s ease-out' }}>
        {/* 呼吸光晕背景 */}
        <div style={{ position: 'absolute', width: '80vw', height: '80vw', maxWidth: '600px', maxHeight: '600px', borderRadius: '50%', background: `radial-gradient(circle, ${botData.color}15 0%, transparent 70%)`, animation: 'pulse 4s infinite alternate', pointerEvents: 'none' }} />
        
        <button id="btn-pip" onClick={() => { AudioManager.playClick(); setIsImmersive(false); }} style={{ position: 'absolute', top: '30px', right: '30px', background: 'transparent', border: 'none', color: '#666', fontSize: '24px', cursor: 'pointer' }}>✕</button>

        <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ color: botData.color, fontSize: '16px', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '10px', opacity: 0.8 }}>
            {currentModel ? getModelName(currentModel) : ''} - {currentTaskName}
          </div>
          
          <div id="tour-timer" className={`timer-display ${timerState.toLowerCase()} ${isTimeUp ? 'time-up' : ''}`} style={{ fontSize: '120px', fontVariantNumeric: 'tabular-nums', fontWeight: 200, margin: '20px 0', textShadow: `0 0 40px ${botData.color}40` }}>
            {formatTime(activeSeconds)}
          </div>

          <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
             {timerState === 'Idle' && <button className="btn start" style={{ width: '160px', padding: '16px', fontSize: '18px', borderRadius: '30px' }} onClick={handleStart} disabled={!currentTaskId}>{t('start')}</button>}
             {timerState === 'Running' && <button className="btn pause" style={{ width: '160px', padding: '16px', fontSize: '18px', borderRadius: '30px' }} onClick={handlePause}>{t('pause')}</button>}
             {timerState === 'Paused' && (
               <>
                 <button className="btn resume" style={{ width: '160px', padding: '16px', fontSize: '18px', borderRadius: '30px' }} onClick={handleResume}>{t('resume')}</button>
                 <button className="btn complete" style={{ width: '160px', padding: '16px', fontSize: '18px', borderRadius: '30px' }} onClick={handleComplete}>{t('complete')}</button>
               </>
             )}
          </div>

          <div style={{ marginTop: '60px', width: '100%', maxWidth: '500px' }}>
             {renderChatHistory(false)}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 普通视图
  // =========================================================================
  return (
    <div className="focus-layout">
      
      <div className="focus-left">
        
        <div className="profile-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', border: `2px solid ${botData.color}`, boxShadow: `0 0 10px ${botData.color}50`, background: '#111' }}>
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
        {/* 🌟 沉浸模式入口 */}
        <button onClick={() => { AudioManager.playClick(); setIsImmersive(true); }} style={{ alignSelf: 'flex-end', marginBottom: '10px', background: 'transparent', border: 'none', color: botData.color, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
          ⛶ 沉浸模式
        </button>

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
        
        <div id="tour-timer" className={`timer-display ${timerState.toLowerCase()} ${isTimeUp ? 'time-up' : ''}`} style={{ fontSize: '72px', textShadow: '0 0 30px rgba(255,255,255,0.2)' }}>{formatTime(activeSeconds)}</div>
        
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
            {timerState === 'Idle' && <button className="btn start" style={{ padding: '16px', fontSize: '18px' }} onClick={handleStart} disabled={!currentTaskId}>{t('start')}</button>}
            {timerState === 'Running' && <button className="btn pause" style={{ padding: '16px', fontSize: '18px' }} onClick={handlePause}>{t('pause')}</button>}
            {timerState === 'Paused' && (<><button className="btn resume" style={{ padding: '16px', fontSize: '18px' }} onClick={handleResume}>{t('resume')}</button><button className="btn complete" style={{ padding: '16px', fontSize: '18px' }} onClick={handleComplete}>{t('complete')}</button></>)}
          </div>
        )}
        {timerState === 'Running' && <button className="btn complete-outline" style={{ padding: '12px', marginTop: '12px' }} onClick={handleComplete}>{t('complete')}</button>}
      </div>
    </div>
  );
};