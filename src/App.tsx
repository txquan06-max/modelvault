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

import { FocusView } from './views/FocusView';
import { JournalView } from './views/JournalView';
import { HangarView } from './views/HangarView';
import { ProfileView } from './views/ProfileView';
import { ModelDetail } from './components/ModelDetail';
import { FocusPanel } from './components/FocusPanel';
import { Modals } from './components/Modals';

const isWeChat = /MicroMessenger/i.test(navigator.userAgent);

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
  const [isResetting, setIsResetting] = useState(false);
  const [localTime, setLocalTime] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  const getModelName = (m: Model) => i18n.language === 'zh' ? m.name.zh : m.name.en;
  const getModelSeries = (m: Model) => i18n.language === 'zh' ? m.series.zh : m.series.en;

  useEffect(() => {
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
    GunplaSearch.init();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setLocalTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000 * 10);
    return () => clearInterval(timer);
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
      if (document.visibilityState === 'visible') setActiveSeconds(engineRef.current.getActiveSeconds());
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
      if (legacyInput.trim().length > 0) setLegacyResults(GunplaSearch.search(legacyInput));
      else setLegacyResults([]);
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
      if (!currentModelId || !available.some(m => m.id === currentModelId)) setCurrentModelId(available[0].id);
    } else setCurrentModelId(''); 
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
    if (timerState === 'Running' && timeboxTarget > 0 && timeboxElapsed >= timeboxTarget && !hasPlayedTimeboxSound) {
      AudioManager.playTimeboxEnd(); setHasPlayedTimeboxSound(true);
    }
  }, [timeboxElapsed, timeboxTarget, hasPlayedTimeboxSound, timerState]);

  useEffect(() => {
    if (timerState === 'Running' && reminderInterval > 0) {
      if (activeSeconds > 0 && activeSeconds % reminderInterval === 0 && activeSeconds !== lastRemindedAt) {
        AudioManager.playTimeboxEnd();
        showToast(i18n.language === 'zh' ? `⏰ 已专注 ${reminderInterval / 60} 分钟，记得休息一下！` : `⏰ Focused for ${reminderInterval / 60} min. Take a break!`);
        setLastRemindedAt(activeSeconds);
      }
    }
  }, [activeSeconds, timerState, reminderInterval, lastRemindedAt]);

  useEffect(() => { if (timerState !== 'Running') setLastRemindedAt(0); }, [timerState]);

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); };
  const toggleLanguage = () => { AudioManager.playClick(); const next = i18n.language === 'zh' ? 'en' : 'zh'; i18n.changeLanguage(next); localStorage.setItem('lang', next); };

  const handleSetTimeboxTarget = (min: number) => {
    AudioManager.playClick(); setTimeboxTarget(min * 60); setTimeboxElapsed(0); setHasPlayedTimeboxSound(false);
  };

  const handleStart = () => { AudioManager.playStart(); engineRef.current.start(); setModels(ModelManager.startStage(currentTaskId, currentStageId)); setHasPlayedTimeboxSound(false); refreshData(); };
  const handlePause = () => { AudioManager.playPause(); engineRef.current.pause(); };
  const handleResume = () => { AudioManager.playStart(); engineRef.current.resume(); };
  
  const handleComplete = () => {
    const result = engineRef.current.complete();
    if (result) {
      if (result.activeSeconds < 10) { showToast(i18n.language === 'zh' ? '计时太短，无法记录（至少10秒）。' : 'Time too short, not saved (min 10s).'); return; }
      AudioManager.playComplete();
      SessionManager.saveSession({ id: crypto.randomUUID(), taskId: currentTaskId, stageId: currentStageId, ...result });
      refreshData(); setLastSession({ duration: result.activeSeconds, stageId: currentStageId });
    }
  };

  const processAchievements = () => {
    const newlyEarned = AchievementManager.checkAll();
    if (newlyEarned.length > 0) {
      AudioManager.playAchievement(); newlyEarned.forEach(ach => showToast(`🏆 ${t(ach.nameKey)}`));
    }
  };

  const checkAndPromptCompleteModel = (updatedModels: Model[], modelId?: string) => {
    let targetId = modelId;
    if (!targetId) { const m = updatedModels.find(m => m.tasks.some(t => t.id === currentTaskId)); targetId = m?.id; }
    if (!targetId) return;
    const targetModel = updatedModels.find(m => m.id === targetId);
    if (targetModel && targetModel.tasks.length > 0 && targetModel.tasks.every(t => t.status === 'Completed') && targetModel.status !== 'Completed') {
      setShowCompleteModelConfirm(true); setCompleteModelId(targetId);
    }
  };

  const handleConfirmStageDone = () => {
    AudioManager.playStageDone();
    const updated = ModelManager.completeStage(currentTaskId, lastSession?.stageId || null);
    setModels(updated); refreshData(); setLastSession(null); processAchievements(); checkAndPromptCompleteModel(updated);
  };

  const handleFinishPart = () => {
    AudioManager.playClick();
    const assembly = tasks.find(t => t.id === currentTaskId)?.stages.find(s => s.nameKey === 'stage_assembly');
    if (assembly && assembly.status !== 'Completed') { showToast(t('errorAssemblyRequired')); return; }
    setFinishPartPhoto(''); setIsFinishingPart(true);
  };

  const handleConfirmFinishPart = () => {
    AudioManager.playFinishPart();
    const result = ModelManager.finishTask(currentTaskId, finishPartPhoto);
    if (result.error) { showToast(t(result.error)); return; }
    setModels(result.models); refreshData(); processAchievements(); setTimeboxTarget(0); setTimeboxElapsed(0); setHasPlayedTimeboxSound(false); setIsFinishingPart(false); checkAndPromptCompleteModel(result.models);
  };

  const handleConfirmCompleteModel = () => {
    if (!completeModelId) return;
    AudioManager.playFinishPart(); const updated = ModelManager.finishModel(completeModelId);
    setModels(updated); refreshData(); setShowCompleteModelConfirm(false); setCompleteModelId(null);
    showToast(i18n.language === 'zh' ? '🎉 模型已收入格纳库！' : '🎉 Model added to Hangar!');
  };

  const handleAddModel = () => {
    if (!newModelNameInput.trim() && !selectedGunpla) return;
    AudioManager.playClick();
    const nameObj = selectedGunpla ? selectedGunpla.name : { en: newModelNameInput.trim(), zh: newModelNameInput.trim() };
    const seriesObj = selectedGunpla ? selectedGunpla.series : { en: newModelSeriesInput.trim() || 'Unknown', zh: newModelSeriesInput.trim() || '未知' };
    const updated = ModelManager.addModel(nameObj, newModelGrade, seriesObj, useDefaultTasks);
    setModels(updated); setCurrentModelId(updated[updated.length - 1].id);
    setNewModelNameInput(''); setNewModelSeriesInput(''); setSelectedGunpla(null); setIsAddingModel(false); setUseDefaultTasks(true); setSearchResults([]); processAchievements();
  };

  const handleAddTask = (name: string) => {
    const updated = ModelManager.addTask(currentModelId, name);
    setModels(updated); 
  };

  const addToLegacyList = (item: GunplaItem) => {
    AudioManager.playClick();
    if (!legacyList.some(i => i.name.en === item.name.en && i.grade === item.grade)) setLegacyList([...legacyList, { ...item }]);
    else showToast(i18n.language === 'zh' ? '该模型已经在待导入列表中啦！' : 'Model already in import list!');
    setLegacyInput(''); setLegacyResults([]);
  };

  const removeLegacyItem = (id: string) => { AudioManager.playClick(); setLegacyList(legacyList.filter(i => i.id !== id)); };

  const handleLegacyCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const reader = new FileReader(); reader.readAsDataURL(file);
        reader.onload = (ev) => {
           const img = new Image(); img.src = ev.target?.result as string;
           img.onload = () => {
             const canvas = document.createElement('canvas'); let w = img.width; let h = img.height;
             if(w > 400) { h = Math.round((h * 400) / w); w = 400; }
             canvas.width = w; canvas.height = h; canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
             const newList = [...legacyList]; newList[index].coverImage = canvas.toDataURL('image/jpeg', 0.6); setLegacyList(newList);
           };
        };
      } catch (err) { showToast(i18n.language === 'zh' ? '图片上传失败' : 'Image upload failed'); }
    }
    e.target.value = '';
  };

  const handleLegacyImport = () => {
    if (legacyList.length === 0) return;
    AudioManager.playClick(); const result = ModelManager.importLegacyModelsFromList(legacyList);
    if (result.count > 0) {
      AudioManager.playFinishPart(); showToast(t('importedSuccess', { count: result.count }));
      setLegacyList([]); refreshData(); processAchievements();
    }
  };

  const handleDeleteModel = (modelId: string) => {
    AudioManager.playClick(); const updated = ModelManager.deleteModel(modelId);
    setModels(updated); setViewingModelId(null); refreshData(); showToast(i18n.language === 'zh' ? "已删除" : "Deleted");
  };

  const handleJumpToFocus = (taskId: string, stageId: string | null = null) => {
    AudioManager.playClick();
    if (viewingModel?.status === 'Completed' || viewingModel?.isRebuilding) {
      const updated = ModelManager.reopenModel(viewingModel.id); setModels(updated);
    }
    setCurrentModelId(viewingModelId!); setCurrentTaskId(taskId); if (stageId) setCurrentStageId(stageId);
    setActiveTab('focus'); setViewingModelId(null);
  };

  const handleStartRebuild = (taskId: string) => {
    AudioManager.playClick(); setPendingRebuildTask(taskId);
    const stages = viewingModel?.tasks.find(t => t.name === 'part_legacy')?.stages.filter(s => s.status === 'Completed').map(s => s.nameKey) || ['stage_assembly'];
    setImportedStages(stages); setIsEditingImportedStatus(true);
  };

  const handleConfirmRebuild = () => {
    if (!viewingModel) return;
    AudioManager.playStageDone(); const updated = ModelManager.startLegacyRebuild(viewingModel.id, importedStages);
    setModels(updated); setIsEditingImportedStatus(false); setShowRebuildConfirm(true);
  };

  const handleDoRebuild = () => {
    AudioManager.playClick(); setShowRebuildConfirm(false);
    if (pendingRebuildTask) { handleJumpToFocus(pendingRebuildTask); setPendingRebuildTask(null); }
  };

  const handleSaveImportedStages = () => {
    if (!viewingModelId) return;
    AudioManager.playStageDone(); const updated = ModelManager.updateImportedModelStatus(viewingModelId, importedStages);
    setModels(updated); setIsEditingImportedStatus(false); checkAndPromptCompleteModel(updated, viewingModelId);
  };

  const handleCancelDone = () => { AudioManager.playClick(); setLastSession(null); };
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => { setUsername(e.target.value); StorageManager.setUsername(e.target.value); };
  const updateAudioSetting = (type: string, style: string) => { const newSettings = { ...audioSettings, [type]: style }; setAudioSettings(newSettings); StorageManager.setAudioSettings(newSettings); if (style !== 'off') AudioManager.previewSound(type as any); };

  const openPreview = () => { AudioManager.playClick(); setBgSize(StorageManager.getBgSize()); setBgPosition(StorageManager.getBgPosition()); setIsPreviewOpen(true); };
  const applyBackground = () => { AudioManager.playClick(); StorageManager.setBgSize(bgSize); StorageManager.setBgPosition(bgPosition); setIsPreviewOpen(false); showToast(i18n.language === 'zh' ? '✅ 适配设置应用成功！' : '✅ Settings applied!'); };

  const handleBgFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'pip') => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const reader = new FileReader(); reader.readAsDataURL(file);
        reader.onload = (ev) => {
           const img = new Image(); img.src = ev.target?.result as string;
           img.onload = () => {
             const canvas = document.createElement('canvas'); let w = img.width; let h = img.height;
             if(w > 800) { h = Math.round((h * 800) / w); w = 800; }
             canvas.width = w; canvas.height = h; canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
             const base64 = canvas.toDataURL('image/jpeg', 0.4);
             if (type === 'main') { setBgMain(base64); StorageManager.setBgMain(base64); } 
             else { setBgPip(base64); StorageManager.setBgPip(base64); }
             showToast(i18n.language === 'zh' ? '✅ 背景图上传成功！' : '✅ Background uploaded!');
           };
        };
      } catch (err) { showToast(i18n.language === 'zh' ? '❌ 图片处理失败' : '❌ Image processing failed'); }
    }
    e.target.value = '';
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && viewingModelId) {
      try {
        const reader = new FileReader(); reader.readAsDataURL(file);
        reader.onload = (ev) => {
           const img = new Image(); img.src = ev.target?.result as string;
           img.onload = () => {
             const canvas = document.createElement('canvas'); let w = img.width; let h = img.height;
             if(w > 800) { h = Math.round((h * 800) / w); w = 800; }
             canvas.width = w; canvas.height = h; canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
             const updated = ModelManager.updateModelCover(viewingModelId, canvas.toDataURL('image/jpeg', 0.6));
             setModels(updated); setIsEditingCover(false); showToast(i18n.language === 'zh' ? '✅ 封面修改成功！' : '✅ Cover updated!');
           };
        };
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
      try { StorageManager.setCustomAudios(newAudios); updateAudioSetting(type, 'custom'); showToast(i18n.language === 'zh' ? '✅ 音效上传成功！' : '✅ Audio uploaded!'); } 
      catch (err) { showToast(i18n.language === 'zh' ? '本地存储空间不足，音效保存失败。' : 'Not enough local storage.'); }
    };
    reader.readAsDataURL(file); e.target.value = '';
  };

  const buyTitle = (id: string) => { if (UserManager.buyTitle(id)) { AudioManager.playAchievement(); showToast(t('titleUnlocked')); refreshData(); } else { AudioManager.playClick(); showToast(t('notEnoughCoins')); } };
  const equipTitle = (id: string) => { AudioManager.playClick(); StorageManager.setEquippedTitle(id); setEquippedTitle(id); AudioManager.playStageDone(); };

  const handleOpenPiP = async () => {
    AudioManager.playClick();
    if (isWeChat) { showToast(i18n.language === 'zh' ? '微信内不支持画中画，请用浏览器打开' : 'PiP not supported in WeChat.'); return; }
    if (!('documentPictureInPicture' in window)) { showToast(i18n.language === 'zh' ? '您的浏览器不支持画中画，请使用 Chrome/Edge。' : 'Your browser does not support PiP.'); return; }
    try {
      const pipWin = await (window as any).documentPictureInPicture.requestWindow({ width: 320, height: 480 });
      [...document.styleSheets].forEach((styleSheet) => {
        try { const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join(''); const style = document.createElement('style'); style.textContent = cssRules; pipWin.document.head.appendChild(style); } 
        catch (e) { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = (styleSheet as any).href; pipWin.document.head.appendChild(link); }
      });
      pipWin.document.body.style.backgroundColor = '#1e1e1e'; pipWin.document.body.style.margin = '0'; pipWin.document.body.style.display = 'flex'; pipWin.document.body.style.justifyContent = 'center'; pipWin.document.body.style.alignItems = 'center'; pipWin.document.body.style.height = '100vh'; pipWin.document.body.style.overflow = 'hidden';
      setPipWindow(pipWin); pipWin.addEventListener('pagehide', () => setPipWindow(null));
    } catch (err) { console.error(err); showToast(i18n.language === 'zh' ? '画中画打开失败' : 'Failed to open PiP'); }
  };

  const exportData = () => { AudioManager.playClick(); const data = StorageManager.exportAll(); const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `modelvault_backup_${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url); };
  const importData = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const file = e.target.files?.[0]; if (!file) return; AudioManager.playClick();
    const reader = new FileReader(); 
    reader.onload = (event) => { 
      try { 
        const data = JSON.parse(event.target?.result as string); 
        if (StorageManager.importAll(data)) { showToast(t('importSuccess')); setTimeout(() => window.location.reload(), 1000); } 
        else showToast(t('importError')); 
      } catch (err) { showToast(t('importError')); } 
    }; 
    reader.readAsText(file); e.target.value = ''; 
  };
  const handleResetData = async () => { AudioManager.playClick(); setIsResetting(true); try { await StorageManager.resetAll(); } catch (e) { console.error(e); } window.location.href = window.location.origin + window.location.pathname; };

  const formatTime = (totalSec: number) => { const h = Math.floor(totalSec / 3600); const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0'); const s = (totalSec % 60).toString().padStart(2, '0'); if (h > 0) return `${h}:${m}:${s}`; return `${m}:${s}`; };
  const formatLogDate = (timestamp: number) => { const d = new Date(timestamp); return `${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`; };
  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { setTimeout(() => { e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 300); };

  // 🌟 补全战报生成逻辑
  const generateShareCard = async (model: Model, totalTime: number) => {
    AudioManager.playClick();
    const canvas = document.createElement('canvas');
    canvas.width = 800; canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#1e1e1e'; ctx.fillRect(0, 0, 800, 1000);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    for (let i = 0; i < 800; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1000); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(800, i); ctx.stroke(); }
    
    ctx.fillStyle = '#3b82f6'; ctx.font = 'bold 48px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('ModelVault', 400, 80);
    ctx.fillStyle = '#aaa'; ctx.font = '24px sans-serif'; ctx.fillText(i18n.language === 'zh' ? '我的拼装战报' : 'My Build Report', 400, 120);

    if (model.coverImage) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = model.coverImage;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        const imgRatio = img.width / img.height;
        const targetRatio = 600 / 400;
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        if (imgRatio > targetRatio) {
          sw = img.height * targetRatio;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / targetRatio;
          sy = (img.height - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, 100, 160, 600, 400);
        const gradient = ctx.createLinearGradient(0, 460, 0, 560);
        gradient.addColorStop(0, 'rgba(30, 30, 30, 0)');
        gradient.addColorStop(1, 'rgba(30, 30, 30, 1)');
        ctx.fillStyle = gradient;
        ctx.fillRect(100, 460, 600, 100);
      } catch (e) {
        ctx.fillStyle = '#333'; ctx.fillRect(100, 160, 600, 400);
        ctx.fillStyle = '#666'; ctx.font = '32px sans-serif'; ctx.fillText('No Image', 400, 360);
      }
    } else {
      ctx.fillStyle = '#333'; ctx.fillRect(100, 160, 600, 400);
      ctx.fillStyle = '#666'; ctx.font = '32px sans-serif'; ctx.fillText(i18n.language === 'zh' ? '暂无照片' : 'No Image', 400, 360);
    }

    ctx.fillStyle = '#fff'; ctx.font = 'bold 42px sans-serif'; ctx.fillText(i18n.language === 'zh' ? model.name.zh : model.name.en, 400, 560);
    ctx.fillStyle = '#3b82f6'; ctx.font = 'bold 28px sans-serif'; ctx.fillText(`${model.grade}  |  ${i18n.language === 'zh' ? model.series.zh : model.series.en}`, 400, 610);
    
    ctx.fillStyle = '#10b981'; ctx.font = 'bold 64px monospace'; ctx.fillText(formatTime(totalTime), 400, 700);
    ctx.fillStyle = '#aaa'; ctx.font = '24px sans-serif'; ctx.fillText(i18n.language === 'zh' ? '总专注时长' : 'Total Focus Time', 400, 745);
    ctx.fillStyle = '#555'; ctx.font = '20px sans-serif'; ctx.fillText(i18n.language === 'zh' ? '用热爱与耐心，铸造属于你的杰作。' : 'Built with love and patience.', 400, 850);

    const url = canvas.toDataURL('image/jpeg', 0.9);
    const a = document.createElement('a'); a.href = url; a.download = `ModelVault_${model.name.en.replace(/\s+/g, '_')}.jpg`; a.click();
    showToast(i18n.language === 'zh' ? '✅ 战报已保存到相册/下载' : '✅ Report saved!');
  };

  const getHistoryLogs = () => { 
    let sessions = SessionManager.getAllSessions(); 
    if (journalFilterMonth) {
      sessions = sessions.filter(s => {
        const d = new Date(s.startedAt); const year = d.getFullYear(); const month = (d.getMonth() + 1).toString().padStart(2, '0');
        return `${year}-${month}` === journalFilterMonth;
      });
    }
    return sessions.sort((a, b) => b.startedAt - a.startedAt).map(s => ({ ...s, details: ModelManager.getTaskDetails(s.taskId), stageNameKey: ModelManager.getStageNameKey(s.taskId, s.stageId) })); 
  };

  const currentModel = models.find(m => m.id === currentModelId);
  const currentTask = tasks.find(t => t.id === currentTaskId);
  const currentStage = currentTask?.stages.find(s => s.id === currentStageId);
  const viewingModel = models.find(m => m.id === viewingModelId);
  const viewingModelTotalSec = viewingModel ? SessionManager.getAllSessions().filter(s => viewingModel.tasks.some(t => t.id === s.taskId)).reduce((sum, s) => sum + s.activeSeconds, 0) : 0;

  const commonProps = {
    t, i18n, models, tasks, currentModelId, setCurrentModelId, currentTaskId, setCurrentTaskId, currentStageId, setCurrentStageId,
    timerState, activeSeconds, lastSession, timeboxTarget, timeboxElapsed, handleStart, handlePause, handleResume, handleComplete,
    handleConfirmStageDone, handleCancelDone, handleFinishPart, isFinishingPart, setIsFinishingPart, finishPartPhoto, setFinishPartPhoto, handleConfirmFinishPart,
    currentModel, currentTask, currentStage, getModelName, getModelSeries, formatTime, formatLogDate, handleFocus, showToast, handleSetTimeboxTarget,
    isAddingModel, setIsAddingModel, newModelNameInput, setNewModelNameInput, selectedGunpla, setSelectedGunpla, searchResults, setSearchResults,
    newModelGrade, setNewModelGrade, newModelSeriesInput, setNewModelSeriesInput, useDefaultTasks, setUseDefaultTasks, handleAddModel,
    isAddingTask, setIsAddingTask, newTaskName, setNewTaskName, handleAddTask,
    bgMain, bgPip, bgSize, bgPosition, reminderInterval, setReminderInterval, audioSettings, setAudioSettings,
    username, handleUsernameChange, modelStats: ModelManager.getModelStats(), timeStats: ModelManager.getTimeStats(),
    showModelDetails, setShowModelDetails, showTimeDetails, setShowTimeDetails, titles: UserManager.getTitleLibrary(),
    earnedTitles, coinsBalance, buyTitle, equipTitle, equippedTitle, earnedAchievements: AchievementManager.getEarnedList(),
    storageUsage: StorageManager.getStorageUsage(), exportData, importData, showResetConfirm, setShowResetConfirm, handleResetData, isResetting,
    showLegacyForm, setShowLegacyForm, legacyInput, setLegacyInput, legacyResults, setLegacyResults, addToLegacyList, legacyList, setLegacyList, removeLegacyItem, handleLegacyCoverUpload, handleLegacyImport,
    handleBgFileUpload, openPreview, updateAudioSetting, customAudios, handleAudioUpload, getHistoryLogs, journalFilterMonth, setJournalFilterMonth,
    setBgMain, setBgPip, StorageManager
  };

  return (
    <div className="app-wrapper">
      {bgMain && <img src={bgMain} alt="background" className="app-bg-img" style={{ objectFit: bgSize as any, objectPosition: bgPosition }} />}
      {toastMsg && <div className="toast">{toastMsg}</div>}

      <div className="mini-window">
        {viewingModel ? (
          <div className="profile-topbar">
            <button className="back-btn" onClick={() => { AudioManager.playClick(); setViewingModelId(null); setIsEditingCover(false); setIsEditingImportedStatus(false); setShowRebuildConfirm(false); }}>← {t('backToHangar')}</button>
            <div className="top-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {confirmDeleteId === viewingModel.id ? (
                <>
                  <button className="mini-btn" style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }} onClick={() => { handleDeleteModel(viewingModel.id); setConfirmDeleteId(null); }}>{i18n.language === 'zh' ? '确认删除' : 'Confirm'}</button>
                  <button className="mini-btn" style={{ background: 'transparent', color: '#ccc', border: '1px solid #555', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }} onClick={() => { AudioManager.playClick(); setConfirmDeleteId(null); }}>{t('cancel')}</button>
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
              <div className="top-right" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.9 }} title="本地时间">🕒 {localTime}</span>
                <span style={{ color: '#10b981' }} title="今日拼装时长">⏳ {t('today')}: {formatTime(todayTotal)}</span>
                <button className="icon-btn" onClick={handleOpenPiP}>📺</button>
                <button className="lang-btn" onClick={toggleLanguage}>{i18n.language === 'zh' ? 'EN' : '中'}</button>
              </div>
            </div>
          </>
        )}

        {viewingModel ? (
          <ModelDetail 
            viewingModel={viewingModel} 
            viewingModelTotalSec={viewingModelTotalSec}
            expandedTaskId={expandedTaskId}
            setExpandedTaskId={setExpandedTaskId}
            isEditingCover={isEditingCover}
            setIsEditingCover={setIsEditingCover}
            isEditingImportedStatus={isEditingImportedStatus}
            setIsEditingImportedStatus={setIsEditingImportedStatus}
            importedStages={importedStages}
            setImportedStages={setImportedStages}
            showRebuildConfirm={showRebuildConfirm}
            setShowRebuildConfirm={setShowRebuildConfirm}
            handleConfirmRebuild={handleConfirmRebuild}
            handleDoRebuild={handleDoRebuild}
            handleStartRebuild={handleStartRebuild}
            handleJumpToFocus={handleJumpToFocus}
            handleCoverUpload={handleCoverUpload}
            handleSaveImportedStages={handleSaveImportedStages}
            generateShareCard={generateShareCard}
            {...commonProps}
          />
        ) : (
          <>
            {activeTab === 'focus' && <FocusView {...commonProps} />}
            {activeTab === 'journal' && <JournalView {...commonProps} />}
            {activeTab === 'hangar' && <HangarView {...commonProps} completedModels={ModelManager.getCompletedModels()} setViewingModelId={setViewingModelId} setExpandedTaskId={setExpandedTaskId} />}
            {activeTab === 'profile' && <ProfileView {...commonProps} />}
          </>
        )}
      </div>

      <Modals 
        showCompleteModelConfirm={showCompleteModelConfirm}
        setShowCompleteModelConfirm={setShowCompleteModelConfirm}
        handleConfirmCompleteModel={handleConfirmCompleteModel}
        isPreviewOpen={isPreviewOpen}
        setIsPreviewOpen={setIsPreviewOpen}
        bgMain={bgMain}
        bgSize={bgSize}
        bgPosition={bgPosition}
        setBgSize={setBgSize}
        setBgPosition={setBgPosition}
        applyBackground={applyBackground}
      />

      {pipWindow && createPortal(<FocusPanel {...commonProps} isPip={true} bgImage={bgPip} />, pipWindow.document.body)}
    </div>
  );
}

export default App;