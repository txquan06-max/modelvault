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
  currentModel, getModelName, t, bgImage, bgSize, bgPosition
}: any) => {
  const currentTaskName = currentTask ? t(currentTask.name) : t('noTask');
  const formatTime = (totalSec: number) => { const h = Math.floor(totalSec / 3600); const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0'); const s = (totalSec % 60).toString().padStart(2, '0'); if (h > 0) return `${h}:${m}:${s}`; return `${m}:${s}`; };
  const remainingSeconds = timeboxTarget > 0 ? Math.max(0, timeboxTarget - timeboxElapsed) : 0;
  const isTimeUp = timeboxTarget > 0 && remainingSeconds === 0 && timeboxElapsed > 0;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try { const base64 = await compressImage(file, 800, 0.6); setFinishPartPhoto(base64); } 
      catch (err) { alert("Image processing failed"); }
    }
    e.target.value = '';
  };

  const pipClass = `pip-container ${timerState === 'Running' ? 'pip-running' : ''}`;

  if (isPip) {
    return (
      <div className={pipClass}>
        {bgImage && (
          <img src={bgImage} alt="bg" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: bgSize as any, objectPosition: bgPosition, zIndex: -1, opacity: 0.9 }} />
        )}
        {bgImage && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 0 }} />}
        
        <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <div className="selector-group" style={{ marginBottom: '0' }}>
            <div className="selector-row">
              <select id="pip-model-select" value={currentModelId} onChange={(e) => { AudioManager.playClick(); setCurrentModelId(e.target.value); }} disabled={timerState !== 'Idle' || lastSession !== null || isFinishingPart}>
                {models.map((m: any) => <option key={m.id} value={m.id}>{getModelName(m)} {m.isRebuilding ? '🔧' : m.status === 'Completed' ? '✅' : ''}</option>)}
              </select>
            </div>
            <div className="selector-row">
              <select id="pip-task-select" value={currentTaskId} onChange={(e) => { AudioManager.playClick(); setCurrentTaskId(e.target.value); }} disabled={timerState !== 'Idle' || tasks.length === 0 || lastSession !== null || isFinishingPart}>
                {tasks.map((t_item: any) => <option key={t_item.id} value={t_item.id}>{t_item.status === 'Completed' ? '✅ ' : ''}{t(t_item.name)}</option>)}
              </select>
            </div>
          </div>

          <div className="task-header" style={{ justifyContent: 'center' }}>
            <div className="task-name" style={{ fontSize: '15px' }}>{currentTaskName}</div>
          </div>

          <div className={`timer-display ${timerState.toLowerCase()} ${isTimeUp ? 'time-up' : ''}`} style={{ margin: '10px 0', fontSize: '42px' }}>{formatTime(activeSeconds)}</div>

          {lastSession ? (
            <div className="inline-confirm">
              <div className="confirm-text" style={{ fontSize: '12px' }}>{t('saved')}: {formatTime(lastSession.duration)}<br/><span>{t('confirmStage')}</span></div>
              <div className="confirm-actions" style={{ flexDirection: 'column' }}>
                <button className="btn yes" onClick={handleConfirmStageDone}>{t('yesDone')}</button>
                <button className="btn no" onClick={handleCancelDone}>{t('keepWorking')}</button>
              </div>
            </div>
          ) : (
            <div className="controls" style={{ flexDirection: 'column' }}>
              {timerState === 'Idle' && <button className="btn start" onClick={handleStart} disabled={!currentTaskId || currentTask?.status === 'Completed'}>{currentTask?.status === 'Completed' ? t('statusCompleted') : t('start')}</button>}
              {timerState === 'Running' && <button className="btn pause" onClick={handlePause}>{t('pause')}</button>}
              {timerState === 'Paused' && (<><button className="btn resume" onClick={handleResume}>{t('resume')}</button><button className="btn complete" onClick={handleComplete}>{t('complete')}</button></>)}
            </div>
          )}
          {timerState === 'Running' && <button className="btn complete-outline" onClick={handleComplete} style={{ padding: '6px' }}>{t('complete')}</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="view-content focus-panel">
      <div className="selector-group">
        <div className="selector-row">
          <select id="pip-model-select" value={currentModelId} onChange={(e) => { AudioManager.playClick(); setCurrentModelId(e.target.value); }} disabled={timerState !== 'Idle' || lastSession !== null || isFinishingPart}>
            {models.map((m: any) => <option key={m.id} value={m.id}>{getModelName(m)} {m.isRebuilding ? '🔧' : m.status === 'Completed' ? '✅' : ''}</option>)}
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
      {timerState === 'Idle' && !lastSession && timeboxElapsed === 0 && !isFinishingPart && (
        <div className="timebox-selector">
          <span className="timebox-label">{t('timebox')}:</span>
          {[0, 15, 30, 60].map(min => (
            <button key={min} className={`timebox-btn ${timeboxTarget === min * 60 ? 'active' : ''}`} onClick={() => { AudioManager.playClick(); setTimeboxTarget(min * 60); }}>
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
            <button key={stage.id} className={`stage-btn ${stage.id === currentStageId ? 'active' : ''} ${stage.status === 'Completed' ? 'done' : ''}`} onClick={() => { AudioManager.playClick(); setCurrentStageId(stage.id); }} disabled={timerState === 'Paused' || currentTask.status === 'Completed'}>
              {t(stage.nameKey)} {stage.status === 'Completed' ? '✓' : ''}
            </button>
          ))}
        </div>
      )}
      {isFinishingPart ? (
        <div className="inline-confirm">
          <div className="confirm-text">🎉 {t('finishPart')}!</div>
          <div style={{ width: '100%', display: 'flex', gap: '8px' }}>
            <input id="pip-photo-url" type="text" value={finishPartPhoto.startsWith('data:') ? t('localImageSelected') : finishPartPhoto} onChange={e => setFinishPartPhoto(e.target.value)} placeholder={t('addPhotoUrl')} className="photo-input" style={{ flex: 1 }} disabled={finishPartPhoto.startsWith('data:')} />
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
          {timerState === 'Idle' && <button className="btn start" onClick={handleStart} disabled={!currentTaskId || currentStage?.status === 'Completed' || currentTask?.status === 'Completed'}>{currentTask?.status === 'Completed' ? t('statusCompleted') : t('start')}</button>}
          {timerState === 'Running' && <button className="btn pause" onClick={handlePause}>{t('pause')}</button>}
          {timerState === 'Paused' && (<><button className="btn resume" onClick={handleResume}>{t('resume')}</button><button className="btn complete" onClick={handleComplete}>{t('complete')}</button></>)}
        </div>
      )}
      {timerState === 'Running' && <button className="btn complete-outline" onClick={handleComplete}>{t('complete')}</button>}
    </div>
  );
};

function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'focus' | 'journal' | 'hangar' | 'profile'>('focus');
  const [viewingModelId, setViewingModelId] = useState<string | null>(null);
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
  const [bgImage, setBgImage] = useState('');
  const [tempBgUrl, setTempBgUrl] = useState('');
  const [bgSize, setBgSize] = useState(() => StorageManager.getBgSize());
  const [bgPosition, setBgPosition] = useState(() => StorageManager.getBgPosition());
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

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

  // 新增：历史模型补录搜索状态
  const [legacyInput, setLegacyInput] = useState('');
  const [legacyResults, setLegacyResults] = useState<GunplaItem[]>([]);
  const [legacyList, setLegacyList] = useState<GunplaItem[]>([]);
  const [showLegacyForm, setShowLegacyForm] = useState(false);

  const [timeboxTarget, setTimeboxTarget] = useState(() => StorageManager.getTimeboxTarget());
  const [timeboxElapsed, setTimeboxElapsed] = useState(() => StorageManager.getTimeboxElapsed());
  const [hasPlayedTimeboxSound, setHasPlayedTimeboxSound] = useState(false);
  const [username, setUsername] = useState(() => StorageManager.getUsername());
  const [showModelDetails, setShowModelDetails] = useState(false);
  const [showTimeDetails, setShowTimeDetails] = useState(false);
  const engineRef = useRef(new TimerEngine());
  const [pipWindow, setPipWindow] = useState<Window | null>(null);

  const getModelName = (m: Model) => i18n.language === 'zh' ? m.name.zh : m.name.en;
  const getModelSeries = (m: Model) => i18n.language === 'zh' ? m.series.zh : m.series.en;

  useEffect(() => { GunplaSearch.init(); }, []);

  // 新建模型搜索
  useEffect(() => {
    if (!isAddingModel) return;
    const timer = setTimeout(() => { setSearchResults(GunplaSearch.search(newModelNameInput)); }, 200);
    return () => clearTimeout(timer);
  }, [newModelNameInput, isAddingModel]);

  // 历史模型补录搜索
  useEffect(() => {
    if (!showLegacyForm) return;
    const timer = setTimeout(() => { setLegacyResults(GunplaSearch.search(legacyInput)); }, 200);
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
    setBgImage(StorageManager.getBgImage());
    setTempBgUrl(StorageManager.getBgImage());
    setBgSize(StorageManager.getBgSize());
    setBgPosition(StorageManager.getBgPosition());
    const allModels = ModelManager.getAllModels();
    setModels(allModels);
    if (!currentModelId && allModels.length > 0) setCurrentModelId(allModels[0].id);
  };

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
    if (timeboxTarget > 0 && timeboxElapsed >= timeboxTarget && !hasPlayedTimeboxSound && timerState === 'Running') {
      AudioManager.playTimeboxEnd(); setHasPlayedTimeboxSound(true);
    }
  }, [timeboxElapsed, timeboxTarget, hasPlayedTimeboxSound, timerState]);

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); };
  const toggleLanguage = () => { AudioManager.playClick(); const next = i18n.language === 'zh' ? 'en' : 'zh'; i18n.changeLanguage(next); localStorage.setItem('lang', next); };

  const handleStart = () => { AudioManager.playStart(); engineRef.current.start(); setModels(ModelManager.startStage(currentTaskId, currentStageId)); setHasPlayedTimeboxSound(false); refreshData(); };
  const handlePause = () => { AudioManager.playClick(); engineRef.current.pause(); };
  const handleResume = () => { AudioManager.playClick(); engineRef.current.resume(); };
  
  const handleComplete = () => {
    AudioManager.playComplete();
    const result = engineRef.current.complete();
    if (result) {
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

  const handleConfirmStageDone = () => {
    AudioManager.playStageDone();
    const updated = ModelManager.completeStage(currentTaskId, lastSession?.stageId || null);
    setModels(updated); refreshData(); setLastSession(null); processAchievements();
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
  };

  const handleAddModel = () => {
    if (!newModelNameInput.trim() && !selectedGunpla) return;
    const nameObj = selectedGunpla ? selectedGunpla.name : { en: newModelNameInput.trim(), zh: newModelNameInput.trim() };
    const seriesObj = selectedGunpla ? selectedGunpla.series : { en: newModelSeriesInput.trim() || 'Unknown', zh: newModelSeriesInput.trim() || '未知' };

    const updated = ModelManager.addModel(nameObj, newModelGrade, seriesObj, useDefaultTasks);
    setModels(updated); setCurrentModelId(updated[updated.length - 1].id);
    
    setNewModelNameInput(''); setNewModelSeriesInput(''); setSelectedGunpla(null);
    setIsAddingModel(false); setUseDefaultTasks(true); setSearchResults([]);
    processAchievements();
  };

  // 历史模型暂存
  const addToLegacyList = (item: GunplaItem) => {
    if (!legacyList.some(i => i.id === item.id)) {
      setLegacyList([...legacyList, item]);
    }
    setLegacyInput('');
    setLegacyResults([]);
  };

  const removeLegacyItem = (id: string) => {
    setLegacyList(legacyList.filter(i => i.id !== id));
  };

  const handleLegacyImport = () => {
    if (legacyList.length === 0) return;
    
    const result = ModelManager.importLegacyModelsFromList(legacyList.map(item => ({
      name: item.name,
      grade: item.grade,
      series: item.series
    })));
    
    if (result.count > 0) {
      AudioManager.playFinishPart(); 
      showToast(t('importedSuccess', { count: result.count }));
      setLegacyList([]); 
      setShowLegacyForm(false); 
      refreshData(); 
      processAchievements();
    }
  };

  const handleReopenModel = (modelId: string) => {
    AudioManager.playClick();
    const updated = ModelManager.reopenModel(modelId);
    setModels(updated); refreshData(); setCurrentModelId(modelId); setActiveTab('focus'); setViewingModelId(null);
    showToast(t('reopenedForRebuild'));
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
    setTempBgUrl(bgImage);
    setBgSize(StorageManager.getBgSize());
    setBgPosition(StorageManager.getBgPosition());
    setIsPreviewOpen(true);
  };

  const applyBackground = () => {
    if (!tempBgUrl || tempBgUrl.trim() === '') {
      alert("请输入图片链接或上传本地图片。");
      return;
    }
    setBgImage(tempBgUrl);
    StorageManager.setBgImage(tempBgUrl);
    StorageManager.setBgSize(bgSize);
    StorageManager.setBgPosition(bgPosition);
    setIsPreviewOpen(false);
    alert("✅ 背景图与适配设置应用成功！");
  };

  const handleBgFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await compressImage(file, 800, 0.4);
        if (base64.length > 1.5 * 1024 * 1024) {
          alert("❌ 图片压缩后仍然过大（>1.5MB），无法存入本地。请更换图片或使用网络URL。");
          return;
        }
        setTempBgUrl(base64); 
        setBgImage(base64);
        StorageManager.setBgImage(base64);
        setBgSize('cover');
        setBgPosition('center');
        StorageManager.setBgSize('cover');
        StorageManager.setBgPosition('center');
        alert("✅ 本地背景图上传成功！点击“预览适配”进行调整。");
      } catch (err) { alert("❌ 图片处理失败"); }
    }
    e.target.value = '';
  };

  const handleAudioUpload = (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) { alert("Audio file too large (max 1MB)"); return; }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const newAudios = { ...customAudios, [type]: base64 };
      setCustomAudios(newAudios);
      try {
        StorageManager.setCustomAudios(newAudios);
        updateAudioSetting(type, 'custom');
      } catch (err) {
        alert("本地存储空间不足，音效保存失败。");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const buyTitle = (id: string) => { if (UserManager.buyTitle(id)) { AudioManager.playAchievement(); showToast(t('titleUnlocked')); refreshData(); } else { AudioManager.playClick(); showToast(t('notEnoughCoins')); } };
  const equipTitle = (id: string) => { StorageManager.setEquippedTitle(id); setEquippedTitle(id); AudioManager.playStageDone(); };

  const handleOpenPiP = async () => {
    AudioManager.playClick();
    if (!('documentPictureInPicture' in window)) { alert("Your browser does not support PiP. Please use Chrome/Edge."); return; }
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
    } catch (err) { console.error(err); }
  };

  const exportData = () => { const data = StorageManager.exportAll(); const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `modelvault_backup_${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url); };
  const importData = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (event) => { try { const data = JSON.parse(event.target?.result as string); if (StorageManager.importAll(data)) { alert(t('importSuccess')); window.location.reload(); } else { alert(t('importError')); } } catch (err) { alert(t('importError')); } }; reader.readAsText(file); e.target.value = ''; };

  const formatTime = (totalSec: number) => { const h = Math.floor(totalSec / 3600); const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0'); const s = (totalSec % 60).toString().padStart(2, '0'); if (h > 0) return `${h}:${m}:${s}`; return `${m}:${s}`; };
  const formatLogDate = (timestamp: number) => { const d = new Date(timestamp); return `${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`; };
  const getHistoryLogs = () => { const sessions = SessionManager.getAllSessions(); return sessions.sort((a, b) => b.startedAt - a.startedAt).map(s => ({ ...s, details: ModelManager.getTaskDetails(s.taskId), stageNameKey: ModelManager.getStageNameKey(s.taskId, s.stageId) })); };

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
  const hasLegacyImported = StorageManager.isLegacyImported();

  const panelProps = {
    currentModelId, setCurrentModelId, currentTaskId, setCurrentTaskId, currentStageId, setCurrentStageId,
    models, tasks, currentTask, currentStage, timerState, activeSeconds, lastSession,
    timeboxTarget, setTimeboxTarget, timeboxElapsed, handleStart, handlePause, handleResume, handleComplete, 
    handleConfirmStageDone, handleCancelDone, handleFinishPart,
    isFinishingPart, setIsFinishingPart, finishPartPhoto, setFinishPartPhoto, handleConfirmFinishPart,
    currentModel, getModelName, t,
    bgImage, bgSize, bgPosition
  };

  const viewingModel = models.find(m => m.id === viewingModelId);
  const viewingModelTotalSec = viewingModel ? SessionManager.getAllSessions().filter(s => viewingModel.tasks.some(t => t.id === s.taskId)).reduce((sum, s) => sum + s.activeSeconds, 0) : 0;

  return (
    <div className="app-wrapper">
      {bgImage && (
        <img src={bgImage} alt="background" className="app-bg-img" style={{ objectFit: bgSize as any, objectPosition: bgPosition }} />
      )}
      
      {toastMsg && <div className="toast">{toastMsg}</div>}

      <div className="mini-window">
        {viewingModel ? (
          <div className="profile-topbar">
            <button className="back-btn" onClick={() => { AudioManager.playClick(); setViewingModelId(null); }}>← {t('backToHangar')}</button>
            <div className="top-right"><button className="lang-btn" onClick={toggleLanguage}>{i18n.language === 'zh' ? 'EN' : '中'}</button></div>
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
            </div>
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
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              {viewingModel.status === 'Completed' && <button className="btn start" onClick={() => handleReopenModel(viewingModel.id)}>{t('continueRebuild')}</button>}
              {viewingModel.isRebuilding && <button className="btn start" onClick={() => { setCurrentModelId(viewingModel.id); setActiveTab('focus'); setViewingModelId(null); }}>{t('backToFocus')}</button>}
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'focus' && (
              <div className="view-content">
                <div className="add-controls">
                  <button className="add-btn-large" onClick={() => setIsAddingModel(true)} disabled={timerState !== 'Idle' || isFinishingPart}>+ {t('addModel')}</button>
                  <button className="add-btn-large" onClick={() => setIsAddingTask(true)} disabled={timerState !== 'Idle' || !currentModelId || isFinishingPart}>+ {t('addTask')}</button>
                </div>
                
                {isAddingModel && (
                  <div className="inline-form vertical-form" style={{ position: 'relative' }}>
                    <div className="search-autocomplete">
                      <input id="new-model-name" autoFocus placeholder={t('modelName')} value={newModelNameInput} onChange={e => { setNewModelNameInput(e.target.value); setSelectedGunpla(null); }} onBlur={() => setTimeout(() => setSearchResults([]), 200)} />
                      {searchResults.length > 0 && (
                        <div className="autocomplete-dropdown">
                          {searchResults.map((item, idx) => {
                            const displayName = i18n.language === 'zh' ? item.name.zh : item.name.en;
                            const displaySeries = i18n.language === 'zh' ? item.series.zh : item.series.en;
                            return (
                              <div key={idx} className="autocomplete-item" onClick={() => { setNewModelNameInput(displayName); setNewModelSeriesInput(displaySeries); setNewModelGrade(item.grade); setSelectedGunpla(item); setSearchResults([]); }}>
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
                    
                    <select id="new-model-grade" value={newModelGrade} onChange={e => setNewModelGrade(e.target.value)}>{['HG', 'RG', 'MG', 'MGEX', 'MGSD', 'FM', 'PG'].map(g => <option key={g} value={g}>{g}</option>)}</select>
                    <input id="new-model-series" placeholder={t('series')} value={newModelSeriesInput} onChange={e => setNewModelSeriesInput(e.target.value)} disabled={!!selectedGunpla} />
                    <label className="checkbox-label"><input type="checkbox" checked={useDefaultTasks} onChange={e => setUseDefaultTasks(e.target.checked)} />{t('useDefaultTasks')}</label>
                    <div style={{display:'flex', gap:'8px', width:'100%'}}>
                      <button className="btn start" style={{flex: 1, padding: '6px'}} onClick={handleAddModel}>{t('save')}</button>
                      <button className="btn no" style={{flex: 1, padding: '6px'}} onClick={() => { setIsAddingModel(false); setSearchResults([]); }}>{t('cancel')}</button>
                    </div>
                  </div>
                )}

                {isAddingTask && (
                  <div className="inline-form">
                    <input id="new-task-name" autoFocus placeholder={t('taskName')} value={newTaskName} onChange={e => setNewTaskName(e.target.value)} onKeyDown={e => {
                      if (e.key === 'Enter' && newTaskName.trim()) {
                        const updated = ModelManager.addTask(currentModelId, newTaskName.trim());
                        setModels(updated); setNewTaskName(''); setIsAddingTask(false);
                      }
                    }} />
                    <button onClick={() => setIsAddingTask(false)}>{t('cancel')}</button>
                  </div>
                )}
                <FocusPanel {...panelProps} isPip={false} />
              </div>
            )}

            {activeTab === 'journal' && (
              <div className="view-content journal-view">
                <div className="journal-list">
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
                    <input id="username-input" type="text" value={username} onChange={handleUsernameChange} className="username-input" />
                    {equippedTitleDef && <div className="equipped-title">[{t(equippedTitleDef.nameKey)}]</div>}
                  </div>
                </div>
                <div className="stats-grid">
                  <div className="stat-card" onClick={() => setShowModelDetails(!showModelDetails)}>
                    <div className="stat-label">{t('totalModels')}</div>
                    <div className="stat-value">{modelStats.total}</div>
                    {showModelDetails && (<div className="stat-details">{['HG', 'RG', 'MG', 'PG'].map(grade => modelStats[grade] > 0 ? (<div key={grade} className="detail-row"><span>{grade}</span> <span>{modelStats[grade]}</span></div>) : null)}</div>)}
                  </div>
                  <div className="stat-card" onClick={() => setShowTimeDetails(!showTimeDetails)}>
                    <div className="stat-label">{t('totalTime')}</div>
                    <div className="stat-value">{formatTime(timeStats.totalSeconds)}</div>
                    {showTimeDetails && (<div className="stat-details">{Object.entries(timeStats.stageTime).map(([stageKey, seconds]) => seconds > 0 ? (<div key={stageKey} className="detail-row"><span>{t(stageKey)}</span> <span>{formatTime(seconds)}</span></div>) : null)}</div>)}
                  </div>
                </div>

                {!hasLegacyImported && (
                  <div className="custom-section" style={{ border: '1px dashed #3b82f6' }}>
                    <h4>📦 {t('legacyImport')}</h4>
                    <p style={{ fontSize: '11px', color: '#aaa', marginBottom: '10px' }}>{t('legacyDesc')}</p>
                    {!showLegacyForm ? (
                      <button className="btn start" style={{ width: '100%', padding: '8px' }} onClick={() => setShowLegacyForm(true)}>{t('legacyImport')}</button>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {/* 替换了原来的 textarea，改为搜索联想 */}
                        <div className="search-autocomplete">
                          <input 
                            id="legacy-search-input"
                            autoFocus 
                            placeholder={i18n.language === 'zh' ? "搜索要补录的模型，回车添加..." : "Search models to import, press Enter..."} 
                            value={legacyInput} 
                            onChange={e => setLegacyInput(e.target.value)} 
                            onKeyDown={e => {
                              // 按回车快速添加搜索结果的第一项
                              if (e.key === 'Enter' && legacyResults.length > 0) {
                                addToLegacyList(legacyResults[0]);
                              }
                            }}
                            onBlur={() => setTimeout(() => setLegacyResults([]), 200)} 
                          />
                          {legacyResults.length > 0 && (
                            <div className="autocomplete-dropdown">
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

                        {/* 暂存列表 */}
                        {legacyList.length > 0 && (
                          <div className="legacy-temp-list">
                            {legacyList.map((item, idx) => {
                              const displayName = i18n.language === 'zh' ? item.name.zh : item.name.en;
                              return (
                                <div key={idx} className="legacy-temp-item">
                                  <span><span className="ac-grade">{item.grade}</span> {displayName}</span>
                                  <button onClick={() => removeLegacyItem(item.id)}>✕</button>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <button className="btn start" style={{ flex: 1, padding: '6px' }} onClick={handleLegacyImport} disabled={legacyList.length === 0}>
                            {t('importBtn')} ({legacyList.length})
                          </button>
                          <button className="btn no" style={{ flex: 1, padding: '6px' }} onClick={() => { setShowLegacyForm(false); setLegacyList([]); }}>
                            {t('cancel')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="custom-section">
                  <h4>⚙️ {t('customization')}</h4>
                  <div className="custom-row">
                    <span>{t('bgUrl')}:</span>
                    <div style={{display:'flex', gap:'8px', width:'100%', flexWrap:'wrap'}}>
                      <input id="bg-url-input" type="text" value={tempBgUrl.startsWith('data:') ? t('localImageSelected') : tempBgUrl} onChange={e => setTempBgUrl(e.target.value)} placeholder="https://..." className="url-input" disabled={tempBgUrl.startsWith('data:')} />
                      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                        <button className="mini-btn" onClick={openPreview}>预览适配</button>
                        <label className="mini-btn" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', margin: 0 }}>
                          📁 上传
                          <input type="file" accept="image/*" onChange={handleBgFileUpload} style={{ display: 'none' }} />
                        </label>
                        {bgImage && <button className="mini-btn" style={{color: '#ef4444'}} onClick={() => { setBgImage(''); setTempBgUrl(''); StorageManager.setBgImage(''); }}>清除</button>}
                      </div>
                    </div>
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
                  <div className="backup-actions">
                    <button className="backup-btn" onClick={exportData}>{t('exportData')}</button>
                    <label className="backup-btn import-label">{t('importData')}<input type="file" accept=".json" onChange={importData} style={{ display: 'none' }} /></label>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {isPreviewOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '400px' }}>
            <h3>背景图预览与编辑</h3>
            <p style={{ fontSize: '12px', color: '#aaa' }}>左侧为手机屏幕比例，右侧为悬浮窗比例（固定 320x480）。</p>
            
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '160px', height: '280px', backgroundColor: '#1e1e1e', border: '1px solid #444', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                  {tempBgUrl && <img src={tempBgUrl} style={{ width: '100%', height: '100%', objectFit: bgSize as any, objectPosition: bgPosition }} />}
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#fff', fontWeight: 'bold' }}>Main</div>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '160px', height: '240px', backgroundColor: '#1e1e1e', border: '2px solid #3b82f6', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                  {tempBgUrl && <img src={tempBgUrl} style={{ width: '100%', height: '100%', objectFit: bgSize as any, objectPosition: bgPosition }} />}
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#fff', fontWeight: 'bold' }}>PiP (2:3)</div>
                </div>
              </div>
            </div>

            <div className="custom-row">
              <span>填充模式 (Object-Fit):</span>
              <select value={bgSize} onChange={e => setBgSize(e.target.value)} style={{ padding: '6px', marginBottom: '10px' }}>
                <option value="cover">Cover (覆盖并裁切)</option>
                <option value="contain">Contain (包含并留边)</option>
                <option value="fill">Fill (拉伸填满)</option>
              </select>
              
              <span>对齐位置 (Object-Position):</span>
              <select value={bgPosition} onChange={e => setBgPosition(e.target.value)} style={{ padding: '6px' }}>
                <option value="center">居中 (Center)</option>
                <option value="top">顶部对齐 (Top)</option>
                <option value="bottom">底部对齐 (Bottom)</option>
                <option value="left">左对齐 (Left)</option>
                <option value="right">右对齐 (Right)</option>
              </select>
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button onClick={() => setIsPreviewOpen(false)} style={{ background: 'transparent', color: '#aaa' }}>取消</button>
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