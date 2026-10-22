import React, { useState, useEffect, useRef } from 'react';
import { AudioManager } from '../core/AudioManager';
import { QuoteEngine } from '../core/QuoteEngine';

export const FocusPanel = ({
  isPip, currentModelId, setCurrentModelId, currentTaskId, setCurrentTaskId, currentStageId, setCurrentStageId,
  models, tasks, currentTask, currentStage, timerState, activeSeconds, lastSession, // 🌟 删除了 todayTotal
  timeboxTarget, timeboxElapsed, handleStart, handlePause, handleResume, handleComplete,
  handleConfirmStageDone, handleCancelDone, handleFinishPart,
  isFinishingPart, setIsFinishingPart, finishPartPhoto, setFinishPartPhoto, handleConfirmFinishPart,
  currentModel, getModelName, t, bgImage, bgSize, bgPosition, showToast, handleSetTimeboxTarget
}: any) => {
  
  // 🌟 打字机效果核心逻辑
  const [quote, setQuote] = useState(QuoteEngine.getRandom());
  const [displayedQuote, setDisplayedQuote] = useState('');
  const typingRef = useRef<any>(null);

  useEffect(() => {
    setDisplayedQuote('');
    let currentIndex = 0;
    clearInterval(typingRef.current);

    typingRef.current = setInterval(() => {
      if (currentIndex < quote.length) {
        setDisplayedQuote((prev) => prev + quote[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(typingRef.current);
      }
    }, 80);

    return () => clearInterval(typingRef.current);
  }, [quote]);

  useEffect(() => {
    if (timerState === 'Running') {
      const timer = setInterval(() => setQuote(QuoteEngine.getRandom()), 25000);
      return () => clearInterval(timer);
    } else if (timerState === 'Idle' && activeSeconds === 0) {
      setQuote(QuoteEngine.getRandom());
    }
  }, [timerState, activeSeconds]);

  const handleLocalStart = () => { setQuote(QuoteEngine.getStartQuote()); handleStart(); };
  const handleLocalPause = () => { setQuote(QuoteEngine.getPauseQuote()); handlePause(); };
  const handleLocalComplete = () => { setQuote(QuoteEngine.getCompleteQuote()); handleComplete(); };

  const currentTaskName = currentTask ? t(currentTask.name) : t('noTask');
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

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setTimeout(() => { e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 300);
  };

  const pipClass = `pip-container ${timerState === 'Running' ? 'pip-running' : ''}`;
  const availableModels = models.filter((m: any) => m.status !== 'Completed');

  if (isPip) {
    return (
      <div className={pipClass}>
        {bgImage && <img src={bgImage} alt="bg" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: bgSize as any, objectPosition: bgPosition, zIndex: 0, opacity: 1 }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1 }} />
        
        <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px', boxSizing: 'border-box' }}>
          
          {availableModels.length === 0 ? (
            <div style={{ color: '#aaa', textAlign: 'center', fontSize: '14px' }}>{t('noActiveModel')}</div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <select id="pip-model-select" value={currentModelId} onChange={(e) => { AudioManager.playClick(); setCurrentModelId(e.target.value); }} disabled={timerState !== 'Idle' || lastSession !== null || isFinishingPart} style={{ padding: '4px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px', fontSize: '12px' }}>
                  {availableModels.map((m: any) => <option key={m.id} value={m.id}>{getModelName(m)} {m.isRebuilding ? '🔧' : ''}</option>)}
                </select>
                <select id="pip-task-select" value={currentTaskId} onChange={(e) => { AudioManager.playClick(); setCurrentTaskId(e.target.value); }} disabled={timerState !== 'Idle' || tasks.length === 0 || lastSession !== null || isFinishingPart} style={{ padding: '4px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px', fontSize: '12px' }}>
                  {tasks.map((t_item: any) => <option key={t_item.id} value={t_item.id}>{t_item.status === 'Completed' ? '✅ ' : ''}{t(t_item.name)}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginTop: '10px' }}>
                <div className={`timer-display ${timerState.toLowerCase()} ${isTimeUp ? 'time-up' : ''}`} style={{ fontSize: '36px' }}>{formatTime(activeSeconds)}</div>
                
                {timerState === 'Idle' && !lastSession && (
                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                    {[0, 15, 30, 60].map(min => (
                      <button key={min} style={{ background: timeboxTarget === min * 60 ? '#3b82f6' : '#333', color: '#fff', border: 'none', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }} onClick={() => handleSetTimeboxTarget(min)}>
                        {min === 0 ? t('timeboxNone') : `${min}m`}
                      </button>
                    ))}
                  </div>
                )}
                
                {currentTask && timerState !== 'Running' && !lastSession && !isFinishingPart && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center', marginTop: '4px' }}>
                    {currentTask.stages.map((stage: any) => (
                      <button key={stage.id} style={{ background: stage.id === currentStageId ? '#3b82f6' : '#333', color: stage.status === 'Completed' ? '#10b981' : '#fff', border: '1px solid #555', padding: '2px 4px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }} onClick={() => { AudioManager.playClick(); setCurrentStageId(stage.id); }} disabled={timerState === 'Paused'}>
                        {t(stage.nameKey)} {stage.status === 'Completed' ? '✓' : ''}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {isFinishingPart ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <input id="pip-photo-url" type="text" value={finishPartPhoto.startsWith('data:') ? t('localImageSelected') : finishPartPhoto} onChange={e => setFinishPartPhoto(e.target.value)} placeholder={t('addPhotoUrl')} style={{ fontSize: '11px', padding: '4px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px' }} disabled={finishPartPhoto.startsWith('data:')} />
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn yes" style={{ flex: 1, padding: '4px', fontSize: '12px' }} onClick={handleConfirmFinishPart}>{t('confirm')}</button>
                      <button className="btn no" style={{ flex: 1, padding: '4px', fontSize: '12px' }} onClick={() => setIsFinishingPart(false)}>{t('cancel')}</button>
                    </div>
                  </div>
                ) : lastSession ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#10b981', textAlign: 'center' }}>{t('saved')}: {formatTime(lastSession.duration)}</div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn yes" style={{ flex: 1, padding: '4px', fontSize: '12px' }} onClick={handleConfirmStageDone}>{t('yesDone')}</button>
                      <button className="btn no" style={{ flex: 1, padding: '4px', fontSize: '12px' }} onClick={handleCancelDone}>{t('keepWorking')}</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {timerState === 'Idle' && <button className="btn start" style={{ flex: 1, padding: '6px', fontSize: '12px' }} onClick={handleLocalStart} disabled={!currentTaskId}>{t('start')}</button>}
                    {timerState === 'Running' && <button className="btn pause" style={{ flex: 1, padding: '6px', fontSize: '12px' }} onClick={handleLocalPause}>{t('pause')}</button>}
                    {timerState === 'Paused' && (
                      <>
                        <button className="btn resume" style={{ flex: 1, padding: '6px', fontSize: '12px' }} onClick={handleResume}>{t('resume')}</button>
                        <button className="btn complete" style={{ flex: 1, padding: '6px', fontSize: '12px' }} onClick={handleLocalComplete}>{t('complete')}</button>
                      </>
                    )}
                  </div>
                )}

                <div style={{ 
                  background: '#000', border: '1px solid #10b981', borderRadius: '4px', padding: '6px', 
                  fontFamily: 'monospace', fontSize: '11px', color: '#10b981', minHeight: '40px', 
                  boxShadow: '0 0 8px rgba(16, 185, 129, 0.2)', position: 'relative'
                }}>
                  <span style={{ opacity: 0.5 }}>root@modelvault:~$ </span>
                  <span>{displayedQuote}</span>
                  <span style={{ animation: 'pulse 1s infinite', opacity: displayedQuote.length < quote.length ? 0 : 1 }}>_</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="view-content focus-panel">
      {availableModels.length === 0 ? (
         <div className="empty-state" style={{ marginTop: '20px' }}>
           {t('noActiveModelDesc')}<br/>
           <span style={{ fontSize: '12px', color: '#888' }}>{t('clickAddModel')}</span>
         </div>
      ) : (
        <>
          <div style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid #3b82f6', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)' }}>
            <div style={{ fontSize: '24px', animation: timerState === 'Running' ? 'pulse 2s infinite' : 'none' }}>🤖</div>
            <div style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: '1.4' }}>
              {displayedQuote}
              <span style={{ animation: 'pulse 1s infinite' }}>|</span>
            </div>
          </div>

          <div className="selector-group">
            <div className="selector-row">
              <select id="pip-model-select" value={currentModelId} onChange={(e) => { AudioManager.playClick(); setCurrentModelId(e.target.value); }} disabled={timerState !== 'Idle' || lastSession !== null || isFinishingPart}>
                {availableModels.map((m: any) => <option key={m.id} value={m.id}>{getModelName(m)} {m.isRebuilding ? '🔧' : ''}</option>)}
              </select>
            </div>
            <div className="selector-row">
              <select id="pip-task-select" value={currentTaskId} onChange={(e) => { AudioManager.playClick(); setCurrentTaskId(e.target.value); }} disabled={timerState !== 'Idle' || tasks.length === 0 || lastSession !== null || isFinishingPart}>
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
            <div className="timebox-selector">
              <span className="timebox-label">{t('timebox')}:</span>
              {[0, 10, 30, 60].map(min => (
                <button key={min} className={`timebox-btn ${timeboxTarget === min * 60 ? 'active' : ''}`} onClick={() => handleSetTimeboxTarget(min)}>
                  {min === 0 ? t('timeboxNone') : `${min}m`}
                </button>
              ))}
            </div>
          )}
          <div className={`timer-display ${timerState.toLowerCase()} ${isTimeUp ? 'time-up' : ''}`}>{formatTime(activeSeconds)}</div>
          {timeboxTarget > 0 && timeboxElapsed > 0 && !isFinishingPart && (
            <div className={`timebox-remaining ${isTimeUp ? 'time-up' : ''}`}>{isTimeUp ? t('timeboxEnd') : `⏳ ${formatTime(remainingSeconds)}`}</div>
          )}
          {currentTask && timerState !== 'Running' && !lastSession && !isFinishingPart && (
            <div className="stages-panel">
              {currentTask.stages.map((stage: any) => (
                <button key={stage.id} className={`stage-btn ${stage.id === currentStageId ? 'active' : ''} ${stage.status === 'Completed' ? 'done' : ''}`} onClick={() => { AudioManager.playClick(); setCurrentStageId(stage.id); }} disabled={timerState === 'Paused'}>
                  {t(stage.nameKey)} {stage.status === 'Completed' ? '✓' : ''}
                </button>
              ))}
            </div>
          )}
          {isFinishingPart ? (
            <div className="inline-confirm">
              <div className="confirm-text">🎉 {t('finishPart')}!</div>
              <div style={{ width: '100%', display: 'flex', gap: '8px' }}>
                <input id="pip-photo-url" type="text" value={finishPartPhoto.startsWith('data:') ? t('localImageSelected') : finishPartPhoto} onChange={e => setFinishPartPhoto(e.target.value)} placeholder={t('addPhotoUrl')} className="photo-input" style={{ flex: 1 }} disabled={finishPartPhoto.startsWith('data:')} onFocus={handleFocus} />
                <label className="btn no" style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', margin: 0 }}>
                  📁<input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              </div>
              {finishPartPhoto.startsWith('data:') && <img src={finishPartPhoto} alt="preview" style={{ width: '100%', maxHeight: '100px', objectFit: 'contain', borderRadius: '4px', marginTop: '4px' }} />}
              <div className="confirm-actions">
                <button className="btn yes" onClick={handleConfirmFinishPart}>{t('confirm')}</button>
                <button className="btn no" onClick={() => setIsFinishingPart(false)}>{t('cancel')}</button>
              </div>
            </div>
          ) : lastSession ? (
            <div className="inline-confirm">
              <div className="confirm-text">{t('saved')}: {formatTime(lastSession.duration)}<br/><span>{t('confirmStage')}</span></div>
              <div className="confirm-actions">
                <button className="btn yes" onClick={handleConfirmStageDone}>{t('yesDone')}</button>
                <button className="btn no" onClick={handleCancelDone}>{t('keepWorking')}</button>
              </div>
            </div>
          ) : (
            <div className="controls">
              {timerState === 'Idle' && <button className="btn start" onClick={handleLocalStart} disabled={!currentTaskId}>{t('start')}</button>}
              {timerState === 'Running' && <button className="btn pause" onClick={handleLocalPause}>{t('pause')}</button>}
              {timerState === 'Paused' && (<><button className="btn resume" onClick={handleResume}>{t('resume')}</button><button className="btn complete" onClick={handleLocalComplete}>{t('complete')}</button></>)}
            </div>
          )}
          {timerState === 'Running' && <button className="btn complete-outline" onClick={handleLocalComplete}>{t('complete')}</button>}
        </>
      )}
    </div>
  );
};