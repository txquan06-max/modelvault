import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { SessionManager } from './core/SessionManager';
import { ModelManager } from './core/ModelManager';
import { AchievementManager } from './core/AchievementManager';
import { AudioManager } from './core/AudioManager';
import { StorageManager } from './core/StorageManager';
import { useAppStore, type MainTab } from './store/useAppStore';
import { formatTime } from './utils/format';
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

const TUTORIAL_REWARD_KEY = 'mv_tutorial_rewarded';
const MINI_MODE_SIZE = { width: 525, height: 300 };
const NORMAL_MODE_SIZE = { width: 1100, height: 800 };
// 🌟 网页 PiP 尺寸：横条布局，和极简模式风格一致但更小
const WEB_PIP_SIZE = { width: 455, height: 260 };

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

function App() {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';

  const {
    models, setModels, currentModelId, setCurrentModelId,
    currentTaskId, setCurrentTaskId, currentStageId, setCurrentStageId,
    viewingModelId, setViewingModelId, expandedTaskId, setExpandedTaskId,
    toastMsg, showToast,
    timerState, activeSeconds,
    chatMessages, setChatMessages,
    showCompleteModelConfirm, setShowCompleteModelConfirm, confirmCompleteModel,
    coinsBalance, setCoinsBalance, checkinStreak, level,
    currentBot, unlockedBots, setUnlockedBots,
    activeTab, setActiveTab,
    webChatInterval, pipChatInterval,
    refreshData,
    bgMain, bgSize, bgPosition, setBgSize, setBgPosition,
    ambientType,
  } = useAppStore();

  const [showSplash, setShowSplash] = useState(true);
  const [showTutorial, setShowTutorial] = useState(() => localStorage.getItem('hasSeenTutorial') === null);
  const [isMiniMode, setIsMiniMode] = useState(false);
  const [isWindowActive, setIsWindowActive] = useState(true);

  const [pendingTabChange, setPendingTabChange] = useState<MainTab | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [isEditingCover, setIsEditingCover] = useState(false);
  const [isEditingImportedStatus, setIsEditingImportedStatus] = useState(false);
  const [importedStages, setImportedStages] = useState<string[]>([]);
  const [showRebuildConfirm, setShowRebuildConfirm] = useState(false);
  const [pendingRebuildTask, setPendingRebuildTask] = useState<string | null>(null);
  const [rebuildMode, setRebuildMode] = useState<'part' | 'whole'>('part');

  const [activeAchievement, setActiveAchievement] = useState<AchievementData | null>(null);
  const [achievementQueue, setAchievementQueue] = useState<AchievementData[]>([]);

  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [updateProgress, setUpdateProgress] = useState<number | null>(null);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);

  const [webPipContainer, setWebPipContainer] = useState<HTMLElement | null>(null);

  const isMiniModeRef = useRef(isMiniMode);
  useEffect(() => { isMiniModeRef.current = isMiniMode; }, [isMiniMode]);
  const lastRemindedAtRef = useRef(0);
  const reminderIntervalRef = useRef(StorageManager.getReminderInterval());

  // ==================== 启动静音 + 首次交互解锁 ====================
  useEffect(() => {
    AudioManager.lock();
    const unlock = () => { AudioManager.unlock(); };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);

  // ==================== Splash & 更新 ====================
  const handleFinishSplash = useCallback(() => setShowSplash(false), []);

  useEffect(() => {
    const handleUpdate = (e: any) => setUpdateInfo(e.detail);
    window.addEventListener('tauri-update-available', handleUpdate);
    return () => window.removeEventListener('tauri-update-available', handleUpdate);
  }, []);

  // ==================== Tauri 窗口焦点 ====================
  useEffect(() => {
    if (!isTauri) return;
    let unlisten: any = null;
    import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
      const win = getCurrentWindow();
      win.onFocusChanged(({ payload: focused }) => setIsWindowActive(focused)).then(u => { unlisten = u; });
    });
    return () => { if (unlisten) unlisten(); };
  }, []);

  // ==================== Tauri 托盘事件监听 ====================
  useEffect(() => {
    if (!isTauri) return;
    let unlisten: any = null;
    import('@tauri-apps/api/event').then(({ listen }) => {
      listen<string>('tray:action', (e) => {
        const action = e.payload;
        const store = useAppStore.getState();
        if (action === 'start' && store.timerState === 'Idle') {
          store.startTimer();
        } else if (action === 'pause' && store.timerState === 'Running') {
          store.pauseTimer();
        }
      }).then((u) => { unlisten = u; });
    });
    return () => { if (unlisten) unlisten(); };
  }, []);

  // ==================== 全局快捷键 Ctrl+Shift+S 监听 ====================
  useEffect(() => {
    if (!isTauri) return;
    let unlisten: any = null;
    import('@tauri-apps/api/event').then(({ listen }) => {
      listen('shortcut:toggle-timer', () => {
        const store = useAppStore.getState();
        if (store.timerState === 'Idle') {
          if (store.currentTaskId) {
            store.startTimer();
          } else {
            store.showToast(i18n.t('toast_select_part'));
          }
        } else if (store.timerState === 'Running') {
          store.pauseTimer();
        } else if (store.timerState === 'Paused') {
          store.resumeTimer();
        }
      }).then((u) => { unlisten = u; });
    });
    return () => { if (unlisten) unlisten(); };
  }, [i18n]);

  // ==================== Web PiP：Portal 方案 ====================
  useEffect(() => {
    const handler = async () => {
      if (!('documentPictureInPicture' in window)) {
        showToast(t('toast_pip_not_supported'));
        return;
      }

      const existingWin = (window as any).documentPictureInPicture.window;
      if (existingWin) {
        try { existingWin.close(); } catch {}
        setWebPipContainer(null);
      }

      try {
        // 🌟 PiP 尺寸：455×260 横条布局
        const pipWin = await (window as any).documentPictureInPicture.requestWindow({
          width: WEB_PIP_SIZE.width,
          height: WEB_PIP_SIZE.height,
        });

        const styleNodes = document.head.querySelectorAll('style, link[rel="stylesheet"]');
        styleNodes.forEach((node) => {
          try {
            pipWin.document.head.appendChild(node.cloneNode(true));
          } catch (e) {
            console.warn('[PiP] style clone failed:', e);
          }
        });

        pipWin.document.body.style.backgroundColor = '#1e1e1e';
        pipWin.document.body.style.margin = '0';
        pipWin.document.body.style.overflow = 'hidden';

        const container = pipWin.document.createElement('div');
        container.id = 'pip-root';
        container.style.width = '100vw';
        container.style.height = '100vh';
        container.style.overflow = 'hidden';
        pipWin.document.body.appendChild(container);

        pipWin.addEventListener('pagehide', () => {
          setWebPipContainer(null);
        });

        setWebPipContainer(container);
        AudioManager.playClick();
      } catch (err) {
        console.error('[PiP] open failed:', err);
        showToast(t('toast_pip_open_fail'));
      }
    };
    window.addEventListener('mv-open-web-pip', handler as EventListener);
    return () => window.removeEventListener('mv-open-web-pip', handler as EventListener);
  }, [t, showToast]);

  // ==================== Timer tick ====================
  useEffect(() => {
    const interval = setInterval(() => {
      useAppStore.getState().tickTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ==================== Ambient ====================
  useEffect(() => {
    if (timerState === 'Running') AudioManager.playAmbient(ambientType);
    else AudioManager.stopAmbient();
    return () => AudioManager.stopAmbient();
  }, [timerState, ambientType]);

  // ==================== Chat 持久化 ====================
  useEffect(() => {
    if (chatMessages.length > 0) {
      sessionStorage.setItem('mv_chat_messages', JSON.stringify(chatMessages));
    }
  }, [chatMessages]);

  // ==================== Bot 初始化 ====================
  useEffect(() => {
    QuoteEngine.setBot(currentBot);
    if (chatMessages.length === 0) {
      const initText = QuoteEngine.getStartQuote(i18n.language);
      setChatMessages([{ id: crypto.randomUUID(), botId: currentBot, text: initText, timestamp: Date.now() }]);
    }
  }, [currentBot, i18n.language]);

  // ==================== 存储初始化 ====================
  useEffect(() => {
    const initStorage = async () => {
      await StorageManager.requestPersistentStorage();
      await refreshData();
    };
    initStorage();
  }, []);

  // ==================== 聊天定时器 ====================
  useEffect(() => {
    if (showSplash) return;
    let chatTimer: any;
    const tick = () => {
      const state = useAppStore.getState();
      const newText = QuoteEngine.getRandom(i18n.language, state.currentStageId);
      setChatMessages((prev) => [...prev, { id: crypto.randomUUID(), botId: state.currentBot, text: newText, timestamp: Date.now() }].slice(-5));
    };
    const updateTimer = () => {
      if (chatTimer) clearInterval(chatTimer);
      let interval = 0;
      if (!isWindowActive) return;
      if (isMiniMode) interval = pipChatInterval;
      else if (document.visibilityState === 'visible') interval = webChatInterval;
      if (interval > 0) chatTimer = setInterval(tick, interval);
    };
    updateTimer();
    document.addEventListener('visibilitychange', updateTimer);
    return () => {
      if (chatTimer) clearInterval(chatTimer);
      document.removeEventListener('visibilitychange', updateTimer);
    };
  }, [i18n.language, webChatInterval, pipChatInterval, isMiniMode, showSplash, isWindowActive]);

  // ==================== Timebox 结束通知 ====================
  useEffect(() => {
    const state = useAppStore.getState();
    if (timerState === 'Running' && state.timeboxTarget > 0 && activeSeconds >= state.timeboxTarget && !state.hasPlayedTimeboxSound) {
      AudioManager.playTimeboxEnd();
      useAppStore.getState().setHasPlayedTimeboxSound(true);

      const title = t('notify_timebox_end_title');
      const body = t('notify_timebox_end_body');

      if (isTauri) {
        import('@tauri-apps/plugin-notification').then(async ({ isPermissionGranted, requestPermission, sendNotification }) => {
          try {
            let granted = await isPermissionGranted();
            if (!granted) {
              const p = await requestPermission();
              granted = p === 'granted';
            }
            if (granted) sendNotification({ title, body });
          } catch (e) {
            console.warn('[Tauri] timebox notification failed:', e);
          }
        });
      } else {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, { body, icon: '/bots/tia_avatar.png' });
        }
      }
    }
  }, [activeSeconds, timerState, t]);

  // ==================== 定期提醒 ====================
  useEffect(() => {
    if (timerState === 'Running' && reminderIntervalRef.current > 0) {
      if (activeSeconds > 0 && activeSeconds % reminderIntervalRef.current === 0 && activeSeconds !== lastRemindedAtRef.current) {
        AudioManager.playTimeboxEnd();
        showToast(t('toast_timebox_end', { min: reminderIntervalRef.current / 60 }));
        lastRemindedAtRef.current = activeSeconds;
      }
    }
  }, [activeSeconds, timerState]);

  useEffect(() => {
    if (timerState !== 'Running') lastRemindedAtRef.current = 0;
  }, [timerState]);

  // ==================== 通知权限 & 拖拽拦截 ====================
  useEffect(() => {
    if (!isTauri && 'Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
    const preventDefault = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e: DragEvent) => {
      preventDefault(e);
      if (e.dataTransfer?.files.length) showToast(t('toast_no_drag'));
    };
    window.addEventListener('dragover', preventDefault);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragover', preventDefault);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  // ==================== 成就队列 ====================
  useEffect(() => {
    if (!activeAchievement && achievementQueue.length > 0) {
      const next = achievementQueue[0];
      setAchievementQueue(prev => prev.slice(1));
      setActiveAchievement(next);
    }
  }, [achievementQueue, activeAchievement]);

  const processAchievements = () => {
    const newlyEarned = AchievementManager.checkAll();
    if (newlyEarned.length > 0) setAchievementQueue(prev => [...prev, ...newlyEarned as AchievementData[]]);
  };

  // ==================== 极简模式 ====================
  const handleToggleMiniMode = useCallback(async () => {
    if (isMiniModeRef.current) {
      setIsMiniMode(false);
      if (isTauri) {
        try {
          const { getCurrentWindow, LogicalSize } = await import('@tauri-apps/api/window');
          const win = getCurrentWindow();
          await win.setSize(new LogicalSize(NORMAL_MODE_SIZE.width, NORMAL_MODE_SIZE.height));
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
          await win.setSize(new LogicalSize(MINI_MODE_SIZE.width, MINI_MODE_SIZE.height));
          await win.setAlwaysOnTop(true);
        } catch (e) {}
      }
      showToast(t('toast_mini_mode_activated'));
    }
  }, [t, showToast]);

  useEffect(() => {
    window.addEventListener('mv-toggle-mini-mode', handleToggleMiniMode);
    return () => window.removeEventListener('mv-toggle-mini-mode', handleToggleMiniMode);
  }, [handleToggleMiniMode]);

  // ==================== 置顶 / 更新 ====================
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
        if (event.event === 'Started') contentLength = event.data.contentLength || 0;
        else if (event.event === 'Progress') {
          downloaded += event.data.chunkLength;
          setUpdateProgress(Math.floor((downloaded / contentLength) * 100));
        } else if (event.event === 'Finished') setUpdateProgress(100);
      });
      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    } catch (err) {
      showToast(t('toast_update_failed'));
      setUpdateProgress(null);
    }
  };

  // ==================== Tab 切换 ====================
  const handleTabChange = (newTab: MainTab) => {
    if (activeTab === 'focus' && timerState === 'Running') setPendingTabChange(newTab);
    else { AudioManager.playClick(); setActiveTab(newTab); }
  };

  // ==================== ModelDetail handlers ====================
  const viewingModel = models.find((m: any) => m.id === viewingModelId);
  const viewingModelTotalSec = viewingModel
    ? SessionManager.getAllSessions().filter((s: any) => viewingModel.tasks.some((t: any) => t.id === s.taskId)).reduce((sum: number, s: any) => sum + s.activeSeconds, 0)
    : 0;

  const checkAndPromptCompleteModel = (updatedModels: any[], modelId?: string) => {
    let targetId = modelId;
    if (!targetId) {
      const curTaskId = useAppStore.getState().currentTaskId;
      const m = updatedModels.find((m: any) => m.tasks.some((t: any) => t.id === curTaskId));
      targetId = m?.id;
    }
    if (!targetId) return;
    const targetModel = updatedModels.find((m: any) => m.id === targetId);
    if (targetModel && targetModel.tasks.length > 0 && targetModel.tasks.every((t: any) => t.status === 'Completed') && targetModel.status !== 'Completed') {
      useAppStore.setState({ showCompleteModelConfirm: true, completeModelId: targetId });
    }
  };

  const handleDeleteModel = (modelId: string) => {
    AudioManager.playClick();
    const updated = ModelManager.deleteModel(modelId);
    setModels(updated);
    setViewingModelId(null);
    refreshData();
    showToast(t('toast_deleted'));
    useAppStore.getState().triggerAutoBackup();
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
    useAppStore.getState().triggerAutoBackup();
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
    AudioManager.playStageDone();
    const updated = ModelManager.updateImportedModelStatus(viewingModelId, importedStages);
    setModels(updated);
    setIsEditingImportedStatus(false);
    checkAndPromptCompleteModel(updated, viewingModelId);
    useAppStore.getState().triggerAutoBackup();
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
          if (w > 1920) { h = Math.round((h * 1920) / w); w = 1920; }
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
            setModels(updated);
            setIsEditingCover(false);
            showToast(t('toast_cover_updated'));
            useAppStore.getState().triggerAutoBackup();
          }, 'image/webp', 0.6);
        };
      };
    }
    e.target.value = '';
  };

  // ==================== Bot ====================
  const handleUnlockBot = (botId: BotType, cost: number) => {
    if (coinsBalance >= cost) {
      setCoinsBalance(coinsBalance - cost);
      setUnlockedBots([...unlockedBots, botId]);
      AudioManager.playAchievement();
      refreshData();
      showToast(t('toast_unlock_bot', { name: isZh ? BOTS[botId].name : BOTS[botId].enName }));
      processAchievements();
    }
  };

  const handleEquipBot = (botId: BotType) => {
    useAppStore.getState().setCurrentBot(botId);
    AudioManager.playStageDone();
    showToast(t('toast_switch_bot', { name: isZh ? BOTS[botId].name : BOTS[botId].enName }));
  };

  // ==================== 教程 ====================
  const tutorialSteps: TourStep[] = [
    { targetId: 'tour-welcome', title: t('tut_welcome_title'), content: t('tut_welcome_content'), page: 'focus' },
    { targetId: 'btn-add-model', title: t('tut_step1_title'), content: t('tut_step1_content'), page: 'focus' },
    { targetId: 'btn-add-task', title: t('tut_step2_title'), content: t('tut_step2_content'), page: 'focus' },
    ...(isTauri
      ? [{ targetId: 'btn-mini-mode', title: t('tut_mini_title'), content: t('tut_mini_content'), page: 'focus' as const }]
      : [{ targetId: 'btn-web-pip', title: t('tut_pip_title'), content: t('tut_pip_content'), page: 'focus' as const }]
    ),
    { targetId: 'tour-timer', title: t('tut_timer_title'), content: t('tut_timer_content'), page: 'focus' },
    { targetId: 'tour-checkin', title: t('tut_checkin_title'), content: t('tut_checkin_content'), page: 'focus' },
    { targetId: 'tab-gundam', title: t('tut_gundam_title'), content: t('tut_gundam_content'), page: 'gundam' },
    { targetId: 'tab-journal', title: t('tut_journal_title'), content: t('tut_journal_content'), page: 'journal' },
    { targetId: 'tab-hangar', title: t('tut_hangar_title'), content: t('tut_hangar_content'), page: 'hangar' },
    { targetId: 'tab-gallery', title: t('tut_gallery_title'), content: t('tut_gallery_content'), page: 'gallery' },
    { targetId: 'tab-profile', title: t('tut_profile_title'), content: t('tut_profile_content'), page: 'profile' }
  ];

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    localStorage.setItem('hasSeenTutorial', 'true');

    if (!localStorage.getItem(TUTORIAL_REWARD_KEY)) {
      localStorage.setItem(TUTORIAL_REWARD_KEY, '1');
      const coins = 100;
      const xp = 20;
      StorageManager.setCoinsBalance(StorageManager.getCoinsBalance() + coins);
      StorageManager.setLegacyXP(StorageManager.getLegacyXP() + xp);
      refreshData();
      AudioManager.playAchievement();
      showToast(t('toast_tutorial_reward', { coins, xp }));
    }
  };

  const handleTutorialClose = () => {
    setShowTutorial(false);
    localStorage.setItem('hasSeenTutorial', 'true');
  };

  // ==================== PiP 独立窗口 ====================
  if (isPipMode) {
    return (
      <div className="app-wrapper" style={{ background: 'transparent' }}>
        <FocusPanel isPip={true} />
      </div>
    );
  }

  // ==================== Mini 模式 ====================
  if (isMiniMode) {
    return (
      <div className="app-wrapper mini-mode-wrapper" style={{ background: '#09090b' }}>
        <FocusPanel isPip={true} onClose={handleToggleMiniMode} />
      </div>
    );
  }

  return (
    <>
      {showSplash && <SplashScreen onFinish={handleFinishSplash} />}
      {showTutorial && !showSplash && (
        <TutorialTour
          steps={tutorialSteps}
          onClose={handleTutorialClose}
          onComplete={handleTutorialComplete}
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
            <button
              onClick={toggleAlwaysOnTop}
              style={{ background: isAlwaysOnTop ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: isAlwaysOnTop ? '#fff' : '#3b82f6', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title={t('btn_toggle_always_on_top')}
            >📌</button>
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
              <span className="mini-timer-text">{activeSeconds > 0 ? formatTime(activeSeconds) : '--'}</span>
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
              <ModelDetail
                viewingModel={viewingModel}
                viewingModelTotalSec={viewingModelTotalSec}
                formatTime={formatTime}
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
                rebuildMode={rebuildMode}
                setRebuildMode={setRebuildMode}
                showToast={showToast}
              />
            ) : (
              <>
                {activeTab === 'focus' && <FocusView />}
                {activeTab === 'journal' && <JournalView />}
                {activeTab === 'hangar' && <HangarView />}
                {activeTab === 'gundam' && <GundamGalleryView i18n={i18n} models={models} />}
                {activeTab === 'gallery' && <BotGalleryView unlockedBots={unlockedBots} currentBot={currentBot} level={level} coins={coinsBalance} checkinStreak={checkinStreak} onUnlock={handleUnlockBot} onEquip={handleEquipBot} i18n={i18n} />}
                {activeTab === 'profile' && <ProfileView />}
              </>
            )}
          </div>
        </div>

        <Modals
          showCompleteModelConfirm={showCompleteModelConfirm}
          setShowCompleteModelConfirm={setShowCompleteModelConfirm}
          handleConfirmCompleteModel={() => { confirmCompleteModel(); processAchievements(); }}
          isPreviewOpen={false}
          setIsPreviewOpen={() => {}}
          bgMain={bgMain}
          bgSize={bgSize}
          bgPosition={bgPosition}
          setBgSize={setBgSize}
          setBgPosition={setBgPosition}
          applyBackground={() => {}}
          deferredPrompt={null}
          setDeferredPrompt={() => {}}
          i18n={i18n}
        />
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
      </div>

      {webPipContainer && createPortal(
        <FocusPanel isPip={true} onClose={() => setWebPipContainer(null)} />,
        webPipContainer
      )}
    </>
  );
}

export default App;