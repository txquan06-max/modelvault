import React from 'react';
import { AudioManager } from '../core/AudioManager';

export const FocusPanel = ({
  isPip, currentModelId, setCurrentModelId, currentTaskId, setCurrentTaskId, currentStageId, setCurrentStageId,
  models, tasks, currentTask, currentStage, timerState, activeSeconds, lastSession,
  timeboxTarget, timeboxElapsed, handleStart, handlePause, handleResume, handleComplete,
  handleConfirmStageDone, handleCancelDone, handleFinishPart,
  isFinishingPart, setIsFinishingPart, finishPartPhoto, setFinishPartPhoto, handleConfirmFinishPart,
  currentModel, getModelName, t, bgImage, bgSize, bgPosition, showToast, handleSetTimeboxTarget
}: any) => {
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
        {bgImage && (
          <img src={bgImage} alt="bg" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: bgSize as any, objectPosition: bgPosition, zIndex: 0, opacity: 1 }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1 }} />
        <div style={{ position: 'relative', zIndex: 2, width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          {availableModels.length === 0 ? (
            <div style={{ color: '#aaa', textAlign: 'center', fontSize: '14px', marginTop: '40px' }}>暂无制作中的模型<br/>请去主页添加</div>
          ) : (
            <>
              <div className="selector-group" style={{ marginBottom: '0' }}>
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
              <div className="task-header" style={{ justifyContent: 'center', flexDirection: 'column', gap: '4px' }}>
                <div className="task-name" style={{ fontSize: '15px' }}>{currentTaskName}</div>
                {currentTask && currentTask.status !== 'Completed' && timerState === 'Idle' && !lastSession && !isFinishingPart && (
                  <button className="finish-part-btn" style={{ fontSize: '10px', padding: '2px 6px' }} onClick={handleFinishPart}>✓ {t('finishPart')}</button>
                )}
              </div>
              <div className={`timer-display ${timerState.toLowerCase()} ${isTimeUp ? 'time-up' : ''}`} style={{ margin: '10px 0', fontSize: '42px' }}>{formatTime(activeSeconds)}</div>
              {isFinishingPart ? (
                <div className="inline-confirm">
                  <div className="confirm-text" style={{ fontSize: '12px' }}>🎉 {t('finishPart')}!</div>
                  <div style={{ width: '100%', display: 'flex', gap: '8px' }}>
                    <input id="pip-photo-url" type="text" value={finishPartPhoto.startsWith('data:') ? t('localImageSelected') : finishPartPhoto} onChange={e => setFinishPartPhoto(e.target.value)} placeholder={t('addPhotoUrl')} className="photo-input" style={{ flex: 1, fontSize: '11px', padding: '4px' }} disabled={finishPartPhoto.startsWith('data:')} onFocus={handleFocus} />
                    <label className="btn no" style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', margin: 0 }}>
                      📁<input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                    </label>
                  </div>
                  {finishPartPhoto.startsWith('data:') && <img src={finishPartPhoto} alt="preview" style={{ width: '100%', maxHeight: '60px', objectFit: 'contain', borderRadius: '4px' }} />}
                  <div className="confirm-actions" style={{ flexDirection: 'column' }}>
                    <button className="btn yes" onClick={handleConfirmFinishPart}>{t('confirm')}</button>
                    <button className="btn no" onClick={() => setIsFinishingPart(false)}>{t('cancel')}</button>
                  </div>
                </div>
              ) : lastSession ? (
                <div className="inline-confirm">
                  <div className="confirm-text" style={{ fontSize: '12px' }}>{t('saved')}: {formatTime(lastSession.duration)}<br/><span>{t('confirmStage')}</span></div>
                  <div className="confirm-actions" style={{ flexDirection: 'column' }}>
                    <button className="btn yes" onClick={handleConfirmStageDone}>{t('yesDone')}</button>
                    <button className="btn no" onClick={handleCancelDone}>{t('keepWorking')}</button>
                  </div>
                </div>
              ) : (
                <div className="controls" style={{ flexDirection: 'column' }}>
                  {timerState === 'Idle' && <button className="btn start" onClick={handleStart} disabled={!currentTaskId}>{t('start')}</button>}
                  {timerState === 'Running' && <button className="btn pause" onClick={handlePause}>{t('pause')}</button>}
                  {timerState === 'Paused' && (<><button className="btn resume" onClick={handleResume}>{t('resume')}</button><button className="btn complete" onClick={handleComplete}>{t('complete')}</button></>)}
                </div>
              )}
              {timerState === 'Running' && <button className="btn complete-outline" onClick={handleComplete} style={{ padding: '6px' }}>{t('complete')}</button>}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="view-content focus-panel">
      {availableModels.length === 0 ? (
         <div className="empty-state" style={{ marginTop: '20px' }}>没有进行中的模型啦！<br/>点击上方“添加模型”开始新的挑战吧 🚀</div>
      ) : (
        <>
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
              {timerState === 'Idle' && <button className="btn start" onClick={handleStart} disabled={!currentTaskId}>{t('start')}</button>}
              {timerState === 'Running' && <button className="btn pause" onClick={handlePause}>{t('pause')}</button>}
              {timerState === 'Paused' && (<><button className="btn resume" onClick={handleResume}>{t('resume')}</button><button className="btn complete" onClick={handleComplete}>{t('complete')}</button></>)}
            </div>
          )}
          {timerState === 'Running' && <button className="btn complete-outline" onClick={handleComplete}>{t('complete')}</button>}
        </>
      )}
    </div>
  );
};