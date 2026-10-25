import { useState, useEffect, useRef, useCallback } from 'react';
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
import { useAppStore, type MainTab } from './store/useAppStore';
import type { GunplaItem } from './core/GunplaDB';
import { formatTime, formatLogDate, handleFocusScroll } from './utils/format';
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

const isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__;
const isPipMode = new URLSearchParams(window.location.search).get('pip') === 'true';

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

  const {
    models, setModels, currentModelId, setCurrentModelId,
    tasks, currentTaskId, setCurrentTaskId, currentStageId, setCurrentStageId,
    viewingModelId, setViewingModelId,
    expandedTaskId, setExpandedTaskId,
    // 🌟 批次 10D：Toast 从 store 拿
    toastMsg, showToast,
    username, setUsername, coinsBalance, setCoinsBalance,
    earnedTitles, equippedTitle, setEquippedTitle,
    bgMain, bgPip, bgSize, bgPosition, setBgMain, setBgPip, setBgSize, setBgPosition,
    audioSettings, setAudioSettings, customAudios, setCustomAudios,
    unlockedBots, setUnlockedBots, currentBot, setCurrentBot,
    checkinStreak, level, levelProgress, refreshData, storageEstimate, isCheckedIn,
    timerState, activeSeconds, setTimerState, setActiveSeconds,
    activeTab, setActiveTab,
    webChatInterval, setWebChatInterval, pipChatInterval, setPipChatInterval,
    isAssetsMounted, setIsAssetsMounted
  } = useAppStore();

  const [showSplash, setShowSplash] = useState(true);
  const [showTutorial, setShowTutorial] = useState(() => localStorage.getItem('hasSeenTutorial') === null);
  
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [isMiniMode, setIsMiniMode] = useState(false);
  const [isWindowActive, setIsWindowActive] = useState(true);

  const [pendingTabChange, setPendingTabChange] = useState<MainTab | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [lastSession, setLastSession] = useState<{ duration: number; stageId: string | null } | null>(null);
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

  // 模型搜索状态（FocusPanel 用）
  const [isSearching, setIsSearching] = useState(false);
  const [searchTrigger, setSearchTrigger] = useState(0);
  
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

  const engineRef = useRef(new TimerEngine());

  const [isAutoBackupEnabled, setIsAutoBackupEnabled] = useState(false);
  const [ambientType, setAmbientType] = useState<AmbientType>('none');

  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [updateProgress, setUpdateProgress] = useState<number | null>(null);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);

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

  const handleFinishSplash = useCallback(() => {
    setShowSplash(false);
  }, []);

  useEffect(() => {
    const handleUpdate = (e: any) => setUpdateInfo(e.detail);
    window.addEventListener('tauri-update-available', handleUpdate);
    return () => window.removeEventListener('tauri-update-available', handleUpdate);
  }, []);

  // 监听 Tauri 窗口焦点，最小化时停止聊天
  useEffect(() => {
    if (!isTauri) return;
    let unlisten: any = null;
    import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
      const win = getCurrentWindow();
      win.onFocusChanged(({ payload: focused }) => {
        setIsWindowActive(focused);
      }).then(u => { unlisten = u; });
    });
    return () => { if (unlisten) unlisten(); };
  }, []);

  const toggleAlwaysOnTop = async () => {
    if (!isTauri) { showToast(t('toast_pin_desktop_only')); return; }
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const win = getCurrentWindow();
      const nextState = !isAlwaysOnTop;
      await win.setAlwaysOnTop(nextState);
      setIsAlwaysOnTop(nextState);
      AudioManager.playClick();
      showToast(nextState ? t('toast_pinned') : t('toast_unpinned'));
    } catch (e) { console.error(e); }
  };

  const handleDownloadUpdate = async () => {
    if (!updateInfo) return;
    setUpdateProgress(0);
    try {
      let downloaded = 0;
      let contentLength = 0;
      await updateInfo.downloadAndInstall((event: any) => {
        if (event.event === 'Started') {
          contentLength = event.data.contentLength || 0;
        } else if (event.event === 'Progress') {
          downloaded += event.data.chunkLength;
          setUpdateProgress(Math.floor((downloaded / contentLength) * 100));
        } else if (event.event === 'Finished') {
          setUpdateProgress(100);
        }
      });
      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    } catch (err) {
      showToast(t('toast_update_failed'));
      setUpdateProgress(null);
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

  // 模型名称搜索防抖（FocusPanel 用）
  useEffect(() => {
    const query = newModelNameInput.trim();
    if (query.length < 1 || selectedGunpla) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    let cancelled = false;
    setIsSearching(true);
    const timer = setTimeout(() => {
      GunplaSearch.search(query)
        .then((results) => {
          if (!cancelled) {
            setSearchResults(results.slice(0, 15));
            setIsSearching(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setSearchResults([]);
            setIsSearching(false);
          }
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [newModelNameInput, selectedGunpla, searchTrigger]);

  // 聊天逻辑
  useEffect(() => {
    if (showSplash) return;
    let chatTimer: any;
    const tick = () => {
      const newText = QuoteEngine.getRandom(i18n.language, currentStageId);
      setChatMessages(prev => [...prev, { id: crypto.randomUUID(), botId: currentBot, text: newText, timestamp: Date.now() }].slice(-5));
    };
    const updateTimer = () => {
      if (chatTimer) clearInterval(chatTimer);
      let interval = 0;
      if (!isWindowActive) return; 
      
      if (pipWindow || isMiniMode) interval = pipChatInterval;
      else if (document.visibilityState === 'visible') interval = webChatInterval;
      if (interval > 0) chatTimer = setInterval(tick, interval);
    };
    updateTimer();
    document.addEventListener('visibilitychange', updateTimer);
    return () => {
      if (chatTimer) clearInterval(chatTimer);
      document.removeEventListener('visibilitychange', updateTimer);
    };
  }, [currentBot, i18n.language, webChatInterval, pipChatInterval, pipWindow, isMiniMode, currentStageId, showSplash, isWindowActive]);

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

  useEffect(() => {
    if (timerState === 'Running' && reminderInterval > 0) {
      if (activeSeconds > 0 && activeSeconds % reminderInterval === 0 && activeSeconds !== lastRemindedAt) {
        AudioManager.playTimeboxEnd();
        showToast(t('toast_timebox_end', { min: reminderInterval / 60 }));
        setLastRemindedAt(activeSeconds);
      }
    }
  }, [activeSeconds, timerState, reminderInterval, lastRemindedAt, isZh]);

  useEffect(() => { if (timerState !== 'Running') setLastRemindedAt(0); }, [timerState]);

  const tutorialSteps: TourStep[] = [
    { targetId: 'tour-welcome', title: t('tut_welcome_title'), content: t('tut_welcome_content'), page: 'focus' },
    { targetId: 'btn-add-model', title: t('tut_step1_title'), content: t('tut_step1_content'), page: 'focus' },
    { targetId: 'btn-add-task', title: t('tut_step2_title'), content: t('tut_step2_content'), page: 'focus' },
    { targetId: 'btn-pip', title: t('tut_pip_title'), content: t('tut_pip_content'), page: 'focus' },
    { targetId: 'tour-timer', title: t('tut_timer_title'), content: t('tut_timer_content'), page: 'focus' },
    { targetId: 'tab-gundam', title: t('tut_gundam_title'), content: t('tut_gundam_content'), page: 'gundam' },
    { targetId: 'tab-journal', title: t('tut_journal_title'), content: t('tut_journal_content'), page: 'journal' },
    { targetId: 'tab-hangar', title: t('tut_hangar_title'), content: t('tut_hangar_content'), page: 'hangar' },
    { targetId: 'tab-gallery', title: t('tut_gallery_title'), content: t('tut_gallery_content'), page: 'gallery' },
    { targetId: 'tab-profile', title: t('tut_profile_title'), content: t('tut_profile_content'), page: 'profile' }
  ];

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

  const handleTabChange = (newTab: MainTab) => {
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
    if (!targetId) {
      const m = updatedModels.find((m: any) => m.tasks.some((t: any) => t.id === currentTaskId));
      targetId = m?.id;
    }
    if (!targetId) return;
    const targetModel = updatedModels.find((m: any) => m.id === targetId);
    if (targetModel && targetModel.tasks.length > 0 && targetModel.tasks.every((t: any) => t.status === 'Completed') && targetModel.status !== 'Completed') {
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
    const assembly = tasks.find((t: any) => t.id === currentTaskId)?.stages.find((s: any) => s.nameKey === 'stage_assembly');
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

    const duplicate = models.find((m: any) => (m.name.en === nameObj.en || m.name.zh === nameObj.zh) && m.grade.toUpperCase() === newModelGrade.toUpperCase());
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

  const handleDeleteModel = (modelId: string) => {
    AudioManager.playClick(); const updated = ModelManager.deleteModel(modelId);
    setModels(updated); setViewingModelId(null); refreshData(); showToast(t('toast_deleted')); triggerAutoBackup();
  };

  const handleJumpToFocus = (taskId: string, stageId: string | null = null) => {
    AudioManager.playClick();
    if (viewingModel?.status === 'Completed' || viewingModel?.isRebuilding) {
      const updated = ModelManager.reopenModel(viewingModel.id); setModels(updated);
    }
    setCurrentModelId(viewingModelId!); setCurrentTaskId(taskId); if (stageId) setCurrentStageId(stageId);
    setActiveTab('focus'); setViewingModelId(null);
  };

  const handleSetTimeboxTarget = (min: number) => {
    AudioManager.playClick(); setTimeboxTarget(min * 60); setHasPlayedTimeboxSound(false);
  };

  const handleCancelDone = () => { AudioManager.playClick(); setLastSession(null); };

  const handleStartRebuild = (taskId: string | null) => {
    AudioManager.playClick(); 
    setPendingRebuildTask(taskId);
    const stages = viewingModel?.tasks.find((t: any) => t.name === 'part_legacy')?.stages.filter((s: any) => s.status === 'Completed').map((s: any) => s.nameKey) || ['stage_assembly'];
    setImportedStages(stages); 
    setRebuildMode('part'); 
    setIsEditingImportedStatus(true);
  };

  const handleConfirmRebuild = () => {
    if (!viewingModel) return;
    AudioManager.playStageDone(); 
    const updated = ModelManager.startLegacyRebuild(viewingModel.id, importedStages, rebuildMode === 'whole');
    
    let targetTaskId = null;
    const currentModelUpdated = updated.find((m: any) => m.id === viewingModel.id);
    if (currentModelUpdated) {
       if (rebuildMode === 'whole') {
           const wholeTask = currentModelUpdated.tasks.find((t: any) => t.name === 'part_whole');
           if (wholeTask) targetTaskId = wholeTask.id;
       } else {
           const firstPart = currentModelUpdated.tasks.find((t: any) => t.name !== 'part_legacy' && t.status !== 'Completed');
           if (firstPart) targetTaskId = firstPart.id;
           else {
               const legacyTask = currentModelUpdated.tasks.find((t: any) => t.name === 'part_legacy');
               if (legacyTask) targetTaskId = legacyTask.id;
           }
       }
    }
    
    setPendingRebuildTask(targetTaskId || null);
    setModels(updated); 
    setIsEditingImportedStatus(false); 
    setShowRebuildConfirm(true); 
    triggerAutoBackup();
  };

  const handleDoRebuild = () => {
    AudioManager.playClick(); 
    setShowRebuildConfirm(false);
    if (pendingRebuildTask) { 
      handleJumpToFocus(pendingRebuildTask); 
      setPendingRebuildTask(null); 
    } else {
      setActiveTab('focus');
      setViewingModelId(null);
    }
  };

  const handleSaveImportedStages = () => {
    if (!viewingModelId) return;
    AudioManager.playStageDone(); const updated = ModelManager.updateImportedModelStatus(viewingModelId, importedStages);
    setModels(updated); setIsEditingImportedStatus(false); checkAndPromptCompleteModel(updated, viewingModelId); triggerAutoBackup();
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && viewingModelId) {
      showToast(t('processing'));
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async (ev) => {
        const img = new Image();
        img.src = ev.target?.result as string;
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          let w = img.width; let h = img.height;
          if(w > 1920) { h = Math.round((h * 1920) / w); w = 1920; }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
          
          canvas.toBlob(async (blob) => {
            let finalBlob = blob;
            let ext = 'webp';
            if (!blob) {
              finalBlob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.7));
              ext = 'jpg';
            }
            if (!finalBlob) return;
            const filename = `cover_${Date.now()}.${ext}`;
            const localPath = await StorageManager.saveFileToLocal(filename, finalBlob);
            const finalUrl = localPath || canvas.toDataURL(`image/${ext}`, 0.7);
            
            const updated = ModelManager.updateModelCover(viewingModelId, finalUrl);
            setModels(updated); setIsEditingCover(false);
            showToast(t('toast_cover_updated'));
            triggerAutoBackup();
          }, 'image/webp', 0.6);
        };
      };
    }
    e.target.value = '';
  };

  const handleUnlockBot = (botId: BotType, cost: number) => {
    if (coinsBalance >= cost) {
      setCoinsBalance(coinsBalance - cost);
      setUnlockedBots([...unlockedBots, botId]);
      AudioManager.playAchievement(); refreshData();
      showToast(t('toast_unlock_bot', { name: isZh ? BOTS[botId].name : BOTS[botId].enName }));
    }
  };

  const handleEquipBot = (botId: BotType) => {
    setCurrentBot(botId);
    AudioManager.playStageDone();
    showToast(t('toast_switch_bot', { name: isZh ? BOTS[botId].name : BOTS[botId].enName }));
  };

  const equipTitle = (id: string) => { 
    AudioManager.playClick(); setEquippedTitle(id); AudioManager.playStageDone(); 
  };

  const formatTimeLocal = formatTime; // alias
  const formatLogDateLocal = formatLogDate;

  const currentModel = models.find((m: any) => m.id === currentModelId);
  const currentTask = tasks.find((t: any) => t.id === currentTaskId);
  const currentStage = currentTask?.stages.find((s: any) => s.id === currentStageId);
  const viewingModel = models.find((m: any) => m.id === viewingModelId);
  const viewingModelTotalSec = viewingModel ? SessionManager.getAllSessions().filter((s: any) => viewingModel.tasks.some((t: any) => t.id === s.taskId)).reduce((sum: number, s: any) => sum + s.activeSeconds, 0) : 0;
  const equippedTitleDef = UserManager.getTitleLibrary().find((t: any) => t.id === equippedTitle);

  const handleToggleMiniMode = async () => {
    if (isMiniMode) {
      setIsMiniMode(false);
      if (isTauri) {
        try {
          const { getCurrentWindow, LogicalSize } = await import('@tauri-apps/api/window');
          const win = getCurrentWindow();
          await win.setSize(new LogicalSize(1100, 800));
          await win.setAlwaysOnTop(false);
        } catch (e) {}
      }
      showToast(t('toast_main_ui_restored'));
    } else {
      setIsMiniMode(true);
      if (isTauri) {
        try {
          const { getCurrentWindow, LogicalSize } = await import('@tauri-apps/api/window');
          const win = getCurrentWindow();
          if (await win.isMaximized()) {
            await win.unmaximize();
            await new Promise(r => setTimeout(r, 200));
          }
          await win.setSize(new LogicalSize(400, 700));
          await win.setAlwaysOnTop(true);
        } catch (e) {}
      }
      showToast(t('toast_mini_mode_activated'));
    }
  };

  const handleOpenWebPiP = async () => {
    if (!('documentPictureInPicture' in window)) { 
      showToast(t('toast_pip_not_supported')); 
      return; 
    }
    try {
      const pipWin = await (window as any).documentPictureInPicture.requestWindow({ width: 400, height: 700 });
      Array.from(document.styleSheets).forEach((styleSheet) => {
        try { 
          const cssRules = Array.from(styleSheet.cssRules).map((rule) => rule.cssText).join(''); 
          const style = document.createElement('style'); 
          style.textContent = cssRules; 
          pipWin.document.head.appendChild(style); 
        } catch (e) { 
          const link = document.createElement('link'); 
          link.rel = 'stylesheet'; 
          link.href = (styleSheet as any).href; 
          pipWin.document.head.appendChild(link); 
        }
      });
      pipWin.document.body.style.backgroundColor = '#1e1e1e';
      pipWin.document.body.style.margin = '0';
      pipWin.document.body.style.overflow = 'hidden';
      
      setPipWindow(pipWin);
      pipWin.addEventListener('pagehide', () => setPipWindow(null));
    } catch (err) {
      console.error(err);
      showToast(t('toast_pip_open_fail'));
    }
  };

  // 🌟 批次 10D：commonProps 清理 ProfileView 专属字段
  // 保留：FocusPanel 需要的（showToast / handleFocus / timer / 模型选择 / 聊天 等）
  const commonProps = {
    t, i18n, models, tasks, currentModelId, setCurrentModelId, currentTaskId, setCurrentTaskId, currentStageId, setCurrentStageId,
    timerState, activeSeconds, lastSession, timeboxTarget, timeboxElapsed, handleStart, handlePause, handleResume, handleComplete,
    handleConfirmStageDone, handleCancelDone, handleFinishPart, isFinishingPart, setIsFinishingPart, finishPartPhoto, setFinishPartPhoto, handleConfirmFinishPart,
    currentModel, currentTask, currentStage, getModelName, formatTime: formatTimeLocal, handleFocus: handleFocusScroll, showToast, handleSetTimeboxTarget,
    isAddingModel, setIsAddingModel, newModelNameInput, setNewModelNameInput, selectedGunpla, setSelectedGunpla, searchResults, setSearchResults,
    newModelGrade, setNewModelGrade, newModelSeriesInput, setNewModelSeriesInput, useDefaultTasks, setUseDefaultTasks, handleAddModel,
    isAddingTask, setIsAddingTask, newTaskName, setNewTaskName, handleAddTask,
    isSearching,
    triggerModelSearch: () => setSearchTrigger(s => s + 1),
    bgMain, bgPip, bgSize, bgPosition, reminderInterval, setReminderInterval, audioSettings, setAudioSettings,
    username, setUsername,
    level, levelProgress, todayTotal: useAppStore.getState().todayTotal, isCheckedIn, checkinStreak, handleCheckin,
    currentBot, webChatInterval, setWebChatInterval, pipChatInterval, setPipChatInterval,
    chatMessages, setChatMessages, 
    storageEstimate,
    ambientType, setAmbientType,
    handleOpenWebPiP,
    handleToggleMiniMode,
    equippedTitleDef,
    isWholeBuild, setIsWholeBuild,
    rebuildMode, setRebuildMode,
    setModels, refreshData,
  };

  if (isPipMode) {
    return (
      <div className="app-wrapper" style={{ background: 'transparent' }}>
        <FocusPanel isPip={true} {...commonProps} bgImage={bgPip} onClose={() => { pipWindow?.close(); setPipWindow(null); }} />
      </div>
    );
  }

  if (isMiniMode) {
    return (
      <div className="app-wrapper mini-mode-wrapper" style={{ background: '#09090b' }}>
        <FocusPanel isPip={true} {...commonProps} bgImage={bgPip} onClose={handleToggleMiniMode} />
      </div>
    );
  }

  return (
    <>
      {showSplash && <SplashScreen onFinish={handleFinishSplash} />}
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
        {/* 🌟 批次 10D：toastMsg 来自 store */}
        {toastMsg && <div className="toast">{toastMsg}</div>}

        <div className="mini-window">
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '8px', flexShrink: 0 }}>
            <button 
              onClick={toggleAlwaysOnTop} 
              style={{ background: isAlwaysOnTop ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: isAlwaysOnTop ? '#fff' : '#3b82f6', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
              title={t('btn_toggle_always_on_top')}
            >
              📌
            </button>
            <button onClick={() => { AudioManager.playClick(); setShowTutorial(true); }} style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#3b82f6', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={t('tour_title_hint')}>?</button>
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
              <span className="mini-timer-text">{activeSeconds > 0 ? formatTimeLocal(activeSeconds) : '--'}</span>
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
              <ModelDetail {...({ viewingModel, viewingModelTotalSec, formatTime: formatTimeLocal, expandedTaskId, setExpandedTaskId, isEditingCover, setIsEditingCover, isEditingImportedStatus, setIsEditingImportedStatus, importedStages, setImportedStages, showRebuildConfirm, setShowRebuildConfirm, handleConfirmRebuild, handleDoRebuild, handleStartRebuild, handleJumpToFocus, handleCoverUpload, handleSaveImportedStages, showToast } as any)} />
            ) : (
              <>
                {activeTab === 'focus' && <FocusView {...commonProps} />}
                {activeTab === 'journal' && <JournalView />}
                {activeTab === 'hangar' && <HangarView />}
                {activeTab === 'gundam' && <GundamGalleryView {...({ i18n, models } as any)} />} 
                {activeTab === 'gallery' && <BotGalleryView unlockedBots={unlockedBots} currentBot={currentBot} level={level} coins={coinsBalance} checkinStreak={checkinStreak} onUnlock={handleUnlockBot} onEquip={handleEquipBot} i18n={i18n} />}
                {/* 🌟 批次 10D：ProfileView 完全零 props */}
                {activeTab === 'profile' && <ProfileView />}
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
                <button className="btn yes" style={{ flex: 1 }} onClick={() => { const target = pendingTabChange; setPendingTabChange(null); setActiveTab(target); }}>{t('confirm')}</button>
                <button className="btn no" style={{ flex: 1 }} onClick={() => { setPendingTabChange(null); }}>{t('cancel')}</button>
              </div>
            </div>
          </div>
        )}

        {updateInfo && (
          <div className="modal-overlay" style={{ zIndex: 10000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
            <div className="modal-content" style={{ width: '320px', border: '1px solid #3b82f6', boxShadow: '0 0 30px rgba(59, 130, 246, 0.3)', textAlign: 'center' }}>
              <h3 style={{ color: '#3b82f6', fontSize: '18px', marginBottom: '12px' }}>{t('update_new_version_title', { version: updateInfo.version })}</h3>
              <p style={{ fontSize: '12px', color: '#ccc', marginBottom: '16px', lineHeight: 1.5, maxHeight: '80px', overflowY: 'auto', textAlign: 'left', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '4px' }}>
                {updateInfo.body || t('update_default_body')}
              </p>
              
              {updateProgress !== null ? (
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
                  <div style={{ width: `${updateProgress}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', transition: 'width 0.2s' }} />
                </div>
              ) : (
                <div className="modal-actions" style={{ justifyContent: 'center' }}>
                  <button className="btn start" style={{ flex: 1 }} onClick={handleDownloadUpdate}>{t('update_now')}</button>
                  <button className="btn no" style={{ flex: 1 }} onClick={() => setUpdateInfo(null)}>{t('update_later')}</button>
                </div>
              )}
            </div>
          </div>
        )}

        {pipWindow && createPortal(
          <FocusPanel isPip={true} {...commonProps} bgImage={bgPip} onClose={() => { pipWindow.close(); setPipWindow(null); }} />,
          pipWindow.document.body
        )}
      </div>
    </>
  );
}

export default App;