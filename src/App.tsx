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
import type { Model, Task } from './core/ModelManager';
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

import { BOTS, type BotType, QuoteEngine } from './core/QuoteEngine';
import { generateShareCard } from './utils/shareCard'; 

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
    StorageManager.loadLocalFileUrl(src).then(res => {
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
  
  const [showSplash, setShowSplash] = useState(true);
  const [showTutorial, setShowTutorial] = useState(() => {
    return localStorage.getItem('hasSeenTutorial') === null;
  });

  const [activeTab, setActiveTab] = useState<'focus' | 'journal' | 'hangar' | 'gallery' | 'gundam' | 'profile'>('focus');
  const [pendingTabChange, setPendingTabChange] = useState<'focus' | 'journal' | 'hangar' | 'gallery' | 'gundam' | 'profile' | null>(null);
  
  const [viewingModelId, setViewingModelId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const [activeSeconds, setActiveSeconds] = useState(0);
  const [timerState, setTimerState] = useState<'Idle' | 'Running' | 'Paused'>('Idle');
  const [todayTotal, setTodayTotal] = useState(0);
  const [level, setLevel] = useState(1);
  const [levelProgress, setLevelProgress] = useState({ current: 0, next: 100, percent: 0 });
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
  const [isCheckedIn, setIsCheckedIn] = useState(() => CheckinManager.isCheckedInToday());
  const [checkinStreak, setCheckinStreak] = useState(() => StorageManager.getCheckinStreak());

  const [webChatInterval, setWebChatInterval] = useState(() => StorageManager.getWebChatInterval());
  const [pipChatInterval, setPipChatInterval] = useState(() => StorageManager.getPipChatInterval());

  const [unlockedBots, setUnlockedBots] = useState<BotType[]>(() => {
    const saved = localStorage.getItem('mv_unlocked_bots');
    return saved ? JSON.parse(saved) : ['tu'];
  });
  
  const [currentBot, setCurrentBot] = useState<BotType>(() => {
    const saved = localStorage.getItem('mv_current_bot') as BotType;
    return (saved && BOTS[saved]) ? saved : 'tu';
  });

  const [storageEstimate, setStorageEstimate] = useState({ usage: 0, quota: 0, percent: 0 });
  const [isAutoBackupEnabled, setIsAutoBackupEnabled] = useState(false);
  const [isAssetsMounted, setIsAssetsMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [ambientType, setAmbientType] = useState<AmbientType>('none');

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem('mv_chat_messages');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return []; 
  });

  useEffect(() => {
    if (timerState === 'Running') AudioManager.playAmbient(ambientType);
    else AudioManager.stopAmbient();
    return () => AudioManager.stopAmbient();
  }, [timerState, ambientType]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New content is available; please refresh.');
                window.location.reload();
              }
            };
          }
        };
      }).catch((err) => { console.log('SW registration failed: ', err); });
    }
  }, []);

  const tutorialSteps: TourStep[] = [
    { targetId: 'tour-welcome', title: isZh ? '欢迎来到模途' : 'Welcome to ModelJourney', content: isZh ? '欢迎胶佬！这里是你的专属赛博拼装基地。点击上方任意位置开始。' : 'Welcome! This is your cyber building base.', page: 'focus' },
    { targetId: 'btn-add-model', title: isZh ? '第一步：建立目标' : 'Step 1: Add Model', content: isZh ? '点击这里【添加模型】。可以搜索你的机体。' : 'Click here to add a model. Search your kit.', page: 'focus' },
    { targetId: 'btn-add-task', title: isZh ? '第二步：拆分部位' : 'Step 2: Add Part', content: isZh ? '添加模型后，点击【添加部位】，比如“头部”。' : 'After adding a model, click Add Part.', page: 'focus' },
    { targetId: 'btn-pip', title: isZh ? '悬浮窗模式' : 'PiP Mode', content: isZh ? '点击这里开启悬浮窗，边看视频边拼胶！' : 'Click here to open PiP, watch videos while building!', page: 'focus' },
    { targetId: 'tour-timer', title: isZh ? '番茄钟与专注' : 'Focus & Timer', content: isZh ? '选择时间，点击【开始】。注意：必须超过 10 秒才能【完成】记录！' : 'Select time, click Start. Must exceed 10s to complete!', page: 'focus' },
    { targetId: 'tab-gundam', title: isZh ? '机体图鉴' : 'Mecha Archive', content: isZh ? '你收集的机体都在这里，看看还有哪些没拼！' : 'All your collected mechas are here.', page: 'gundam' },
    { targetId: 'tab-journal', title: isZh ? '制作日程' : 'Journal', content: isZh ? '在【日志】里回顾每一分专注。' : 'Review every focused minute in the Journal.', page: 'journal' },
    { targetId: 'tab-hangar', title: isZh ? '格纳库' : 'Hangar', content: isZh ? '拼完的模型都会陈列在这里。' : 'Completed models are displayed here.', page: 'hangar' },
    { targetId: 'tab-gallery', title: isZh ? '塑灵' : 'Animold', content: isZh ? '解锁不同的【塑灵】陪你聊天。' : 'Unlock different Animolds to chat with you.', page: 'gallery' },
    { targetId: 'tab-profile', title: isZh ? '个人中心' : 'Profile', content: isZh ? '换背景、补录历史模型、导出备份都在这里。' : 'Change backgrounds, import legacy models, and export backups here.', page: 'profile' },
    { 
      targetId: 'tour-install', 
      title: isZh ? '安装至桌面' : 'Install to Desktop', 
      content: isZh 
        ? '强烈建议安装！\n💻 电脑端：点击浏览器右上角菜单（三个点） → 更多工具 → 应用 → 将此站点安装为应用（或直接点击地址栏右侧的安装图标）。\n📱 移动端：\nAndroid 浏览器菜单选“添加到主屏幕”；\niOS Safari 点击底部“分享”按钮，选择“添加到主屏幕”。\n安装后能去除浏览器边框，体验原生 App 全屏沉浸感！' 
        : 'Highly recommended!\n💻 PC: Click the browser menu (three dots) → More tools → Apps → Install this site as an app.\n📱 Mobile:\nAndroid: Menu → Add to Home screen;\niOS Safari: Share → Add to Home Screen.\nEnjoy a native app-like fullscreen experience!', 
      page: 'profile' 
    }
  ];

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setTimeout(() => setDeferredPrompt(e), 5000);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

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
      const est = await StorageManager.getStorageEstimate();
      setStorageEstimate(est);
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
    if (isAutoBackupEnabled) {
      const data = StorageManager.exportAll();
      await StorageManager.autoBackupData(data);
    }
  };

  const pushChatMessage = (type: 'start' | 'pause' | 'complete') => {
    const text = type === 'start' ? QuoteEngine.getStartQuote(i18n.language) 
               : type === 'pause' ? QuoteEngine.getPauseQuote(i18n.language) 
               : QuoteEngine.getCompleteQuote(i18n.language);
    setChatMessages(prev => [...prev, { id: crypto.randomUUID(), botId: currentBot, text, timestamp: Date.now() }].slice(-5));
  };

  const getModelName = (m: Model) => isZh ? m.name.zh : m.name.en;
  const getModelSeries = (m: Model) => isZh ? m.series.zh : m.series.en;

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (timerState === 'Running') { e.preventDefault(); e.returnValue = isZh ? '你有正在进行的计时，刷新或关闭将丢失当前计时！Are you sure?' : 'You have an active timer. Refresh or close will lose data!'; }
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

  const refreshData = async () => {
    const xp = ModelManager.getTotalXP();
    setLevel(UserManager.getLevel(xp));
    setLevelProgress(UserManager.getLevelProgress(xp));
    setTodayTotal(SessionManager.getTodayTotalSeconds());
    setCoinsBalance(StorageManager.getCoinsBalance());
    setEarnedTitles(StorageManager.getEarnedTitles());
    setEquippedTitle(StorageManager.getEquippedTitle());
    setAudioSettings(StorageManager.getAudioSettings());
    setCustomAudios(StorageManager.getCustomAudios());
    setBgMain(StorageManager.getBgMain());
    setBgPip(StorageManager.getBgPip());
    setBgSize(StorageManager.getBgSize());
    setBgPosition(StorageManager.getBgPosition());
    setCheckinStreak(StorageManager.getCheckinStreak());
    setIsCheckedIn(CheckinManager.isCheckedInToday());

    const allModels = ModelManager.getAllModels();
    setModels(allModels);
    const available = allModels.filter(m => m.status !== 'Completed');
    if (available.length > 0) {
      if (!currentModelId || !available.some(m => m.id === currentModelId)) setCurrentModelId(available[0].id);
    } else setCurrentModelId(''); 

    const est = await StorageManager.getStorageEstimate();
    setStorageEstimate(est);
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
        showToast(isZh ? `⏰ 已专注 ${reminderInterval / 60} 分钟，记得休息一下！` : `⏰ Focused for ${reminderInterval / 60} min. Take a break!`);
        setLastRemindedAt(activeSeconds);
      }
    }
  }, [activeSeconds, timerState, reminderInterval, lastRemindedAt]);

  useEffect(() => { if (timerState !== 'Running') setLastRemindedAt(0); }, [timerState]);

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); };
  const toggleLanguage = () => { AudioManager.playClick(); const next = isZh ? 'en' : 'zh'; i18n.changeLanguage(next); localStorage.setItem('lang', next); };

  const processImageUpload = async (file: File, type: 'main' | 'pip' | 'cover') => {
    return new Promise<string>(async (resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (ev) => {
        const img = new Image();
        img.src = ev.target?.result as string;
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          let w = img.width; let h = img.height;
          if(w > 1920) { h = Math.round((h * 1920) / w); w = 1920; }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
          
          canvas.toBlob(async (blob) => {
            if (!blob) return resolve('');
            const filename = `${type}_${Date.now()}.webp`;
            const localPath = await StorageManager.saveFileToLocal(filename, blob);
            if (localPath) resolve(localPath);
            else resolve(canvas.toDataURL('image/webp', 0.6));
          }, 'image/webp', 0.6);
        };
      };
    });
  };

  const handleBgFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'pip') => {
    const file = e.target.files?.[0];
    if (file) {
      showToast(isZh ? '处理图片中...' : 'Processing...');
      const result = await processImageUpload(file, type);
      if (result) {
        if (type === 'main') { setBgMain(result); StorageManager.setBgMain(result); } 
        else { setBgPip(result); StorageManager.setBgPip(result); }
        showToast(isZh ? '✅ 背景图上传成功！' : '✅ Background uploaded!');
        triggerAutoBackup();
      }
    }
    e.target.value = '';
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && viewingModelId) {
      showToast(isZh ? '处理图片中...' : 'Processing...');
      const result = await processImageUpload(file, 'cover');
      if (result) {
        const updated = ModelManager.updateModelCover(viewingModelId, result);
        setModels(updated); setIsEditingCover(false);
        showToast(isZh ? '✅ 封面修改成功！' : '✅ Cover updated!');
        triggerAutoBackup();
      }
    }
    e.target.value = '';
  };

  const handleAudioUpload = (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) { showToast(isZh ? '音频文件太大（最大1MB）' : 'Audio file too large (max 1MB)'); return; }
    
    const filename = `audio_${type}_${Date.now()}.mp3`;
    StorageManager.saveFileToLocal(filename, file).then(async (localPath) => {
      const finalPath = localPath || await new Promise<string>((res) => {
        const reader = new FileReader();
        reader.onload = (ev) => res(ev.target?.result as string);
        reader.readAsDataURL(file);
      });
      const newAudios = { ...customAudios, [type]: finalPath };
      setCustomAudios(newAudios);
      StorageManager.setCustomAudios(newAudios);
      updateAudioSetting(type, 'custom');
      showToast(isZh ? '✅ 音效上传成功！' : '✅ Audio uploaded!');
      triggerAutoBackup();
    });
    e.target.value = '';
  };

  const handleUnlockBot = (botId: BotType, cost: number) => {
    if (coinsBalance >= cost) {
      StorageManager.setCoinsBalance(coinsBalance - cost);
      const newUnlocked = [...unlockedBots, botId];
      setUnlockedBots(newUnlocked);
      localStorage.setItem('mv_unlocked_bots', JSON.stringify(newUnlocked));
      AudioManager.playAchievement(); refreshData();
      showToast(isZh ? `🎉 欢迎新塑灵：${BOTS[botId].name} 已接入你的终端。` : `🎉 Welcome new Animold: ${BOTS[botId].enName} has connected to your terminal.`);
    }
  };

  const handleEquipBot = (botId: BotType) => {
    setCurrentBot(botId); localStorage.setItem('mv_current_bot', botId);
    AudioManager.playStageDone();
    showToast(isZh ? `✅ 已切换为 ${BOTS[botId].name}` : `✅ Switched to ${BOTS[botId].enName}`);
  };

  const handleSetTimeboxTarget = (min: number) => {
    AudioManager.playClick(); setTimeboxTarget(min * 60); setTimeboxElapsed(0); setHasPlayedTimeboxSound(false);
  };

  const handleStart = () => { 
    if (!currentTaskId) { showToast(isZh ? '请先添加并选择一个部位' : 'Please select a part first'); return; }
    AudioManager.playStart(); engineRef.current.start(); 
    setModels(ModelManager.startStage(currentTaskId, currentStageId)); 
    setHasPlayedTimeboxSound(false); refreshData(); pushChatMessage('start');
  };
  const handlePause = () => { AudioManager.playPause(); engineRef.current.pause(); pushChatMessage('pause'); };
  const handleResume = () => { AudioManager.playStart(); engineRef.current.resume(); pushChatMessage('start'); };
  const handleComplete = () => {
    const result = engineRef.current.complete();
    if (result) {
      if (result.activeSeconds < 10) { showToast(isZh ? '计时太短，无法记录（至少10秒）。' : 'Time too short, not saved (min 10s).'); return; }
      AudioManager.playComplete();
      SessionManager.saveSession({ id: crypto.randomUUID(), taskId: currentTaskId, stageId: currentStageId, ...result });
      refreshData(); setLastSession({ duration: result.activeSeconds, stageId: currentStageId }); pushChatMessage('complete');
      triggerAutoBackup();
    }
  };

  const handleTabChange = (newTab: typeof activeTab) => {
    if (activeTab === 'focus' && timerState === 'Running') {
      setPendingTabChange(newTab);
    } else {
      AudioManager.playClick();
      setActiveTab(newTab);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const target = e.target as HTMLElement;
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) return;
        if (viewingModelId || showTutorial || showSplash || isPreviewOpen || showCompleteModelConfirm || pendingTabChange) return;
        e.preventDefault();
        if (timerState === 'Idle') handleStart();
        else if (timerState === 'Running') handlePause();
        else if (timerState === 'Paused') handleResume();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timerState, handleStart, handlePause, handleResume, viewingModelId, showTutorial, showSplash, isPreviewOpen, showCompleteModelConfirm, pendingTabChange]);

  const processAchievements = () => {
    const newlyEarned = AchievementManager.checkAll();
    if (newlyEarned.length > 0) {
      AudioManager.playAchievement(); newlyEarned.forEach(ach => showToast(`🏆 ${t(ach.nameKey)}`));
    }
  };

  const handleCheckin = () => {
    const result = CheckinManager.checkin();
    if (result.success) {
      AudioManager.playAchievement();
      showToast(isZh ? `🎉 打卡成功！连击 ${result.streak} 天，获得 ${result.rewardXp} XP 和 ${result.rewardCoins} 🪙` : `🎉 Checked in! Streak ${result.streak}, +${result.rewardXp} XP, +${result.rewardCoins} Coins`);
      refreshData(); processAchievements();
    } else showToast(t('alreadyCheckedIn'));
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
    setModels(result.models); refreshData(); processAchievements(); setTimeboxTarget(0); setTimeboxElapsed(0); setHasPlayedTimeboxSound(false); setIsFinishingPart(false); checkAndPromptCompleteModel(result.models);
    triggerAutoBackup();
  };

  const handleConfirmCompleteModel = () => {
    if (!completeModelId) return;
    AudioManager.playFinishPart(); const updated = ModelManager.finishModel(completeModelId);
    setModels(updated); refreshData(); setShowCompleteModelConfirm(false); setCompleteModelId(null);
    showToast(isZh ? '🎉 模型已收入格纳库！' : '🎉 Model added to Hangar!');
    triggerAutoBackup();
  };

  const handleAddModel = () => {
    if (!newModelNameInput.trim() && !selectedGunpla) return;
    AudioManager.playClick();
    const nameObj = selectedGunpla ? selectedGunpla.name : { en: newModelNameInput.trim(), zh: newModelNameInput.trim() };
    const seriesObj = selectedGunpla ? selectedGunpla.series : { en: newModelSeriesInput.trim() || 'Unknown', zh: newModelSeriesInput.trim() || '未知' };
    const updated = ModelManager.addModel(nameObj, newModelGrade, seriesObj, useDefaultTasks);
    setModels(updated); setCurrentModelId(updated[updated.length - 1].id);
    setNewModelNameInput(''); setNewModelSeriesInput(''); setSelectedGunpla(null); setIsAddingModel(false); setUseDefaultTasks(true); setSearchResults([]); processAchievements();
    triggerAutoBackup();
  };

  const handleAddTask = (name: string) => {
    const updated = ModelManager.addTask(currentModelId, name);
    setModels(updated); triggerAutoBackup();
  };

  const addToLegacyList = (item: GunplaItem) => {
    AudioManager.playClick();
    if (!legacyList.some(i => i.name.en === item.name.en && i.grade === item.grade)) setLegacyList([...legacyList, { ...item }]);
    else showToast(isZh ? '该模型已经在待导入列表中啦！' : 'Model already in import list!');
    setLegacyInput(''); setLegacyResults([]);
  };

  const removeLegacyItem = (id: string) => { AudioManager.playClick(); setLegacyList(legacyList.filter(i => i.id !== id)); };

  const handleLegacyCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      showToast(isZh ? '处理图片中...' : 'Processing...');
      const result = await processImageUpload(file, 'cover');
      if (result) { const newList = [...legacyList]; newList[index].coverImage = result; setLegacyList(newList); }
    }
    e.target.value = '';
  };

  const handleLegacyImport = () => {
    if (legacyList.length === 0) return;
    AudioManager.playClick(); const result = ModelManager.importLegacyModelsFromList(legacyList);
    if (result.count > 0) {
      AudioManager.playFinishPart(); showToast(t('importedSuccess', { count: result.count }));
      setLegacyList([]); refreshData(); processAchievements(); triggerAutoBackup();
    }
  };

  const handleDeleteModel = (modelId: string) => {
    AudioManager.playClick(); const updated = ModelManager.deleteModel(modelId);
    setModels(updated); setViewingModelId(null); refreshData(); showToast(isZh ? "已删除" : "Deleted"); triggerAutoBackup();
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
    setModels(updated); setIsEditingImportedStatus(false); setShowRebuildConfirm(true); triggerAutoBackup();
  };

  const handleDoRebuild = () => {
    AudioManager.playClick(); setShowRebuildConfirm(false);
    if (pendingRebuildTask) { handleJumpToFocus(pendingRebuildTask); setPendingRebuildTask(null); }
  };

  const handleSaveImportedStages = () => {
    if (!viewingModelId) return;
    AudioManager.playStageDone(); const updated = ModelManager.updateImportedModelStatus(viewingModelId, importedStages);
    setModels(updated); setIsEditingImportedStatus(false); checkAndPromptCompleteModel(updated, viewingModelId); triggerAutoBackup();
  };

  const handleCancelDone = () => { AudioManager.playClick(); setLastSession(null); };
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => { setUsername(e.target.value); StorageManager.setUsername(e.target.value); };
  const updateAudioSetting = (type: string, style: string) => { const newSettings = { ...audioSettings, [type]: style }; setAudioSettings(newSettings); StorageManager.setAudioSettings(newSettings); if (style !== 'off') AudioManager.previewSound(type as any); };

  const openPreview = () => { AudioManager.playClick(); setBgSize(StorageManager.getBgSize()); setBgPosition(StorageManager.getBgPosition()); setIsPreviewOpen(true); };
  const applyBackground = () => { AudioManager.playClick(); StorageManager.setBgSize(bgSize); StorageManager.setBgPosition(bgPosition); setIsPreviewOpen(false); showToast(isZh ? '✅ 适配设置应用成功！' : '✅ Settings applied!'); };

  const buyTitle = (id: string) => { 
    const result = UserManager.buyTitle(id);
    if (result.success) { AudioManager.playAchievement(); showToast(t('titleUnlocked')); refreshData(); } 
    else { AudioManager.playClick(); if (result.error === 'level_too_low') showToast(t('levelTooLow')); else if (result.error === 'not_enough_coins') showToast(t('notEnoughCoins')); else showToast(t('notEnoughCoins')); } 
  };
  
  const equipTitle = (id: string) => { AudioManager.playClick(); StorageManager.setEquippedTitle(id); setEquippedTitle(id); AudioManager.playStageDone(); };

  const handleOpenPiP = async () => {
    AudioManager.playClick();
    if (isWeChat) { showToast(isZh ? '微信内不支持画中画，请用浏览器打开' : 'PiP not supported in WeChat.'); return; }
    if (!('documentPictureInPicture' in window)) { showToast(isZh ? '您的浏览器不支持画中画，请使用 Chrome/Edge。' : 'Your browser does not support PiP.'); return; }
    try {
      const pipWin = await (window as any).documentPictureInPicture.requestWindow({ width: 320, height: 480 });
      [...document.styleSheets].forEach((styleSheet) => {
        try { const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join(''); const style = document.createElement('style'); style.textContent = cssRules; pipWin.document.head.appendChild(style); } 
        catch (e) { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = (styleSheet as any).href; pipWin.document.head.appendChild(link); }
      });
      pipWin.document.body.style.backgroundColor = '#1e1e1e'; pipWin.document.body.style.margin = '0'; pipWin.document.body.style.display = 'flex'; pipWin.document.body.style.justifyContent = 'center'; pipWin.document.body.style.alignItems = 'center'; pipWin.document.body.style.height = '100vh'; pipWin.document.body.style.overflow = 'hidden';
      setPipWindow(pipWin); pipWin.addEventListener('pagehide', () => setPipWindow(null));
    } catch (err) { console.error(err); showToast(isZh ? '画中画打开失败' : 'Failed to open PiP'); }
  };

  const exportData = () => { AudioManager.playClick(); const data = StorageManager.exportAll(); const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `modelvault_backup_${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url); };
  
  const importData = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const file = e.target.files?.[0]; if (!file) return; AudioManager.playClick();
    const reader = new FileReader(); 
    reader.onload = async (event) => { 
      try { 
        const data = JSON.parse(event.target?.result as string); 
        const success = await StorageManager.importAll(data); 
        if (success) { showToast(t('importSuccess')); setTimeout(() => window.location.reload(), 1000); } 
        else showToast(t('importError')); 
      } catch (err) { showToast(t('importError')); } 
    }; 
    reader.readAsText(file); e.target.value = ''; 
  };
  
  const handleResetData = async () => { AudioManager.playClick(); setIsResetting(true); try { await StorageManager.resetAll(); } catch (e) { console.error(e); } window.location.href = window.location.origin + window.location.pathname; };

  const formatTime = (totalSec: number) => { const h = Math.floor(totalSec / 3600); const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0'); const s = (totalSec % 60).toString().padStart(2, '0'); if (h > 0) return `${h}:${m}:${s}`; return `${m}:${s}`; };
  const formatLogDate = (timestamp: number) => { const d = new Date(timestamp); return `${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`; };
  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { setTimeout(() => { e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 300); };

  // 🌟 极度精简后的战报触发函数
  const triggerShareCard = async (model: Model, totalTime: number) => {
    AudioManager.playClick();
    showToast(isZh ? '🎨 正在渲染专属战报...' : '🎨 Rendering report...');

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    let newWindow: Window | null = null;

    if (isMobile) {
      newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`<html><head><title>生成中...</title></head><body style="background:#1e1e1e;color:#fff;display:flex;justify-content:center;align-items:center;height:100vh;"><h1>⏳ 正在生成战报...</h1></body></html>`);
      } else {
        showToast(isZh ? '❌ 浏览器拦截了新窗口，请允许弹窗' : '❌ Popup blocked');
        return;
      }
    }

    try {
      const url = await generateShareCard({
        model, totalTime, isZh, username, level, currentBot, equippedTitle, formatTime, t
      });

      if (isMobile && newWindow) {
        newWindow.document.open();
        newWindow.document.write(`<html><body style="margin:0;background:#000;display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;"><img src="${url}" style="max-width:100%;max-height:85vh;" /><p style="color:#fff;margin-top:20px;">📸 请长按图片保存</p></body></html>`);
        newWindow.document.close();
      } else {
        const a = document.createElement('a'); a.href = url; a.download = `ModelVault_${model.name.en.replace(/\s+/g, '_')}.jpg`; a.click();
        showToast(isZh ? '✅ 战报已保存' : '✅ Report saved!');
      }
    } catch (err) {
      console.error(err);
      showToast(isZh ? '❌ 生成战报失败' : '❌ Failed');
      if (newWindow) newWindow.close();
    }
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

  const equippedTitleDef = UserManager.getTitleLibrary().find(t => t.id === equippedTitle);

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
    setBgMain, setBgPip, StorageManager, level, levelProgress, todayTotal, isCheckedIn, checkinStreak, handleCheckin,
    currentBot, webChatInterval, setWebChatInterval, pipChatInterval, setPipChatInterval,
    chatMessages,
    storageEstimate, isAutoBackupEnabled, setIsAutoBackupEnabled, isAssetsMounted, setIsAssetsMounted,
    setActiveTab, ambientType, setAmbientType,
    handleOpenPiP,
    equippedTitleDef,
    generateShareCard: triggerShareCard // 🌟 替换为调用抽离后的函数
  };

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      {showTutorial && !showSplash && (
        <TutorialTour 
          steps={tutorialSteps} 
          onClose={() => {
            setShowTutorial(false);
            localStorage.setItem('hasSeenTutorial', 'true');
          }} 
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
              onClick={() => { AudioManager.playClick(); setShowTutorial(true); }} 
              style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#3b82f6', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="新手教程"
            >?</button>
            <button className="lang-btn" onClick={toggleLanguage}>{isZh ? 'EN' : '中'}</button>
          </div>

          {!viewingModel && (
            <div className="tabs">
              <button id="tab-focus" className={`tab ${activeTab === 'focus' ? 'active' : ''}`} onClick={() => handleTabChange('focus')}>⏱ {t('focus')}</button>
              <button id="tab-journal" className={`tab ${activeTab === 'journal' ? 'active' : ''}`} onClick={() => handleTabChange('journal')}>📖 {t('journal')}</button>
              <button id="tab-hangar" className={`tab ${activeTab === 'hangar' ? 'active' : ''}`} onClick={() => handleTabChange('hangar')}>📦 {t('hangar')}</button>
              <button id="tab-gundam" className={`tab ${activeTab === 'gundam' ? 'active' : ''}`} onClick={() => handleTabChange('gundam')}>🤖 {isZh ? '机体' : 'Mecha'}</button>
              <button id="tab-gallery" className={`tab ${activeTab === 'gallery' ? 'active' : ''}`} onClick={() => handleTabChange('gallery')}>👥 {isZh ? '塑灵' : 'Animold'}</button>
              <button id="tab-profile" className={`tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => handleTabChange('profile')}>👤 {t('profile')}</button>
            </div>
          )}

          {viewingModel && (
            <div className="profile-topbar">
              <button className="back-btn" onClick={() => { AudioManager.playClick(); setViewingModelId(null); setIsEditingCover(false); setIsEditingImportedStatus(false); setShowRebuildConfirm(false); }}>← {t('backToHangar')}</button>
              <div className="top-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {confirmDeleteId === viewingModel.id ? (
                  <>
                    <button className="mini-btn" style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }} onClick={() => { handleDeleteModel(viewingModel.id); setConfirmDeleteId(null); }}>{isZh ? '确认删除' : 'Confirm'}</button>
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
                {...commonProps} // 删除了显式传入的 generateShareCard，因为 commonProps 里已经有了
              />
            ) : (
              <>
                {activeTab === 'focus' && <FocusView {...commonProps} />}
                {activeTab === 'journal' && <JournalView {...commonProps} />}
                {activeTab === 'hangar' && <HangarView {...commonProps} />}
                {activeTab === 'gundam' && <GundamGalleryView {...commonProps} />} 
                {activeTab === 'gallery' && <BotGalleryView unlockedBots={unlockedBots} currentBot={currentBot} level={level} coins={coinsBalance} checkinStreak={checkinStreak} onUnlock={handleUnlockBot} onEquip={handleEquipBot} i18n={i18n} />}
                {activeTab === 'profile' && <ProfileView {...commonProps} />}
              </>
            )}
          </div>
        </div>

        <Modals showCompleteModelConfirm={showCompleteModelConfirm} setShowCompleteModelConfirm={setShowCompleteModelConfirm} handleConfirmCompleteModel={handleConfirmCompleteModel} isPreviewOpen={isPreviewOpen} setIsPreviewOpen={setIsPreviewOpen} bgMain={bgMain} bgSize={bgSize} bgPosition={bgPosition} setBgSize={setBgSize} setBgPosition={setBgPosition} applyBackground={applyBackground} deferredPrompt={deferredPrompt} setDeferredPrompt={setDeferredPrompt} i18n={i18n} />

        {pendingTabChange && (
          <div className="modal-overlay" style={{ zIndex: 9999 }}>
            <div className="modal-content" style={{ width: '280px', textAlign: 'center' }}>
              <h3 style={{ color: '#f59e0b', fontSize: '18px', marginBottom: '12px' }}>⏱️ {isZh ? '专注中...' : 'Focusing...'}</h3>
              <p style={{ fontSize: '13px', color: '#ccc', lineHeight: '1.5', marginBottom: '16px' }}>
                {isZh ? '你正在进行计时。离开该页面可能会导致注意力分散，确定要离开吗？' : 'Timer is running. Leaving might distract you. Are you sure?'}
              </p>
              <div className="modal-actions" style={{ justifyContent: 'center' }}>
                <button className="btn yes" style={{ flex: 1 }} onClick={() => { setPendingTabChange(null); setActiveTab(pendingTabChange); }}>
                  {isZh ? '确定离开' : 'Leave'}
                </button>
                <button className="btn no" style={{ flex: 1 }} onClick={() => { setPendingTabChange(null); }}>
                  {isZh ? '继续专注' : 'Stay'}
                </button>
              </div>
            </div>
          </div>
        )}

        {pipWindow && createPortal(<FocusPanel {...commonProps} isPip={true} bgImage={bgPip} />, pipWindow.document.body)}
      </div>
    </>
  );
}

export default App;