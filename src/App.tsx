import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { TimerEngine } from './core/TimerEngine';
import { SessionManager } from './core/SessionManager';
import { ModelManager } from './core/ModelManager';
import { AchievementManager } from './core/AchievementManager';
import { AudioManager, type AmbientType } from './core/AudioManager';
import { StorageManager } from './core/StorageManager';
import { UserManager } from './core/UserManager';
import { CheckinManager } from './core/CheckinManager';
import { GunplaSearch } from './core/GunplaDB';
import { DailyQuestManager } from './core/DailyQuestManager';
import { useAppStore } from './store/useAppStore';
import type { GunplaItem } from './core/GunplaDB';
import './App.css';

import { FocusView } from './views/FocusView';
import { JournalView } from './views/JournalView';
import { HangarView } from './views/HangarView';
import { ProfileView } from './views/ProfileView';
import { BotGalleryView } from './views/BotGalleryView';
import { GundamGalleryView } from './views/GundamGalleryView';
import { ModelDetail } from './components/ModelDetail';
import { FocusPanel } from './components/FocusPanel';
import { Modals } from './components/Modals';
import { SplashScreen } from './components/SplashScreen';
import { TutorialTour, type TourStep } from './components/TutorialTour';
import { AchievementOverlay, type AchievementData } from './components/AchievementOverlay';

import { BOTS, type BotType, QuoteEngine } from './core/QuoteEngine';
import { generateShareCard } from './utils/shareCard';
import type { ShareCardTemplate } from './utils/shareCard';

const isWeChat = /MicroMessenger/i.test(navigator.userAgent);

interface ChatMessage {
  id: string;
  botId: BotType;
  text: string;
  timestamp: number;
}

const LocalImage = ({ src, ...props }: any) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let objectUrl: string | null = null;
    StorageManager.loadLocalFileUrl(src).then((res) => {
      if (res) { objectUrl = res; setUrl(res); }
    });
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [src]);

  if (!url) return <div {...props} style={{ ...props.style, background: '#333' }} />;
  return <img src={url} {...props} />;
};

const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    await Notification.requestPermission();
  }
};

function App() {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';

  // 🌟 从 Zustand 获取全局状态
  const {
    models, setModels, currentModelId, setCurrentModelId,
    tasks, currentTaskId, setCurrentTaskId, currentStageId, setCurrentStageId,
    username, setUsername, coinsBalance, setCoinsBalance,
    earnedTitles, setEarnedTitles, equippedTitle, setEquippedTitle,
    bgMain, setBgMain, bgPip, setBgPip, bgSize, setBgSize, bgPosition, setBgPosition,
    audioSettings, setAudioSettings, customAudios, setCustomAudios,
    unlockedBots, setUnlockedBots, currentBot, setCurrentBot,
    checkinStreak, level, levelProgress, refreshData, storageEstimate,
    timerState, activeSeconds, setTimerState, setActiveSeconds
  } = useAppStore();

  const [showSplash, setShowSplash] = useState(true);
  const [showTutorial, setShowTutorial] = useState(() => {
    return localStorage.getItem('hasSeenTutorial') === null;
  });

  const [activeTab, setActiveTab] = useState<'focus' | 'journal' | 'hangar' | 'gallery' | 'gundam' | 'profile'>('focus');
  const [pendingTabChange, setPendingTabChange] = useState<any>(null);

  const [viewingModelId, setViewingModelId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

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
  const timeboxElapsed = timeboxTarget > 0 ? activeSeconds : 0;
  const [hasPlayedTimeboxSound, setHasPlayedTimeboxSound] = useState(false);
  const [reminderInterval, setReminderInterval] = useState(() => StorageManager.getReminderInterval());
  const [lastRemindedAt, setLastRemindedAt] = useState(0);
  
  const [isEditingImportedStatus, setIsEditingImportedStatus] = useState(false);
  const [importedStages, setImportedStages] = useState<string[]>([]);
  const [isEditingCover, setIsEditingCover] = useState(false);
  const [showRebuildConfirm, setShowRebuildConfirm] = useState(false);
  const [pendingRebuildTask, setPendingRebuildTask] = useState<string | null>(null);
  const [showCompleteModelConfirm, setShowCompleteModelConfirm] = useState(false);
  const [completeModelId, setCompleteModelId] = useState<string | null>(null);
  const [activeAchievement, setActiveAchievement] = useState<AchievementData | null>(null);
  const [achievementQueue, setAchievementQueue] = useState<AchievementData[]>([]);
  const [isWholeBuild, setIsWholeBuild] = useState(false); 
  const [rebuildMode, setRebuildMode] = useState<'part' | 'whole'>('part'); 

  const [journalFilterMonth, setJournalFilterMonth] = useState('');
  const [showModelDetails, setShowModelDetails] = useState(false);
  const [showTimeDetails, setShowTimeDetails] = useState(false);
  
  const engineRef = useRef(new TimerEngine());
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(() => CheckinManager.isCheckedInToday());

  const [webChatInterval, setWebChatInterval] = useState(() => StorageManager.getWebChatInterval());
  const [pipChatInterval, setPipChatInterval] = useState(() => StorageManager.getPipChatInterval());

  const [isAutoBackupEnabled, setIsAutoBackupEnabled] = useState(false);
  const [isAssetsMounted, setIsAssetsMounted] = useState(false);
  const [ambientType, setAmbientType] = useState<AmbientType>('none');

  const toastTimerRef = useRef<any>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem('mv_chat_messages');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return []; 
  });

  const sendNativeNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/bots/tia_avatar.png' });
    }
  };

  useEffect(() => {
    requestNotificationPermission();
    const preventDefault = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    window.addEventListener('dragover', preventDefault);
    window.addEventListener('drop', (e) => {
      preventDefault(e);
      if (e.dataTransfer?.files.length) showToast(t('toast_no_drag'));
    });
    return () => {
      window.removeEventListener('dragover', preventDefault);
      window.removeEventListener('drop', preventDefault);
    };
  }, []);

  useEffect(() => {
    if (timerState === 'Running') AudioManager.playAmbient(ambientType);
    else AudioManager.stopAmbient();
    return () => AudioManager.stopAmbient();
  }, [timerState, ambientType]);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg(msg);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 3000);
  };

  const tutorialSteps: TourStep[] = [ /* 保持不变，此处省略以节省空间，按需保留 */ ];

  useEffect(() => {
    if (chatMessages.length > 0) sessionStorage.setItem('mv_chat_messages', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    QuoteEngine.setBot(currentBot);
    if (chatMessages.length === 0) {
      const initText = QuoteEngine.getStartQuote(i18n.language);
      setChatMessages([{ id: crypto.randomUUID(), botId: currentBot, text: initText, timestamp: Date.now() }]);
    }
  }, [currentBot, i18n.language, chatMessages.length]);

  useEffect(() => {
    const initStorage = async () => {
      await StorageManager.requestPersistentStorage();
      await refreshData();
    };
    initStorage();
    GunplaSearch.init();
  }, []);

  useEffect(() => {
    let chatTimer: any;
    const tick = () => {
      const newText = QuoteEngine.getRandom(i18n.language, currentStageId);
      setChatMessages(prev => [...prev, { id: crypto.randomUUID(), botId: currentBot, text: newText, timestamp: Date.now() }].slice(-5));
    };
    const updateTimer = () => {
      if (chatTimer) clearInterval(chatTimer);
      let interval = 0;
      if (pipWindow) interval = pipChatInterval;
      else if (document.visibilityState === 'visible') interval = webChatInterval;
      if (interval > 0) chatTimer = setInterval(tick, interval);
    };
    updateTimer();
    document.addEventListener('visibilitychange', updateTimer);
    return () => {
      if (chatTimer) clearInterval(chatTimer);
      document.removeEventListener('visibilitychange', updateTimer);
    };
  }, [currentBot, i18n.language, webChatInterval, pipChatInterval, pipWindow, currentStageId]);

  const triggerAutoBackup = async () => {
    if (!isAutoBackupEnabled) return;
    const data = StorageManager.exportAll();
    await StorageManager.autoBackupData(data);
  };

  const pushChatMessage = (type: 'start' | 'pause' | 'complete') => {
    const text = type === 'start' ? QuoteEngine.getStartQuote(i18n.language)
               : type === 'pause' ? QuoteEngine.getPauseQuote(i18n.language)
               : QuoteEngine.getCompleteQuote(i18n.language);
    setChatMessages(prev => [...prev, { id: crypto.randomUUID(), botId: currentBot, text, timestamp: Date.now() }].slice(-5));
  };

  const getModelName = (m: any) => isZh ? m.name.zh : m.name.en;
  
  useEffect(() => {
    const interval = setInterval(() => {
      const secs = engineRef.current.getActiveSeconds();
      const state = engineRef.current.getState();
      setActiveSeconds(secs); setTimerState(state);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timerState === 'Running' && timeboxTarget > 0 && timeboxElapsed >= timeboxTarget && !hasPlayedTimeboxSound) {
      AudioManager.playTimeboxEnd(); 
      setHasPlayedTimeboxSound(true);
      sendNativeNotification(t('notify_timebox_end_title'), t('notify_timebox_end_body'));
    }
  }, [timeboxElapsed, timeboxTarget, hasPlayedTimeboxSound, timerState, isZh]);

  const handleStart = () => { 
    if (!currentTaskId) { showToast(t('toast_select_part')); return; }
    AudioManager.playStart(); engineRef.current.start(); 
    setModels(ModelManager.startStage(currentTaskId, currentStageId)); 
    setHasPlayedTimeboxSound(false); refreshData(); pushChatMessage('start');
  };
  const handlePause = () => { AudioManager.playPause(); engineRef.current.pause(); pushChatMessage('pause'); };
  const handleResume = () => { AudioManager.playStart(); engineRef.current.resume(); pushChatMessage('start'); };
  
  const handleComplete = () => {
    const result = engineRef.current.complete();
    if (result) {
      if (result.activeSeconds < 10) { showToast(t('toast_time_short')); return; }
      AudioManager.playWakeup(); 
      SessionManager.saveSession({ id: crypto.randomUUID(), taskId: currentTaskId, stageId: currentStageId, ...result });
      DailyQuestManager.updateProgress('focus_time', result.activeSeconds);
      sendNativeNotification(t('notify_focus_end_title'), t('notify_focus_end_body', { min: Math.floor(result.activeSeconds / 60) }));
      refreshData(); setLastSession({ duration: result.activeSeconds, stageId: currentStageId }); pushChatMessage('complete');
      triggerAutoBackup();
    }
  };

  const handleTabChange = (newTab: typeof activeTab) => {
    if (activeTab === 'focus' && timerState === 'Running') setPendingTabChange(newTab);
    else { AudioManager.playClick(); setActiveTab(newTab); }
  };

  const processAchievements = () => {
    const newlyEarned = AchievementManager.checkAll();
    if (newlyEarned.length > 0) setAchievementQueue(prev => [...prev, ...newlyEarned as AchievementData[]]);
  };

  useEffect(() => {
    if (!activeAchievement && achievementQueue.length > 0) {
      const next = achievementQueue[0];
      setAchievementQueue(prev => prev.slice(1));
      setActiveAchievement(next);
    }
  }, [achievementQueue, activeAchievement]);

  const handleCheckin = () => {
    const result = CheckinManager.checkin();
    if (result.success) {
      AudioManager.playAchievement();
      showToast(t('toast_checkin_success', { streak: result.streak, xp: result.rewardXp, coins: result.rewardCoins }));
      refreshData(); processAchievements();
    } else showToast(t('alreadyCheckedIn'));
  };

  const checkAndPromptCompleteModel = (updatedModels: any[], modelId?: string) => {
    let targetId = modelId;
    if (!targetId) { const m = updatedModels.find(m => m.tasks.some(t => t.id === currentTaskId)); targetId = m?.id; }
    if (!targetId) return;
    const targetModel = updatedModels.find(m => m.id === targetId);
    if (targetModel && targetModel.tasks.length > 0 && targetModel.tasks.every(t => t.status === 'Completed') && targetModel.status !== 'Completed') {
      setShowCompleteModelConfirm(true); setCompleteModelId(targetId);
    }
  };

  const handleConfirmStageDone = () => {
    AudioManager.playStageDone(); const updated = ModelManager.completeStage(currentTaskId, lastSession?.stageId || null);
    setModels(updated); refreshData(); setLastSession(null); processAchievements(); checkAndPromptCompleteModel(updated);
    triggerAutoBackup();
  };

  const handleFinishPart = () => {
    AudioManager.playClick();
    const assembly = tasks.find(t => t.id === currentTaskId)?.stages.find(s => s.nameKey === 'stage_assembly');
    if (assembly && assembly.status !== 'Completed') { showToast(t('errorAssemblyRequired')); return; }
    setFinishPartPhoto(''); setIsFinishingPart(true);
  };

  const handleConfirmFinishPart = () => {
    AudioManager.playFinishPart(); const result = ModelManager.finishTask(currentTaskId, finishPartPhoto);
    if (result.error) { showToast(t(result.error)); return; }
    DailyQuestManager.updateProgress('complete_part', 1);
    setModels(result.models); refreshData(); processAchievements(); setTimeboxTarget(0); setHasPlayedTimeboxSound(false); setIsFinishingPart(false); checkAndPromptCompleteModel(result.models);
    triggerAutoBackup();
  };

  const handleConfirmCompleteModel = () => {
    if (!completeModelId) return;
    AudioManager.playFinishPart(); const updated = ModelManager.finishModel(completeModelId);
    setModels(updated); refreshData(); setShowCompleteModelConfirm(false); setCompleteModelId(null);
    showToast(t('toast_model_finished'));
    triggerAutoBackup();
  };

  const handleAddModel = () => {
    if (!newModelNameInput.trim() && !selectedGunpla) return;
    AudioManager.playClick();
    const nameObj = selectedGunpla ? selectedGunpla.name : { en: newModelNameInput.trim(), zh: newModelNameInput.trim() };
    const seriesObj = selectedGunpla ? selectedGunpla.series : { en: newModelSeriesInput.trim() || 'Unknown', zh: newModelSeriesInput.trim() || '未知' };

    const duplicate = models.find(m => (m.name.en === nameObj.en || m.name.zh === nameObj.zh) && m.grade.toUpperCase() === newModelGrade.toUpperCase());
    if (duplicate) { showToast(t('toast_duplicate_model')); return; }

    const updated = ModelManager.addModel(nameObj, newModelGrade, seriesObj, useDefaultTasks, isWholeBuild);
    DailyQuestManager.updateProgress('add_model', 1);
    setModels(updated); setCurrentModelId(updated[updated.length - 1].id);
    setNewModelNameInput(''); setNewModelSeriesInput(''); setSelectedGunpla(null); setIsAddingModel(false); setUseDefaultTasks(true); setIsWholeBuild(false); setSearchResults([]); processAchievements();
    triggerAutoBackup();
  };

  const handleAddTask = (name: string) => {
    const updated = ModelManager.addTask(currentModelId, name);
    setModels(updated); triggerAutoBackup();
  };

  const handleJumpToFocus = (taskId: string, stageId: string | null = null) => {
    AudioManager.playClick();
    if (viewingModel?.status === 'Completed' || viewingModel?.isRebuilding) {
      const updated = ModelManager.reopenModel(viewingModel.id); setModels(updated);
    }
    setCurrentModelId(viewingModelId!); setCurrentTaskId(taskId); if (stageId) setCurrentStageId(stageId);
    setActiveTab('focus'); setViewingModelId(null);
  };

  // 🌟 辅助数据计算
  const currentModel = models.find(m => m.id === currentModelId);
  const currentTask = tasks.find(t => t.id === currentTaskId);
  const currentStage = currentTask?.stages.find(s => s.id === currentStageId);
  const viewingModel = models.find(m => m.id === viewingModelId);
  const viewingModelTotalSec = viewingModel ? SessionManager.getAllSessions().filter(s => viewingModel.tasks.some(t => t.id === s.taskId)).reduce((sum, s) => sum + s.activeSeconds, 0) : 0;
  const equippedTitleDef = UserManager.getTitleLibrary().find(t => t.id === equippedTitle);

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      {showTutorial && !showSplash && (
        <TutorialTour 
          steps={tutorialSteps} 
          onClose={() => { setShowTutorial(false); localStorage.setItem('hasSeenTutorial', 'true'); }} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />
      )}

      <div className="app-wrapper" style={{ opacity: showSplash ? 0 : 1, transition: 'opacity 0.5s' }}>
        {bgMain && (
          bgMain.startsWith('local://') ? (
            <LocalImage src={bgMain} className="app-bg-img" style={{ objectFit: bgSize as any, objectPosition: bgPosition }} />
          ) : (
            <img src={bgMain} alt="background" className="app-bg-img" style={{ objectFit: bgSize as any, objectPosition: bgPosition }} />
          )
        )}
        {toastMsg && <div className="toast">{toastMsg}</div>}

        <div className="mini-window">
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '8px', flexShrink: 0 }}>
            <button onClick={() => { AudioManager.playClick(); setShowTutorial(true); }} style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#3b82f6', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="新手教程">?</button>
            <button className="lang-btn" onClick={() => { AudioManager.playClick(); const next = isZh ? 'en' : 'zh'; i18n.changeLanguage(next); localStorage.setItem('lang', next); }}>{isZh ? 'EN' : '中'}</button>
          </div>

          {!viewingModel && (
            <div className="tabs">
              <button id="tab-focus" className={`tab ${activeTab === 'focus' ? 'active' : ''}`} onClick={() => handleTabChange('focus')}>⏱ {t('focus')}</button>
              <button id="tab-journal" className={`tab ${activeTab === 'journal' ? 'active' : ''}`} onClick={() => handleTabChange('journal')}>📖 {t('journal')}</button>
              <button id="tab-hangar" className={`tab ${activeTab === 'hangar' ? 'active' : ''}`} onClick={() => handleTabChange('hangar')}>📦 {t('hangar')}</button>
              <button id="tab-gundam" className={`tab ${activeTab === 'gundam' ? 'active' : ''}`} onClick={() => handleTabChange('gundam')}>🤖 {t('mecha')}</button>
              <button id="tab-gallery" className={`tab ${activeTab === 'gallery' ? 'active' : ''}`} onClick={() => handleTabChange('gallery')}>👥 {t('animold')}</button>
              <button id="tab-profile" className={`tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => handleTabChange('profile')}>👤 {t('profile')}</button>
            </div>
          )}

          {timerState !== 'Idle' && activeTab !== 'focus' && !viewingModel && (
            <div className="mini-timer-bar" onClick={() => { AudioManager.playClick(); setActiveTab('focus'); }}>
              <span className={`mini-timer-dot ${timerState.toLowerCase()}`}>⏱</span>
              <span className="mini-timer-text">{SessionManager.getTodayTotalSeconds() > 0 ? activeSeconds : '--'}</span>
              <span className="mini-timer-state">{timerState === 'Running' ? t('status_running') : t('status_paused')}</span>
              <span className="mini-timer-arrow">→</span>
            </div>
          )}

          {viewingModel && (
            <div className="profile-topbar">
              <button className="back-btn" onClick={() => { AudioManager.playClick(); setViewingModelId(null); setIsEditingCover(false); setIsEditingImportedStatus(false); setShowRebuildConfirm(false); }}>← {t('backToHangar')}</button>
              <div className="top-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {confirmDeleteId === viewingModel.id ? (
                  <>
                    <button className="mini-btn" style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }} onClick={() => { handleDeleteModel(viewingModel.id); setConfirmDeleteId(null); }}>{t('confirm')}</button>
                    <button className="mini-btn" style={{ background: 'transparent', color: '#ccc', border: '1px solid #555', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }} onClick={() => { AudioManager.playClick(); setConfirmDeleteId(null); }}>{t('cancel')}</button>
                  </>
                ) : (
                  <button className="icon-btn" style={{ color: '#ef4444', padding: '4px' }} onClick={() => { AudioManager.playClick(); setConfirmDeleteId(viewingModel.id); }}>🗑️</button>
                )}
              </div>
            </div>
          )}

          <div className="scroll-content">
            {viewingModel ? (
              <ModelDetail {...({ viewingModel, viewingModelTotalSec, expandedTaskId, setExpandedTaskId, isEditingCover, setIsEditingCover, isEditingImportedStatus, setIsEditingImportedStatus, importedStages, setImportedStages, showRebuildConfirm, setShowRebuildConfirm } as any)} />
            ) : (
              <>
                {activeTab === 'focus' && <FocusView {...({ handleStart, handlePause, handleResume, handleComplete, handleConfirmStageDone, handleCancelDone, handleFinishPart, isFinishingPart, setIsFinishingPart, finishPartPhoto, setFinishPartPhoto, handleConfirmFinishPart, lastSession, timeboxTarget, timeboxElapsed, bgImage: bgPip, showToast, handleSetTimeboxTarget, handleCheckin, handleFocus, chatMessages, setChatMessages, ambientType, setAmbientType, handleOpenPiP, isAddingModel, setIsAddingModel, isAddingTask, setIsAddingTask, newModelNameInput, setNewModelNameInput, selectedGunpla, setSelectedGunpla, searchResults, setSearchResults, newModelGrade, setNewModelGrade, newModelSeriesInput, setNewModelSeriesInput, useDefaultTasks, setUseDefaultTasks, newTaskName, setNewTaskName, handleAddModel, handleAddTask, isWholeBuild, setIsWholeBuild, bgSize, bgPosition, reminderInterval, currentModel, currentTask, currentStage, getModelName, equippedTitleDef } as any)} />}
                {activeTab === 'journal' && <JournalView {...({ t, i18n, getHistoryLogs: () => SessionManager.getAllSessions().sort((a,b) => b.startedAt - a.startedAt).map(s => ({...s, details: ModelManager.getTaskDetails(s.taskId)})), journalFilterMonth, setJournalFilterMonth, formatTime: (sec: number) => { const m = Math.floor(sec / 60).toString().padStart(2, '0'); const s = (sec % 60).toString().padStart(2, '0'); return `${m}:${s}`; }, formatLogDate: (timestamp: number) => { const d = new Date(timestamp); return `${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`; }, handleFocus } as any)} />}
                {activeTab === 'hangar' && <HangarView {...({ t, i18n, models, getModelName, getModelSeries: (m: any) => isZh ? m.series.zh : m.series.en, setViewingModelId, setExpandedTaskId, setActiveTab, setCurrentModelId } as any)} />}
                {activeTab === 'gundam' && <GundamGalleryView {...({ i18n, models } as any)} />} 
                {activeTab === 'gallery' && <BotGalleryView unlockedBots={unlockedBots} currentBot={currentBot} level={level} coins={coinsBalance} checkinStreak={checkinStreak} onUnlock={(botId, cost) => { setCoinsBalance(coinsBalance - cost); setUnlockedBots([...unlockedBots, botId]); AudioManager.playAchievement(); refreshData(); showToast(t('toast_unlock_bot', { name: isZh ? BOTS[botId].name : BOTS[botId].enName })); }} onEquip={(botId) => { setCurrentBot(botId); AudioManager.playStageDone(); showToast(t('toast_switch_bot', { name: isZh ? BOTS[botId].name : BOTS[botId].enName })); }} i18n={i18n} />}
                {activeTab === 'profile' && <ProfileView {...({ t, i18n, username, handleUsernameChange: (e: any) => setUsername(e.target.value), equippedTitleDef, modelStats: ModelManager.getModelStats(), timeStats: ModelManager.getTimeStats(), showModelDetails, setShowModelDetails, showTimeDetails, setShowTimeDetails, formatTime: (sec: number) => { const h = Math.floor(sec / 3600); const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0'); return h > 0 ? `${h}:${m}` : `${m}m`; }, showLegacyForm, setShowLegacyForm, legacyInput, setLegacyInput, legacyResults, addToLegacyList: (item: any) => { if (!legacyList.some(i => i.name.en === item.name.en)) setLegacyList([...legacyList, item]); else showToast(t('toast_legacy_added')); }, legacyList, removeLegacyItem: (id: string) => setLegacyList(legacyList.filter(i => i.id !== id)), handleLegacyCoverUpload: () => {}, handleLegacyImport: () => {}, bgMain, bgPip, handleBgFileUpload: () => {}, reminderInterval, setReminderInterval, openPreview: () => {}, audioSettings, updateAudioSetting: () => {}, customAudios, handleAudioUpload: () => {}, titles: UserManager.getTitleLibrary(), earnedTitles, coinsBalance, buyTitle: () => {}, equipTitle: () => {}, equippedTitle, earnedAchievements: AchievementManager.getEarnedList(), exportData: () => {}, importData: () => {}, showResetConfirm, setShowResetConfirm, handleResetData: () => {}, isResetting, storageUsage: StorageManager.getStorageUsage(), handleFocus, setLegacyResults, setBgMain, setBgPip, StorageManager, webChatInterval, setWebChatInterval, pipChatInterval, setPipChatInterval, storageEstimate, isAssetsMounted, setIsAssetsMounted, level, levelProgress, showToast, refreshData, setLegacyList } as any)} />}
              </>
            )}
          </div>
        </div>

        <Modals showCompleteModelConfirm={showCompleteModelConfirm} setShowCompleteModelConfirm={setShowCompleteModelConfirm} handleConfirmCompleteModel={handleConfirmCompleteModel} isPreviewOpen={false} setIsPreviewOpen={() => {}} bgMain={bgMain} bgSize={bgSize} bgPosition={bgPosition} setBgSize={setBgSize} setBgPosition={setBgPosition} applyBackground={() => {}} deferredPrompt={null} setDeferredPrompt={() => {}} i18n={i18n} />
        <AchievementOverlay achievement={activeAchievement} onClose={() => setActiveAchievement(null)} t={t} i18n={i18n} />

        {pendingTabChange && (
          <div className="modal-overlay" style={{ zIndex: 9999 }}>
            <div className="modal-content" style={{ width: '280px', textAlign: 'center' }}>
              <h3 style={{ color: '#f59e0b', fontSize: '18px', marginBottom: '12px' }}>⏱️ {t('status_running')}</h3>
              <p style={{ fontSize: '13px', color: '#ccc', lineHeight: '1.5', marginBottom: '16px' }}>{t('confirmLeaveFocus')}</p>
              <div className="modal-actions" style={{ justifyContent: 'center' }}>
                <button className="btn yes" style={{ flex: 1 }} onClick={() => { setPendingTabChange(null); setActiveTab(pendingTabChange); }}>{t('confirm')}</button>
                <button className="btn no" style={{ flex: 1 }} onClick={() => { setPendingTabChange(null); }}>{t('cancel')}</button>
              </div>
            </div>
          </div>
        )}

        {pipWindow && createPortal(<FocusPanel isPip={true} {...({ handleStart, handlePause, handleResume, handleComplete, handleConfirmStageDone, handleCancelDone, handleFinishPart, isFinishingPart, setIsFinishingPart, finishPartPhoto, setFinishPartPhoto, handleConfirmFinishPart, lastSession, timeboxTarget, timeboxElapsed, bgImage: bgPip, showToast, handleSetTimeboxTarget, handleCheckin, handleFocus, chatMessages, setChatMessages, ambientType, setAmbientType, handleOpenPiP, currentModel, currentTask, currentStage, getModelName, equippedTitleDef } as any)} />, pipWindow.document.body)}
      </div>
    </>
  );
}

export default App;