import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { TimerEngine } from './core/TimerEngine';
import { SessionManager } from './core/SessionManager';
import { ModelManager } from './core/ModelManager';
import { AchievementManager } from './core/AchievementManager';
import { AudioManager } from './core/AudioManager';
import { StorageManager } from './core/StorageManager';
import { UserManager } from './core/UserManager';
import { GunplaSearch } from './core/GunplaDB';
import type { Model, Task } from './core/ModelManager';
import type { GunplaItem } from './core/GunplaDB';
import './App.css';

const isWeChat = /MicroMessenger/i.test(navigator.userAgent);

const compressImage = (file: File, maxWidth = 800, quality = 0.6): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const FocusPanel = ({
  isPip, currentModelId, setCurrentModelId, currentTaskId, setCurrentTaskId, currentStageId, setCurrentStageId,
  models, tasks, currentTask, currentStage, timerState, activeSeconds, lastSession,
  timeboxTarget, setTimeboxTarget, timeboxElapsed, handleStart, handlePause, handleResume, handleComplete,
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
      try { const base64 = await compressImage(file, 800, 0.6); setFinishPartPhoto(base64); } 
      catch (err) { showToast(t('imageProcessingFailed') || 'Image processing failed'); }
    }
    e.target.value = '';
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
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
                  {finishPartPhoto.startsWith('data:') && (
                    <img src={finishPartPhoto} alt="preview" style={{ width: '100%', maxHeight: '60px', objectFit: 'contain', borderRadius: '4px' }} />
                  )}
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
         <div className="empty-state" style={{ marginTop: '20px' }}>
           没有进行中的模型啦！<br/>
           点击上方“添加模型”开始新的挑战吧 🚀
         </div>
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
            <div className={`timebox-remaining ${isTimeUp ? 'time-up' : ''}`}>
              {isTimeUp ? t('timeboxEnd') : `⏳ ${formatTime(remainingSeconds)}`}
            </div>
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
              {finishPartPhoto.startsWith('data:') && (
                <img src={finishPartPhoto} alt="preview" style={{ width: '100%', maxHeight: '100px', objectFit: 'contain', borderRadius: '4px', marginTop: '4px' }} />
              )}
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
              {timerState === 'Idle' && (
                <button className="btn start" onClick={handleStart} disabled={!currentTaskId}>
                  {t('start')}
                </button>
              )}
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

function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'focus' | 'journal' | 'hangar' | 'profile'>('focus');
  const [viewingModelId, setViewingModelId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const [activeSeconds, setActiveSeconds] = useState(0);
  const [timerState, setTimerState] = useState<'Idle' | 'Running' | 'Paused'>('Idle');
  const [todayTotal, setTodayTotal] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  
  const [coinsBalance, setCoinsBalance] = useState(0);
  const [earnedTitles, setEarnedTitles] = useState<string[]>([]);
  const [equippedTitle, setEquippedTitle] = useState('');
  const [audioSettings, setAudioSettings] = useState<any>({});
  const [customAudios, setCustomAudios] = useState<any>({});
  
  const [bgMain, setBgMain] = useState(() => StorageManager.getBgMain());
  const [bgPip, setBgPip] = useState(() => StorageManager.getBgPip());
  const [bgSize, setBgSize] = useState(() => StorageManager.getBgSize());
  const [bgPosition, setBgPosition] = useState(() => StorageManager.getBgPosition());
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [isEditingImportedStatus, setIsEditingImportedStatus] = useState(false);
  const [importedStages, setImportedStages] = useState<string[]>([]);
  const [isEditingCover, setIsEditingCover] = useState(false);
  const [showRebuildConfirm, setShowRebuildConfirm] = useState(false);
  const [pendingRebuildTask, setPendingRebuildTask] = useState<string | null>(null);
  
  const [showCompleteModelConfirm, setShowCompleteModelConfirm] = useState(false);
  const [completeModelId, setCompleteModelId] = useState<string | null>(null);

  const [journalFilterMonth, setJournalFilterMonth] = useState('');

  const [models, setModels] = useState<Model[]>([]);
  const [currentModelId, setCurrentModelId] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTaskId, setCurrentTaskId] = useState<string>('');
  const [currentStageId, setCurrentStageId] = useState<string | null>(null);

  const [lastSession, setLastSession] = useState<{ duration: number; stageId: string | null } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  const [isFinishingPart, setIsFinishingPart] = useState(false);
  const [finishPartPhoto, setFinishPartPhoto] = useState('');

  const [isAddingModel, setIsAddingModel] = useState(false);
  const [newModelNameInput, setNewModelNameInput] = useState(''); 
  const [selectedGunpla, setSelectedGunpla] = useState<GunplaItem | null>(null); 
  const [newModelGrade, setNewModelGrade] = useState('HG');
  const [newModelSeriesInput, setNewModelSeriesInput] = useState('');
  const [useDefaultTasks, setUseDefaultTasks] = useState(true);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  
  const [searchResults, setSearchResults] = useState<GunplaItem[]>([]);

  const [legacyInput, setLegacyInput] = useState('');
  const [legacyResults, setLegacyResults] = useState<GunplaItem[]>([]);
  const [legacyList, setLegacyList] = useState<(GunplaItem & { coverImage?: string })[]>([]);
  const [showLegacyForm, setShowLegacyForm] = useState(false);

  const [timeboxTarget, setTimeboxTarget] = useState(() => StorageManager.getTimeboxTarget());
  const [timeboxElapsed, setTimeboxElapsed] = useState(() => StorageManager.getTimeboxElapsed());
  const [hasPlayedTimeboxSound, setHasPlayedTimeboxSound] = useState(false);
  const [reminderInterval, setReminderInterval] = useState(() => StorageManager.getReminderInterval());
  const [lastRemindedAt, setLastRemindedAt] = useState(0);
  const [username, setUsername] = useState(() => StorageManager.getUsername());
  const [showModelDetails, setShowModelDetails] = useState(false);
  const [showTimeDetails, setShowTimeDetails] = useState(false);
  const engineRef = useRef(new TimerEngine());
  const [pipWindow, setPipWindow] = useState<Window | null>(null);

  const getModelName = (m: Model) => i18n.language === 'zh' ? m.name.zh : m.name.en;
  const getModelSeries = (m: Model) => i18n.language === 'zh' ? m.series.zh : m.series.en;

  useEffect(() => {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist();
    }
    GunplaSearch.init();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (timerState === 'Running') {
        e.preventDefault();
        e.returnValue = '你有正在进行的计时，刷新或关闭将丢失当前计时！Are you sure?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [timerState]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const secs = engineRef.current.getActiveSeconds();
        setActiveSeconds(secs);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (!isAddingModel) return;
    const timer = setTimeout(() => { setSearchResults(GunplaSearch.search(newModelNameInput)); }, 200);
    return () => clearTimeout(timer);
  }, [newModelNameInput, isAddingModel]);

  useEffect(() => {
    if (!showLegacyForm) return;
    const timer = setTimeout(() => { 
      if (legacyInput.trim().length > 0) {
        setLegacyResults(GunplaSearch.search(legacyInput));
      } else {
        setLegacyResults([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [legacyInput, showLegacyForm]);

  const refreshData = () => {
    setTodayTotal(SessionManager.getTodayTotalSeconds());
    setTotalXp(ModelManager.getTotalXP());
    setCoinsBalance(StorageManager.getCoinsBalance());
    setEarnedTitles(StorageManager.getEarnedTitles());
    setEquippedTitle(StorageManager.getEquippedTitle());
    setAudioSettings(StorageManager.getAudioSettings());
    setCustomAudios(StorageManager.getCustomAudios());
    setBgMain(StorageManager.getBgMain());
    setBgPip(StorageManager.getBgPip());
    setBgSize(StorageManager.getBgSize());
    setBgPosition(StorageManager.getBgPosition());
    const allModels = ModelManager.getAllModels();
    setModels(allModels);

    const available = allModels.filter(m => m.status !== 'Completed');
    if (available.length > 0) {
      if (!currentModelId || !available.some(m => m.id === currentModelId)) {
        setCurrentModelId(available[0].id);
      }
    } else {
      setCurrentModelId(''); 
    }
  };

  useEffect(() => {
  const handleFirstInteraction = () => {
    AudioManager.unlock();
    document.removeEventListener('click', handleFirstInteraction);
  };
  document.addEventListener('click', handleFirstInteraction);
  return () => document.removeEventListener('click', handleFirstInteraction);
  }, []);

  useEffect(() => { refreshData(); }, []);
  useEffect(() => {
    const handleStorageChange = () => refreshData();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    const model = models.find(m => m.id === currentModelId);
    if (model) {
      setTasks(model.tasks);
      const taskExists = model.tasks.some(t => t.id === currentTaskId);
      if (!taskExists && model.tasks.length > 0) setCurrentTaskId(model.tasks[0].id);
    }
  }, [currentModelId, models]);

  useEffect(() => {
    const task = tasks.find(t => t.id === currentTaskId);
    if (task) {
      const currentStageExists = task.stages.some(s => s.id === currentStageId);
      if (!currentStageExists) {
        const nextStage = task.stages.find(s => s.status !== 'Completed');
        setCurrentStageId(nextStage ? nextStage.id : task.stages[0]?.id || null);
      }
    }
  }, [currentTaskId, tasks]);

  useEffect(() => {
    const interval = setInterval(() => {
      const secs = engineRef.current.getActiveSeconds();
      const state = engineRef.current.getState();
      setActiveSeconds(secs); setTimerState(state);
      if (state === 'Running') setTimeboxElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timerState === 'Running' && timeboxTarget > 0 && timeboxElapsed >= timeboxTarget && !hasPlayedTimeboxSound) {
      AudioManager.playTimeboxEnd(); setHasPlayedTimeboxSound(true);
    }
  }, [timeboxElapsed, timeboxTarget, hasPlayedTimeboxSound, timerState]);

  // 定期提醒逻辑 (基于累计专注时长)
  useEffect(() => {
    if (timerState === 'Running' && reminderInterval > 0) {
      if (activeSeconds > 0 && activeSeconds % reminderInterval === 0 && activeSeconds !== lastRemindedAt) {
        AudioManager.playTimeboxEnd();
        showToast(i18n.language === 'zh' ? `⏰ 已专注 ${reminderInterval / 60} 分钟，记得休息一下！` : `⏰ Focused for ${reminderInterval / 60} min. Take a break!`);
        setLastRemindedAt(activeSeconds);
      }
    }
  }, [activeSeconds, timerState, reminderInterval, lastRemindedAt]);

  useEffect(() => {
    if (timerState !== 'Running') {
      setLastRemindedAt(0);
    }
  }, [timerState]);

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); };
  const toggleLanguage = () => { AudioManager.playClick(); const next = i18n.language === 'zh' ? 'en' : 'zh'; i18n.changeLanguage(next); localStorage.setItem('lang', next); };

  const handleSetTimeboxTarget = (min: number) => {
    AudioManager.playClick();
    setTimeboxTarget(min * 60);
    setTimeboxElapsed(0);
    setHasPlayedTimeboxSound(false);
  };

  const handleStart = () => { AudioManager.playStart(); engineRef.current.start(); setModels(ModelManager.startStage(currentTaskId, currentStageId)); setHasPlayedTimeboxSound(false); refreshData(); };
  const handlePause = () => { AudioManager.playClick(); engineRef.current.pause(); };
  const handleResume = () => { AudioManager.playClick(); engineRef.current.resume(); };
  
  const handleComplete = () => {
    AudioManager.playClick();
    const result = engineRef.current.complete();
    if (result) {
      if (result.activeSeconds < 10) {
        showToast(i18n.language === 'zh' ? '计时太短，无法记录（至少10秒）。' : 'Time too short, not saved (min 10s).');
        return;
      }
      AudioManager.playComplete();
      const newSession = { id: crypto.randomUUID(), taskId: currentTaskId, stageId: currentStageId, ...result };
      SessionManager.saveSession(newSession);
      refreshData();
      setLastSession({ duration: result.activeSeconds, stageId: currentStageId });
    }
  };

  const processAchievements = () => {
    const newlyEarned = AchievementManager.checkAll();
    if (newlyEarned.length > 0) {
      AudioManager.playAchievement();
      newlyEarned.forEach(ach => showToast(`🏆 ${t(ach.nameKey)}`));
    }
  };

  const checkAndPromptCompleteModel = (updatedModels: Model[], modelId?: string) => {
    let targetId = modelId;
    if (!targetId) {
       const m = updatedModels.find(m => m.tasks.some(t => t.id === currentTaskId));
       targetId = m?.id;
    }
    if (!targetId) return;

    const targetModel = updatedModels.find(m => m.id === targetId);
    if (targetModel && targetModel.tasks.length > 0 && targetModel.tasks.every(t => t.status === 'Completed') && targetModel.status !== 'Completed') {
      setShowCompleteModelConfirm(true);
      setCompleteModelId(targetId);
    }
  };

  const handleConfirmStageDone = () => {
    AudioManager.playStageDone();
    const updated = ModelManager.completeStage(currentTaskId, lastSession?.stageId || null);
    setModels(updated); refreshData(); setLastSession(null); processAchievements();
    checkAndPromptCompleteModel(updated);
  };

  const handleFinishPart = () => {
    AudioManager.playClick();
    const assembly = currentTask?.stages.find(s => s.nameKey === 'stage_assembly');
    if (assembly && assembly.status !== 'Completed') { showToast(t('errorAssemblyRequired')); return; }
    setFinishPartPhoto('');
    setIsFinishingPart(true);
  };

  const handleConfirmFinishPart = () => {
    AudioManager.playFinishPart();
    const result = ModelManager.finishTask(currentTaskId, finishPartPhoto);
    if (result.error) { showToast(t(result.error)); return; }
    setModels(result.models); refreshData(); processAchievements();
    setTimeboxTarget(0); setTimeboxElapsed(0); setHasPlayedTimeboxSound(false);
    setIsFinishingPart(false);
    checkAndPromptCompleteModel(result.models);
  };

  const handleConfirmCompleteModel = () => {
    if (!completeModelId) return;
    AudioManager.playFinishPart();
    const updated = ModelManager.finishModel(completeModelId);
    setModels(updated);
    refreshData();
    setShowCompleteModelConfirm(false);
    setCompleteModelId(null);
    showToast(i18n.language === 'zh' ? '🎉 模型已收入格纳库！' : '🎉 Model added to Hangar!');
  };

  const handleAddModel = () => {
    if (!newModelNameInput.trim() && !selectedGunpla) return;
    AudioManager.playClick();
    const nameObj = selectedGunpla ? selectedGunpla.name : { en: newModelNameInput.trim(), zh: newModelNameInput.trim() };
    const seriesObj = selectedGunpla ? selectedGunpla.series : { en: newModelSeriesInput.trim() || 'Unknown', zh: newModelSeriesInput.trim() || '未知' };

    const updated = ModelManager.addModel(nameObj, newModelGrade, seriesObj, useDefaultTasks);
    setModels(updated); setCurrentModelId(updated[updated.length - 1].id);
    
    setNewModelNameInput(''); setNewModelSeriesInput(''); setSelectedGunpla(null);
    setIsAddingModel(false); setUseDefaultTasks(true); setSearchResults([]);
    processAchievements();
  };

  const addToLegacyList = (item: GunplaItem) => {
    AudioManager.playClick();
    if (!legacyList.some(i => i.name.en === item.name.en && i.grade === item.grade)) {
      setLegacyList([...legacyList, { ...item }]);
    } else {
      showToast(i18n.language === 'zh' ? '该模型已经在待导入列表中啦！' : 'Model already in import list!');
    }
    setLegacyInput('');
    setLegacyResults([]);
  };

  const removeLegacyItem = (id: string) => {
    AudioManager.playClick();
    setLegacyList(legacyList.filter(i => i.id !== id));
  };

  const handleLegacyCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await compressImage(file, 400, 0.6);
        const newList = [...legacyList];
        newList[index].coverImage = base64;
        setLegacyList(newList);
      } catch (err) { showToast(i18n.language === 'zh' ? '图片上传失败' : 'Image upload failed'); }
    }
    e.target.value = '';
  };

  const handleLegacyImport = () => {
    if (legacyList.length === 0) return;
    AudioManager.playClick();
    const result = ModelManager.importLegacyModelsFromList(legacyList);
    if (result.count > 0) {
      AudioManager.playFinishPart(); 
      showToast(t('importedSuccess', { count: result.count }));
      setLegacyList([]); 
      refreshData(); 
      processAchievements();
    }
  };

  const handleDeleteModel = (modelId: string) => {
    AudioManager.playClick();
    const updated = ModelManager.deleteModel(modelId);
    setModels(updated);
    setViewingModelId(null);
    refreshData();
    showToast(i18n.language === 'zh' ? "已删除" : "Deleted");
  };

  const handleJumpToFocus = (taskId: string, stageId: string | null = null) => {
    AudioManager.playClick();
    if (viewingModel?.status === 'Completed' || viewingModel?.isRebuilding) {
      const updated = ModelManager.reopenModel(viewingModel.id);
      setModels(updated);
    }
    setCurrentModelId(viewingModelId!);
    setCurrentTaskId(taskId);
    if (stageId) setCurrentStageId(stageId);
    setActiveTab('focus');
    setViewingModelId(null);
  };

  const handleStartRebuild = (taskId: string) => {
    AudioManager.playClick();
    setPendingRebuildTask(taskId);
    const stages = viewingModel?.tasks.find(t => t.name === 'part_legacy')?.stages.filter(s => s.status === 'Completed').map(s => s.nameKey) || ['stage_assembly'];
    setImportedStages(stages);
    setIsEditingImportedStatus(true);
  };

  const handleConfirmRebuild = () => {
    if (!viewingModel) return;
    AudioManager.playStageDone();
    const updated = ModelManager.startLegacyRebuild(viewingModel.id, importedStages);
    setModels(updated);
    setIsEditingImportedStatus(false);
    setShowRebuildConfirm(true);
  };

  const handleDoRebuild = () => {
    AudioManager.playClick();
    setShowRebuildConfirm(false);
    if (pendingRebuildTask) {
      handleJumpToFocus(pendingRebuildTask);
      setPendingRebuildTask(null);
    }
  };

  const handleSaveImportedStages = () => {
    if (!viewingModelId) return;
    AudioManager.playStageDone();
    const updated = ModelManager.updateImportedModelStatus(viewingModelId, importedStages);
    setModels(updated);
    setIsEditingImportedStatus(false);
    checkAndPromptCompleteModel(updated, viewingModelId);
  };

  const handleCancelDone = () => { AudioManager.playClick(); setLastSession(null); };
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => { setUsername(e.target.value); StorageManager.setUsername(e.target.value); };
  
  const updateAudioSetting = (type: string, style: string) => { 
    const newSettings = { ...audioSettings, [type]: style }; 
    setAudioSettings(newSettings); 
    StorageManager.setAudioSettings(newSettings); 
    if (style !== 'off') AudioManager.previewSound(type as any); 
  };

  const openPreview = () => {
    AudioManager.playClick();
    setBgSize(StorageManager.getBgSize());
    setBgPosition(StorageManager.getBgPosition());
    setIsPreviewOpen(true);
  };

  const applyBackground = () => {
    AudioManager.playClick();
    StorageManager.setBgSize(bgSize);
    StorageManager.setBgPosition(bgPosition);
    setIsPreviewOpen(false);
    showToast(i18n.language === 'zh' ? '✅ 适配设置应用成功！' : '✅ Settings applied!');
  };

  const handleBgFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'pip') => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await compressImage(file, 800, 0.4);
        if (type === 'main') {
          setBgMain(base64);
          StorageManager.setBgMain(base64);
        } else {
          setBgPip(base64);
          StorageManager.setBgPip(base64);
        }
        showToast(i18n.language === 'zh' ? '✅ 背景图上传成功！' : '✅ Background uploaded!');
      } catch (err) { showToast(i18n.language === 'zh' ? '❌ 图片处理失败' : '❌ Image processing failed'); }
    }
    e.target.value = '';
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && viewingModelId) {
      try {
        const base64 = await compressImage(file, 800, 0.6);
        const updated = ModelManager.updateModelCover(viewingModelId, base64);
        setModels(updated);
        setIsEditingCover(false);
        showToast(i18n.language === 'zh' ? '✅ 封面修改成功！' : '✅ Cover updated!');
      } catch (err) { showToast(i18n.language === 'zh' ? '❌ 图片处理失败' : '❌ Image processing failed'); }
    }
    e.target.value = '';
  };

  const handleAudioUpload = (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) { showToast(i18n.language === 'zh' ? '音频文件太大（最大1MB）' : 'Audio file too large (max 1MB)'); return; }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const newAudios = { ...customAudios, [type]: base64 };
      setCustomAudios(newAudios);
      try {
        StorageManager.setCustomAudios(newAudios);
        updateAudioSetting(type, 'custom');
        showToast(i18n.language === 'zh' ? '✅ 音效上传成功！' : '✅ Audio uploaded!');
      } catch (err) {
        showToast(i18n.language === 'zh' ? '本地存储空间不足，音效保存失败。' : 'Not enough local storage.');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const buyTitle = (id: string) => { if (UserManager.buyTitle(id)) { AudioManager.playAchievement(); showToast(t('titleUnlocked')); refreshData(); } else { AudioManager.playClick(); showToast(t('notEnoughCoins')); } };
  const equipTitle = (id: string) => { AudioManager.playClick(); StorageManager.setEquippedTitle(id); setEquippedTitle(id); AudioManager.playStageDone(); };

  const handleOpenPiP = async () => {
    AudioManager.playClick();
    if (isWeChat) {
      showToast(i18n.language === 'zh' ? '微信内不支持画中画，请用浏览器打开' : 'PiP not supported in WeChat.');
      return;
    }
    if (!('documentPictureInPicture' in window)) { 
      showToast(i18n.language === 'zh' ? '您的浏览器不支持画中画，请使用 Chrome/Edge。' : 'Your browser does not support PiP.'); 
      return; 
    }
    try {
      const pipWin = await (window as any).documentPictureInPicture.requestWindow({ width: 320, height: 480 });
      [...document.styleSheets].forEach((styleSheet) => {
        try { const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join(''); const style = document.createElement('style'); style.textContent = cssRules; pipWin.document.head.appendChild(style); } 
        catch (e) { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = (styleSheet as any).href; pipWin.document.head.appendChild(link); }
      });
      pipWin.document.body.style.backgroundColor = '#1e1e1e';
      pipWin.document.body.style.margin = '0';
      pipWin.document.body.style.display = 'flex';
      pipWin.document.body.style.justifyContent = 'center';
      pipWin.document.body.style.alignItems = 'center';
      pipWin.document.body.style.height = '100vh';
      pipWin.document.body.style.overflow = 'hidden';
      setPipWindow(pipWin); pipWin.addEventListener('pagehide', () => setPipWindow(null));
    } catch (err) { 
      console.error(err);
      showToast(i18n.language === 'zh' ? '画中画打开失败' : 'Failed to open PiP');
    }
  };

  const exportData = () => { AudioManager.playClick(); const data = StorageManager.exportAll(); const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `modelvault_backup_${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url); };
  const importData = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const file = e.target.files?.[0]; 
    if (!file) return; 
    AudioManager.playClick();
    const reader = new FileReader(); 
    reader.onload = (event) => { 
      try { 
        const data = JSON.parse(event.target?.result as string); 
        if (StorageManager.importAll(data)) { 
          showToast(t('importSuccess')); 
          setTimeout(() => window.location.reload(), 1000); 
        } else { 
          showToast(t('importError')); 
        } 
      } catch (err) { 
        showToast(t('importError')); 
      } 
    }; 
    reader.readAsText(file); 
    e.target.value = ''; 
  };

  const handleResetData = () => {
    AudioManager.playClick();
    localStorage.clear();
    if (window.indexedDB) {
      window.indexedDB.deleteDatabase('ModelVault');
    }
    window.location.reload();
  };

  const formatTime = (totalSec: number) => { const h = Math.floor(totalSec / 3600); const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0'); const s = (totalSec % 60).toString().padStart(2, '0'); if (h > 0) return `${h}:${m}:${s}`; return `${m}:${s}`; };
  const formatLogDate = (timestamp: number) => { const d = new Date(timestamp); return `${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`; };
  
  const getHistoryLogs = () => { 
    let sessions = SessionManager.getAllSessions(); 
    
    if (journalFilterMonth) {
      sessions = sessions.filter(s => {
        const d = new Date(s.startedAt);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        return `${year}-${month}` === journalFilterMonth;
      });
    }

    return sessions.sort((a, b) => b.startedAt - a.startedAt).map(s => ({ ...s, details: ModelManager.getTaskDetails(s.taskId), stageNameKey: ModelManager.getStageNameKey(s.taskId, s.stageId) })); 
  };

  const currentTask = tasks.find(t => t.id === currentTaskId);
  const currentStage = currentTask?.stages.find(s => s.id === currentStageId);
  const currentModel = models.find(m => m.id === currentModelId);
  const modelStats = ModelManager.getModelStats();
  const timeStats = ModelManager.getTimeStats();
  const earnedAchievements = AchievementManager.getEarnedList();
  const storageUsage = StorageManager.getStorageUsage();
  const titles = UserManager.getTitleLibrary();
  const equippedTitleDef = titles.find(t => t.id === equippedTitle);
  const completedModels = ModelManager.getCompletedModels();

  const panelProps = {
    currentModelId, setCurrentModelId, currentTaskId, setCurrentTaskId, currentStageId, setCurrentStageId,
    models, tasks, currentTask, currentStage, timerState, activeSeconds, lastSession,
    timeboxTarget, setTimeboxTarget, timeboxElapsed, handleStart, handlePause, handleResume, handleComplete, 
    handleConfirmStageDone, handleCancelDone, handleFinishPart,
    isFinishingPart, setIsFinishingPart, finishPartPhoto, setFinishPartPhoto, handleConfirmFinishPart,
    currentModel, getModelName, t,
    bgImage: bgPip, bgSize, bgPosition,
    showToast, handleSetTimeboxTarget
  };

  const viewingModel = models.find(m => m.id === viewingModelId);
  const viewingModelTotalSec = viewingModel ? SessionManager.getAllSessions().filter(s => viewingModel.tasks.some(t => t.id === s.taskId)).reduce((sum, s) => sum + s.activeSeconds, 0) : 0;

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  return (
    <div className="app-wrapper">
      {bgMain && (
        <img src={bgMain} alt="background" className="app-bg-img" style={{ objectFit: bgSize as any, objectPosition: bgPosition }} />
      )}
      
      {toastMsg && <div className="toast">{toastMsg}</div>}

      <div className="mini-window">
        {viewingModel ? (
          <div className="profile-topbar">
            <button className="back-btn" onClick={() => { AudioManager.playClick(); setViewingModelId(null); setIsEditingCover(false); setIsEditingImportedStatus(false); setShowRebuildConfirm(false); }}>← {t('backToHangar')}</button>
            <div className="top-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {confirmDeleteId === viewingModel.id ? (
                <>
                  <button className="mini-btn" style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }} onClick={() => { handleDeleteModel(viewingModel.id); setConfirmDeleteId(null); }}>
                    {i18n.language === 'zh' ? '确认删除' : 'Confirm'}
                  </button>
                  <button className="mini-btn" style={{ background: 'transparent', color: '#ccc', border: '1px solid #555', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }} onClick={() => { AudioManager.playClick(); setConfirmDeleteId(null); }}>
                    {t('cancel')}
                  </button>
                </>
              ) : (
                <button className="icon-btn" style={{ color: '#ef4444', padding: '4px' }} onClick={() => { AudioManager.playClick(); setConfirmDeleteId(viewingModel.id); }}>🗑️</button>
              )}
              <button className="lang-btn" onClick={toggleLanguage}>{i18n.language === 'zh' ? 'EN' : '中'}</button>
            </div>
          </div>
        ) : activeTab === 'profile' ? (
          <div className="profile-topbar">
            <button className="back-btn" onClick={() => { AudioManager.playClick(); setActiveTab('focus'); }}>{t('backToFocus')}</button>
            <div className="top-right">
              <button className="icon-btn" onClick={handleOpenPiP}>📺</button>
              <button className="lang-btn" onClick={toggleLanguage}>{i18n.language === 'zh' ? 'EN' : '中'}</button>
            </div>
          </div>
        ) : (
          <>
            <div className="tabs">
              <button className={`tab ${activeTab === 'focus' ? 'active' : ''}`} onClick={() => { AudioManager.playClick(); setActiveTab('focus'); }}>⏱ {t('focus')}</button>
              <button className={`tab ${activeTab === 'journal' ? 'active' : ''}`} onClick={() => { AudioManager.playClick(); setActiveTab('journal'); }}>📖 {t('journal')}</button>
              <button className={`tab ${activeTab === 'hangar' ? 'active' : ''}`} onClick={() => { AudioManager.playClick(); setActiveTab('hangar'); }}>📦 {t('hangar')}</button>
              <button className="tab" onClick={() => { AudioManager.playClick(); setActiveTab('profile'); }}>👤 {t('profile')}</button>
            </div>
            <div className="top-bar">
              <span>{t('xp')}: {totalXp} | 🪙 {coinsBalance}</span>
              <div className="top-right">
                <span>{t('today')}: {formatTime(todayTotal)}</span>
                <button className="icon-btn" onClick={handleOpenPiP}>📺</button>
                <button className="lang-btn" onClick={toggleLanguage}>{i18n.language === 'zh' ? 'EN' : '中'}</button>
              </div>
            </div>
          </>
        )}

        {viewingModel ? (
          <div className="detail-view">
            <div className="detail-hero" style={{ backgroundImage: viewingModel.coverImage ? `url(${viewingModel.coverImage})` : 'none' }}>
              <div className="detail-hero-info">
                <div className="detail-title">{getModelName(viewingModel)}</div>
                <div className="detail-subtitle">
                  <span>{viewingModel.grade} | {getModelSeries(viewingModel)}</span>
                  <span>Total: {formatTime(viewingModelTotalSec)}</span>
                </div>
              </div>
              <div 
                style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, background: 'rgba(0,0,0,0.6)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => setIsEditingCover(true)}
              >
                <span style={{ fontSize: '14px' }}>📷</span>
                <span style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold' }}>封面</span>
              </div>
            </div>

            {isEditingCover && (
              <div className="inline-form" style={{ background: 'rgba(0,0,0,0.5)', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#ccc' }}>上传/修改模型封面</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <label className="btn start" style={{ flex: 1, padding: '8px', textAlign: 'center', cursor: 'pointer', margin: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    📁 上传图片
                    <input type="file" accept="image/*" onChange={handleCoverUpload} style={{ display: 'none' }} />
                  </label>
                  <button className="btn no" style={{ flex: 1, padding: '8px' }} onClick={() => { AudioManager.playClick(); setIsEditingCover(false); }}>取消</button>
                </div>
              </div>
            )}

            {isEditingImportedStatus && (
              <div className="custom-section" style={{ border: '1px solid #f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}>
                <h4 style={{ color: '#f59e0b', marginBottom: '8px' }}>📦 历史模型进度录入</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#ccc' }}>勾选你当时已经完成的流程：</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
                    {['stage_assembly', 'stage_scribing', 'stage_lining', 'stage_painting', 'stage_topcoat'].map(stageKey => (
                      <label key={stageKey} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={importedStages.includes(stageKey)} 
                          disabled={stageKey === 'stage_assembly'}
                          onChange={(e) => {
                            if (e.target.checked) setImportedStages([...importedStages, stageKey]);
                            else setImportedStages(importedStages.filter(k => k !== stageKey));
                          }}
                        />
                        {t(stageKey)}
                      </label>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn start" style={{ flex: 1, padding: '6px' }} onClick={handleConfirmRebuild}>确认并开始改造</button>
                    <button className="btn no" style={{ flex: 1, padding: '6px' }} onClick={() => { AudioManager.playClick(); setIsEditingImportedStatus(false); }}>取消</button>
                  </div>
                </div>
              </div>
            )}

            {showRebuildConfirm && (
              <div className="inline-confirm" style={{ border: '1px solid #3b82f6', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                <div className="confirm-text" style={{ fontSize: '14px' }}>改造状态已激活！<br/><span>是否直接跳转至专注页面开始制作？</span></div>
                <div className="confirm-actions">
                  <button className="btn yes" onClick={handleDoRebuild}>是，前往专注</button>
                  <button className="btn no" onClick={() => { AudioManager.playClick(); setShowRebuildConfirm(false); }}>留在详情页</button>
                </div>
              </div>
            )}

            <div className="timeline-container">
              {viewingModel.tasks.map(task => {
                const taskSessions = SessionManager.getAllSessions().filter(s => s.taskId === task.id);
                const taskTime = taskSessions.reduce((sum, s) => sum + s.activeSeconds, 0);
                const isExpanded = expandedTaskId === task.id;
                const isCompleted = task.status === 'Completed';
                
                return (
                  <div key={task.id} className="timeline-item">
                    <div className="timeline-header" onClick={() => { AudioManager.playClick(); setExpandedTaskId(isExpanded ? null : task.id); }}>
                      <div className="timeline-title">{isCompleted ? '✅' : '⏳'} {t(task.name)}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="timeline-time">{formatTime(taskTime)}</span>
                        <span style={{ color: '#666', fontSize: '10px' }}>{isExpanded ? '▲' : '▼'}</span>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="timeline-content">
                        {task.stages.map(stage => (
                          <div key={stage.id} className={`stage-detail-item ${stage.status === 'Completed' ? 'done' : ''}`}>
                            <div className={`stage-detail-header ${stage.status === 'Completed' ? 'done' : ''}`}>
                              <span>{t(stage.nameKey)}</span>
                              <span>{stage.status === 'Completed' ? 'Done' : (stage.status === 'InProgress' ? 'In Progress' : 'Pending')}</span>
                            </div>
                            {stage.photoUrl && <img src={stage.photoUrl} alt="progress" className="stage-photo" onError={(e) => (e.currentTarget.style.display = 'none')} />}
                          </div>
                        ))}
                        <button 
                          className="mini-btn" 
                          style={{ width: '100%', marginTop: '8px', background: '#3b82f6', color: '#fff', border: 'none', padding: '8px' }}
                          onClick={() => {
                            if (viewingModel.isImported && !viewingModel.isRebuilding) {
                              handleStartRebuild(task.id);
                            } else {
                              handleJumpToFocus(task.id, task.stages.find(s => s.status !== 'Completed')?.id || task.stages[0].id);
                            }
                          }}
                        >
                          {viewingModel.isImported && !viewingModel.isRebuilding ? `🔧 开始继续改造` : `⏱ ${t('focus')}`}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'focus' && (
              <div className="view-content">
                <div className="add-controls">
                  <button className="add-btn-large" onClick={() => { AudioManager.playClick(); setIsAddingModel(true); }} disabled={timerState !== 'Idle' || isFinishingPart}>+ {t('addModel')}</button>
                  <button className="add-btn-large" onClick={() => { AudioManager.playClick(); setIsAddingTask(true); }} disabled={timerState !== 'Idle' || !currentModelId || isFinishingPart}>+ {t('addTask')}</button>
                </div>
                
                {isAddingModel && (
                  <div className="inline-form vertical-form" style={{ position: 'relative' }}>
                    <div className="search-autocomplete">
                      <input id="new-model-name" autoFocus placeholder={t('modelName')} value={newModelNameInput} onChange={e => { setNewModelNameInput(e.target.value); setSelectedGunpla(null); }} onBlur={() => setTimeout(() => setSearchResults([]), 200)} onFocus={handleFocus} />
                      {searchResults.length > 0 && (
                        <div className="autocomplete-dropdown">
                          {searchResults.map((item, idx) => {
                            const displayName = i18n.language === 'zh' ? item.name.zh : item.name.en;
                            const displaySeries = i18n.language === 'zh' ? item.series.zh : item.series.en;
                            return (
                              <div key={idx} className="autocomplete-item" onClick={() => { AudioManager.playClick(); setNewModelNameInput(displayName); setNewModelSeriesInput(displaySeries); setNewModelGrade(item.grade); setSelectedGunpla(item); setSearchResults([]); }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span className="ac-grade">{item.grade}</span>
                                  <strong style={{ color: '#fff' }}>{displayName}</strong>
                                </div>
                                <div className="ac-series">| {displaySeries}</div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    <select id="new-model-grade" value={newModelGrade} onChange={e => { AudioManager.playClick(); setNewModelGrade(e.target.value); }}>{['HG', 'RG', 'MG', 'MGEX', 'MGSD', 'FM', 'PG'].map(g => <option key={g} value={g}>{g}</option>)}</select>
                    <input id="new-model-series" placeholder={t('series')} value={newModelSeriesInput} onChange={e => setNewModelSeriesInput(e.target.value)} disabled={!!selectedGunpla} onFocus={handleFocus} />
                    <label className="checkbox-label"><input type="checkbox" checked={useDefaultTasks} onChange={e => { AudioManager.playClick(); setUseDefaultTasks(e.target.checked); }} />{t('useDefaultTasks')}</label>
                    <div style={{display:'flex', gap:'8px', width:'100%'}}>
                      <button className="btn start" style={{flex: 1, padding: '6px'}} onClick={handleAddModel}>{t('save')}</button>
                      <button className="btn no" style={{flex: 1, padding: '6px'}} onClick={() => { AudioManager.playClick(); setIsAddingModel(false); setSearchResults([]); }}>{t('cancel')}</button>
                    </div>
                  </div>
                )}

                {isAddingTask && (
                  <div className="inline-form">
                    <input id="new-task-name" autoFocus placeholder={t('taskName')} value={newTaskName} onChange={e => setNewTaskName(e.target.value)} onKeyDown={e => {
                      if (e.key === 'Enter' && newTaskName.trim()) {
                        AudioManager.playClick();
                        const updated = ModelManager.addTask(currentModelId, newTaskName.trim());
                        setModels(updated); setNewTaskName(''); setIsAddingTask(false);
                      }
                    }} onFocus={handleFocus} />
                    <button onClick={() => { AudioManager.playClick(); setIsAddingTask(false); }}>{t('cancel')}</button>
                  </div>
                )}
                <FocusPanel {...panelProps} isPip={false} />
              </div>
            )}

            {activeTab === 'journal' && (
              <div className="view-content journal-view" style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#ccc', fontWeight: 'bold' }}>制作日志</span>
                  <input 
                    type="month" 
                    value={journalFilterMonth} 
                    onChange={e => { AudioManager.playClick(); setJournalFilterMonth(e.target.value); }} 
                    style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid #555', color: '#fff', padding: '4px 8px', borderRadius: '6px', outline: 'none', fontSize: '12px' }}
                    onFocus={handleFocus}
                  />
                  {journalFilterMonth && <button className="mini-btn" onClick={() => { AudioManager.playClick(); setJournalFilterMonth(''); }}>清除</button>}
                </div>
                <div className="journal-list" style={{ flex: 1, maxHeight: 'none' }}>
                  {getHistoryLogs().length === 0 ? (
                    <div className="empty-state">{t('emptyJournal').split('\n').map((line: string, i: number) => <span key={i}>{line}<br/></span>)}</div>
                  ) : (
                    getHistoryLogs().map(session => {
                      const modelName = session.details?.modelName 
                        ? (i18n.language === 'zh' ? session.details.modelName.zh : session.details.modelName.en)
                        : 'Unknown';
                      return (
                        <div key={session.id} className="journal-item">
                          <div className="journal-time">{formatLogDate(session.startedAt)}</div>
                          <div className="journal-main">
                            <div className="journal-model">{modelName}</div>
                            <div className="journal-task">
                              {t(session.details?.taskName || '')} 
                              {session.stageNameKey && <span className="journal-stage"> - {t(session.stageNameKey)}</span>}
                            </div>
                          </div>
                          <div className="journal-duration">{formatTime(session.activeSeconds)}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {activeTab === 'hangar' && (
              <div className="view-content hangar-view">
                {completedModels.length === 0 ? (
                  <div className="empty-state">{t('emptyHangar')}</div>
                ) : (
                  <div className="hangar-grid">
                    {completedModels.sort((a, b) => a.grade.localeCompare(b.grade)).map(model => (
                      <div key={model.id} className="hangar-card" onClick={() => { AudioManager.playClick(); setViewingModelId(model.id); setExpandedTaskId(null); }} style={{ cursor: 'pointer' }}>
                        <div className="hangar-cover" style={{ backgroundImage: model.coverImage ? `url(${model.coverImage})` : 'none' }}>
                          {!model.coverImage && <span>📷 {t('noImage')}</span>}
                          {model.isRebuilding && <span className="rebuild-badge-overlay">🔧 {t('rebuilding')}</span>}
                        </div>
                        <div className="hangar-info">
                          <div className="hangar-grade">{model.grade}</div>
                          <div className="hangar-name" title={getModelName(model)}>{getModelName(model)}</div>
                          <div className="hangar-series" title={getModelSeries(model)}>{getModelSeries(model)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="view-content profile-view">
                <div className="profile-header">
                  <div className="avatar">🧑‍🔧</div>
                  <div className="profile-info">
                    <input id="username-input" type="text" value={username} onChange={handleUsernameChange} className="username-input" onFocus={handleFocus} />
                    {equippedTitleDef && <div className="equipped-title">[{t(equippedTitleDef.nameKey)}]</div>}
                  </div>
                </div>
                <div className="stats-grid">
                  <div className="stat-card" onClick={() => { AudioManager.playClick(); setShowModelDetails(!showModelDetails); }}>
                    <div className="stat-label">{t('totalModels')}</div>
                    <div className="stat-value">{modelStats.total}</div>
                    {showModelDetails && (<div className="stat-details">{['HG', 'RG', 'MG', 'PG'].map(grade => modelStats[grade] > 0 ? (<div key={grade} className="detail-row"><span>{grade}</span> <span>{modelStats[grade]}</span></div>) : null)}</div>)}
                  </div>
                  <div className="stat-card" onClick={() => { AudioManager.playClick(); setShowTimeDetails(!showTimeDetails); }}>
                    <div className="stat-label">{t('totalTime')}</div>
                    <div className="stat-value">{formatTime(timeStats.totalSeconds)}</div>
                    {showTimeDetails && (<div className="stat-details">{Object.entries(timeStats.stageTime).map(([stageKey, seconds]) => seconds > 0 ? (<div key={stageKey} className="detail-row"><span>{t(stageKey)}</span> <span>{formatTime(seconds)}</span></div>) : null)}</div>)}
                  </div>
                </div>

                <div className="custom-section" style={{ border: '1px dashed #3b82f6' }}>
                  <h4>📦 {t('legacyImport')}</h4>
                  <p style={{ fontSize: '11px', color: '#aaa', marginBottom: '10px' }}>随时补录旧模型并上传封面。每个奖励 20 XP。</p>
                  {!showLegacyForm ? (
                    <button className="btn start" style={{ width: '100%', padding: '8px' }} onClick={() => { AudioManager.playClick(); setShowLegacyForm(true); }}>{t('legacyImport')}</button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div className="search-autocomplete">
                        <input 
                          id="legacy-search-input"
                          autoFocus 
                          placeholder={i18n.language === 'zh' ? "搜索并回车添加..." : "Search and press Enter..."} 
                          value={legacyInput} 
                          onChange={e => setLegacyInput(e.target.value)} 
                          onKeyDown={e => {
                            if (e.key === 'Enter' && legacyResults.length > 0) {
                              addToLegacyList(legacyResults[0]);
                            }
                          }}
                          onBlur={() => setTimeout(() => setLegacyResults([]), 200)} 
                          onFocus={handleFocus}
                        />
                        {legacyResults.length > 0 && (
                          <div className="autocomplete-dropdown" style={{ zIndex: 999 }}>
                            {legacyResults.map((item, idx) => {
                              const displayName = i18n.language === 'zh' ? item.name.zh : item.name.en;
                              const displaySeries = i18n.language === 'zh' ? item.series.zh : item.series.en;
                              return (
                                <div key={idx} className="autocomplete-item" onClick={() => addToLegacyList(item)}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span className="ac-grade">{item.grade}</span>
                                    <strong style={{ color: '#fff' }}>{displayName}</strong>
                                  </div>
                                  <div className="ac-series">| {displaySeries}</div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      
                      {legacyList.length > 0 && (
                        <div className="legacy-temp-list">
                          {legacyList.map((item, idx) => {
                            const displayName = i18n.language === 'zh' ? item.name.zh : item.name.en;
                            return (
                              <div key={idx} className="legacy-temp-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                  <span><span className="ac-grade">{item.grade}</span> {displayName}</span>
                                  <button onClick={() => removeLegacyItem(item.id)}>✕</button>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
                                  <label className="mini-btn" style={{ flex: 1, textAlign: 'center', cursor: 'pointer', margin: 0 }}>
                                    {item.coverImage ? '✅ 已添加封面' : '📷 添加封面图 (可选)'}
                                    <input type="file" accept="image/*" onChange={(e) => handleLegacyCoverUpload(e, idx)} style={{ display: 'none' }} />
                                  </label>
                                  {item.coverImage && (
                                    <img src={item.coverImage} style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px' }} />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <button className="btn start" style={{ flex: 1, padding: '6px' }} onClick={handleLegacyImport} disabled={legacyList.length === 0}>
                          {t('importBtn')} ({legacyList.length})
                        </button>
                        <button className="btn no" style={{ flex: 1, padding: '6px' }} onClick={() => { AudioManager.playClick(); setShowLegacyForm(false); setLegacyList([]); setLegacyInput(''); }}>
                          {t('cancel')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="custom-section">
                  <h4>⚙️ {t('customization')}</h4>
                  
                  <div className="custom-row">
                    <span>定期专注提醒音效:</span>
                    <select 
                      value={reminderInterval} 
                      onChange={(e) => {
                        AudioManager.playClick();
                        const val = Number(e.target.value);
                        setReminderInterval(val);
                        StorageManager.setReminderInterval(val);
                      }}
                      style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid #666', color: '#fff', padding: '4px 8px', borderRadius: '4px', outline: 'none' }}
                    >
                      <option value={0}>关闭 (Off)</option>
                      <option value={15 * 60}>每 15 分钟</option>
                      <option value={30 * 60}>每 30 分钟</option>
                      <option value={45 * 60}>每 45 分钟</option>
                      <option value={60 * 60}>每 60 分钟</option>
                    </select>
                  </div>

                  <div className="custom-row">
                    <span>主页背景 (横版):</span>
                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                      <label className="mini-btn" style={{ flex: 1, textAlign: 'center', cursor: 'pointer', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        📁 上传主页图
                        <input type="file" accept="image/*" onChange={(e) => handleBgFileUpload(e, 'main')} style={{ display: 'none' }} />
                      </label>
                      {bgMain && <button className="mini-btn" style={{ color: '#ef4444' }} onClick={() => { AudioManager.playClick(); setBgMain(''); StorageManager.setBgMain(''); }}>清除</button>}
                    </div>
                  </div>

                  <div className="custom-row">
                    <span>悬浮窗背景 (竖版):</span>
                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                      <label className="mini-btn" style={{ flex: 1, textAlign: 'center', cursor: 'pointer', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        📁 上传悬浮窗图
                        <input type="file" accept="image/*" onChange={(e) => handleBgFileUpload(e, 'pip')} style={{ display: 'none' }} />
                      </label>
                      {bgPip && <button className="mini-btn" style={{ color: '#ef4444' }} onClick={() => { AudioManager.playClick(); setBgPip(''); StorageManager.setBgPip(''); }}>清除</button>}
                    </div>
                  </div>

                  <div className="custom-row">
                    <button className="mini-btn" onClick={openPreview}>预览主屏适配</button>
                  </div>
                  
                  <div className="audio-settings">
                    {['click', 'stage', 'timebox', 'complete'].map(type => {
                      const labelMap: any = { click: t('audioClick'), stage: t('audioStage'), timebox: t('audioTimebox'), complete: t('audioComplete') };
                      return (
                        <div key={type} className="audio-row">
                          <span>{labelMap[type]}</span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <select id={`audio-select-${type}`} value={audioSettings[type] || 'default'} onChange={e => updateAudioSetting(type, e.target.value)}>
                              <option value="default">Default</option>
                              <option value="chiptune">8-Bit</option>
                              <option value="soft">Soft</option>
                              <option value="off">Off</option>
                              {customAudios[type] && <option value="custom">Custom</option>}
                            </select>
                            <label className="mini-btn" style={{ padding: '2px 6px', cursor: 'pointer', margin: 0 }} title="Upload MP3/WAV">
                              🎵<input type="file" accept="audio/*" onChange={(e) => handleAudioUpload(type, e)} style={{ display: 'none' }} />
                            </label>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="shop-section">
                  <div className="shop-header"><h4>🏪 {t('titlesShop')}</h4><span>🪙 {coinsBalance}</span></div>
                  <div className="title-list">
                    {titles.map(title => {
                      const isOwned = earnedTitles.includes(title.id);
                      const canAfford = coinsBalance >= title.cost;
                      const meetsCondition = title.checkCondition();
                      return (
                        <div key={title.id} className={`title-item ${isOwned ? 'owned' : ''}`}>
                          <div className="title-info">
                            <div className="title-name">{t(title.nameKey)}</div>
                            <div className="title-cond">{t(title.descKey)}</div>
                          </div>
                          {isOwned ? (
                            <button className="mini-btn" onClick={() => equipTitle(title.id)} disabled={equippedTitle === title.id}>{equippedTitle === title.id ? t('equipped') : t('equip')}</button>
                          ) : (
                            <button className="mini-btn buy-btn" onClick={() => buyTitle(title.id)} disabled={!canAfford || !meetsCondition}>{title.cost} 🪙</button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="achievements-section">
                  <h4>🏆 {t('achievements')}</h4>
                  {earnedAchievements.length === 0 ? (<div className="empty-ach">{t('emptyAchievements')}</div>) : (
                    <div className="ach-list">
                      {earnedAchievements.map(a => (
                        <div key={a.id} className="ach-item">
                          <span className="ach-icon">🏆</span>
                          <div className="ach-info">
                            <div className="ach-name">{t(a.nameKey)}</div>
                            <div className="ach-desc">{t(a.descKey)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="data-backup-section">
                  <h4>{t('dataBackup')} <span style={{float:'right', fontSize:'11px', color:'#888'}}>Used: {storageUsage} MB</span></h4>
                  <div className="backup-actions" style={{ marginBottom: '16px' }}>
                    <button className="backup-btn" onClick={exportData}>{t('exportData')}</button>
                    <label className="backup-btn import-label">{t('importData')}<input type="file" accept=".json" onChange={importData} style={{ display: 'none' }} /></label>
                  </div>
                  
                  <div style={{ borderTop: '1px dashed #444', paddingTop: '16px', marginTop: '8px' }}>
                    <h4 style={{ color: '#ef4444', marginBottom: '8px', fontSize: '12px' }}>⚠️ 危险区域 (测试用)</h4>
                    {!showResetConfirm ? (
                      <button className="backup-btn" style={{ width: '100%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: '#ef4444' }} onClick={() => { AudioManager.playClick(); setShowResetConfirm(true); }}>
                        彻底清空所有数据
                      </button>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <p style={{ fontSize: '12px', color: '#ccc', margin: '0 0 8px 0' }}>确定要清空所有模型、时间记录和成就吗？此操作不可逆！</p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn yes" style={{ background: '#ef4444', flex: 1, padding: '6px' }} onClick={handleResetData}>确认清空</button>
                          <button className="btn no" style={{ flex: 1, padding: '6px' }} onClick={() => { AudioManager.playClick(); setShowResetConfirm(false); }}>取消</button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
                    <p style={{ margin: '0 0 6px 0' }}>ModelVault Beta v0.1.0</p>
                    <a href="https://github.com/你的Github用户名/modelvault-web/issues" target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                      🐞 遇到 Bug？点击提交反馈
                    </a>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showCompleteModelConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '320px', textAlign: 'center' }}>
            <h3 style={{ color: '#10b981' }}>🎉 所有部位已完成！</h3>
            <p style={{ fontSize: '13px', color: '#ccc', marginBottom: '20px' }}>
              该模型的所有部位均已拼装完毕，是否直接完成并收入格纳库？
            </p>
            <div className="modal-actions" style={{ justifyContent: 'center' }}>
              <button className="btn yes" style={{ flex: 1 }} onClick={handleConfirmCompleteModel}>收入格纳库</button>
              <button className="btn no" style={{ flex: 1 }} onClick={() => { AudioManager.playClick(); setShowCompleteModelConfirm(false); }}>稍后再说</button>
            </div>
          </div>
        </div>
      )}

      {isPreviewOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '400px' }}>
            <h3>背景图预览与编辑</h3>
            <p style={{ fontSize: '12px', color: '#aaa' }}>仅用于主屏预览。</p>
            
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '160px', height: '280px', backgroundColor: '#1e1e1e', border: '1px solid #444', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                  {bgMain && <img src={bgMain} style={{ width: '100%', height: '100%', objectFit: bgSize as any, objectPosition: bgPosition }} />}
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#fff', fontWeight: 'bold' }}>Main</div>
                </div>
              </div>
            </div>

            <div className="custom-row">
              <span>填充模式 (Object-Fit):</span>
              <select value={bgSize} onChange={e => { AudioManager.playClick(); setBgSize(e.target.value); }} style={{ padding: '6px', marginBottom: '10px' }}>
                <option value="cover">Cover (覆盖并裁切)</option>
                <option value="contain">Contain (包含并留边)</option>
                <option value="fill">Fill (拉伸填满)</option>
              </select>
              
              <span>对齐位置 (Object-Position):</span>
              <select value={bgPosition} onChange={e => { AudioManager.playClick(); setBgPosition(e.target.value); }} style={{ padding: '6px' }}>
                <option value="center">居中 (Center)</option>
                <option value="top">顶部对齐 (Top)</option>
                <option value="bottom">底部对齐 (Bottom)</option>
                <option value="left">左对齐 (Left)</option>
                <option value="right">右对齐 (Right)</option>
              </select>
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button onClick={() => { AudioManager.playClick(); setIsPreviewOpen(false); }} style={{ background: 'transparent', color: '#aaa' }}>取消</button>
              <button className="btn start" style={{ flex: 1, maxWidth: '120px' }} onClick={applyBackground}>确认应用</button>
            </div>
          </div>
        </div>
      )}

      {pipWindow && createPortal(<FocusPanel {...panelProps} isPip={true} />, pipWindow.document.body)}
    </div>
  );
}

export default App;