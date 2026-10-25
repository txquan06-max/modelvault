// src/store/useAppStore.ts
import { create } from 'zustand';
import { ModelManager, type Model, type Task } from '../core/ModelManager';
import { SessionManager } from '../core/SessionManager';
import { StorageManager } from '../core/StorageManager';
import { UserManager } from '../core/UserManager';
import { CheckinManager } from '../core/CheckinManager';
import { DailyQuestManager } from '../core/DailyQuestManager';
import { QuoteEngine, type BotType } from '../core/QuoteEngine';
import { AudioManager, type AmbientType } from '../core/AudioManager';
import { TimerEngine } from '../core/TimerEngine';
import i18n from '../i18n';

// ==================== 模块级单例 ====================
const engine = new TimerEngine();
let toastTimer: any = null;

export interface ChatMessage {
  id: string;
  botId: BotType;
  text: string;
  timestamp: number;
}

export type MainTab = 'focus' | 'journal' | 'hangar' | 'gallery' | 'gundam' | 'profile';

interface AppState {
  // 模型
  models: Model[];
  currentModelId: string;
  tasks: Task[];
  currentTaskId: string;
  currentStageId: string | null;

  // UI 跳转
  viewingModelId: string | null;
  expandedTaskId: string | null;

  // Toast
  toastMsg: string | null;

  // Timer
  timerState: 'Idle' | 'Running' | 'Paused';
  activeSeconds: number;
  lastSession: { duration: number; stageId: string | null } | null;
  timeboxTarget: number;
  hasPlayedTimeboxSound: boolean;

  // 完成模型确认弹窗
  showCompleteModelConfirm: boolean;
  completeModelId: string | null;

  // Chat
  chatMessages: ChatMessage[];

  // Ambient
  ambientType: AmbientType;

  // 备份
  isAutoBackupEnabled: boolean;

  // 用户
  username: string;
  level: number;
  levelProgress: { current: number; next: number; percent: number };
  todayTotal: number;
  coinsBalance: number;
  earnedTitles: string[];
  equippedTitle: string;
  checkinStreak: number;
  isCheckedIn: boolean;

  // Bot
  unlockedBots: BotType[];
  currentBot: BotType;

  // 背景
  bgMain: string;
  bgPip: string;
  bgSize: string;
  bgPosition: string;

  // 音频
  audioSettings: any;
  customAudios: any;

  // 存储
  storageEstimate: any;

  // Tab & 聊天频率
  activeTab: MainTab;
  webChatInterval: number;
  pipChatInterval: number;
  isAssetsMounted: boolean;

  // ==================== Actions ====================
  refreshData: () => Promise<void>;
  setModels: (models: Model[]) => void;
  setCurrentModelId: (id: string) => void;
  setCurrentTaskId: (id: string) => void;
  setCurrentStageId: (id: string | null) => void;
  setViewingModelId: (id: string | null) => void;
  setExpandedTaskId: (id: string | null) => void;
  showToast: (msg: string) => void;
  setToastMsg: (msg: string | null) => void;

  // Timer actions
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  completeTimer: () => { startedAt: number; endedAt: number; activeSeconds: number } | null;
  tickTimer: () => void;
  confirmStageDone: () => void;
  cancelDone: () => void;
  finishPart: () => { ok: boolean; error?: string };
  confirmFinishPart: (photoUrl: string) => { ok: boolean; error?: string };
  setTimeboxTarget: (min: number) => void;
  setHasPlayedTimeboxSound: (val: boolean) => void;
  confirmCompleteModel: () => void;
  setShowCompleteModelConfirm: (val: boolean) => void;
  setIsAutoBackupEnabled: (val: boolean) => void;
  triggerAutoBackup: () => Promise<void>;
  pushChatMessage: (type: 'start' | 'pause' | 'complete') => void;
  setChatMessages: (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  setAmbientType: (type: AmbientType) => void;

  // 其他 setter
  setUsername: (name: string) => void;
  setBgMain: (url: string) => void;
  setBgPip: (url: string) => void;
  setBgSize: (size: string) => void;
  setBgPosition: (pos: string) => void;
  setCoinsBalance: (val: number) => void;
  setEarnedTitles: (titles: string[]) => void;
  setEquippedTitle: (title: string) => void;
  setCurrentBot: (bot: BotType) => void;
  setUnlockedBots: (bots: BotType[]) => void;
  setAudioSettings: (settings: any) => void;
  setCustomAudios: (audios: any) => void;
  setStorageEstimate: (est: any) => void;
  setTimerState: (state: 'Idle' | 'Running' | 'Paused') => void;
  setActiveSeconds: (sec: number) => void;
  setActiveTab: (tab: MainTab) => void;
  setWebChatInterval: (val: number) => void;
  setPipChatInterval: (val: number) => void;
  setIsAssetsMounted: (val: boolean) => void;
}

export const useAppStore = create<AppState>((set: any, get: any) => ({
  models: [],
  currentModelId: '',
  tasks: [],
  currentTaskId: '',
  currentStageId: null,

  viewingModelId: null,
  expandedTaskId: null,

  toastMsg: null,

  timerState: 'Idle',
  activeSeconds: 0,
  lastSession: null,
  timeboxTarget: StorageManager.getTimeboxTarget(),
  hasPlayedTimeboxSound: false,

  showCompleteModelConfirm: false,
  completeModelId: null,

  chatMessages: (() => {
    try {
      const saved = sessionStorage.getItem('mv_chat_messages');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  })(),

  ambientType: 'none',

  isAutoBackupEnabled: false,

  username: StorageManager.getUsername(),
  level: 1,
  levelProgress: { current: 0, next: 100, percent: 0 },
  todayTotal: 0,
  coinsBalance: 0,
  earnedTitles: [],
  equippedTitle: '',
  checkinStreak: 0,
  isCheckedIn: false,

  unlockedBots: (StorageManager.getUnlockedBots() as BotType[]),
  currentBot: ((StorageManager.getCurrentBot() as BotType) || 'tu'),

  bgMain: StorageManager.getBgMain(),
  bgPip: StorageManager.getBgPip(),
  bgSize: StorageManager.getBgSize(),
  bgPosition: StorageManager.getBgPosition(),
  audioSettings: StorageManager.getAudioSettings(),
  customAudios: StorageManager.getCustomAudios(),
  storageEstimate: { usage: 0, quota: 0, percent: 0 },

  activeTab: 'focus',
  webChatInterval: StorageManager.getWebChatInterval(),
  pipChatInterval: StorageManager.getPipChatInterval(),
  isAssetsMounted: false,

  // ==================== refreshData ====================
  refreshData: async () => {
    const xp = ModelManager.getTotalXP();
    const allModels = ModelManager.getAllModels();
    const available = allModels.filter((m: Model) => m.status !== 'Completed');
    
    let { currentModelId, currentTaskId, currentStageId } = get();

    if (available.length > 0) {
      if (!currentModelId || !available.some((m: Model) => m.id === currentModelId)) {
        currentModelId = available[0].id;
      }
    } else {
      currentModelId = '';
      currentTaskId = '';
      currentStageId = null;
    }

    let tasks: Task[] = [];
    if (currentModelId) {
      const model = allModels.find((m: Model) => m.id === currentModelId);
      if (model) {
        tasks = model.tasks;
        if (!tasks.some((t: Task) => t.id === currentTaskId) && tasks.length > 0) {
          currentTaskId = tasks[0].id;
        }
        
        const task = tasks.find((t: Task) => t.id === currentTaskId);
        if (task && !task.stages.some((s: any) => s.id === currentStageId)) {
          const nextStage = task.stages.find((s: any) => s.status !== 'Completed');
          currentStageId = nextStage ? nextStage.id : (task.stages[0]?.id || null);
        }
      }
    }

    const est = await StorageManager.getStorageEstimate();

    set({
      models: allModels,
      currentModelId,
      tasks,
      currentTaskId,
      currentStageId,
      level: UserManager.getLevel(xp),
      levelProgress: UserManager.getLevelProgress(xp),
      todayTotal: SessionManager.getTodayTotalSeconds(),
      coinsBalance: StorageManager.getCoinsBalance(),
      earnedTitles: StorageManager.getEarnedTitles(),
      equippedTitle: StorageManager.getEquippedTitle(),
      audioSettings: StorageManager.getAudioSettings(),
      customAudios: StorageManager.getCustomAudios(),
      bgMain: StorageManager.getBgMain(),
      bgPip: StorageManager.getBgPip(),
      bgSize: StorageManager.getBgSize(),
      bgPosition: StorageManager.getBgPosition(),
      checkinStreak: StorageManager.getCheckinStreak(),
      isCheckedIn: CheckinManager.isCheckedInToday(),
      storageEstimate: est,
    });
  },

  setModels: (models: Model[]) => {
    set({ models });
    get().refreshData();
  },

  setCurrentModelId: (id: string) => set({ currentModelId: id }),
  setCurrentTaskId: (id: string) => set({ currentTaskId: id }),
  setCurrentStageId: (id: string | null) => set({ currentStageId: id }),
  setViewingModelId: (id: string | null) => set({ viewingModelId: id }),
  setExpandedTaskId: (id: string | null) => set({ expandedTaskId: id }),

  showToast: (msg: string) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toastMsg: msg });
    toastTimer = setTimeout(() => set({ toastMsg: null }), 3000);
  },
  setToastMsg: (msg: string | null) => {
    if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }
    set({ toastMsg: msg });
  },

  // ==================== Timer actions ====================
  startTimer: () => {
    const { currentTaskId, currentStageId } = get();
    if (!currentTaskId) return;
    AudioManager.playStart();
    engine.start();
    const updated = ModelManager.startStage(currentTaskId, currentStageId);
    get().setModels(updated);
    set({ hasPlayedTimeboxSound: false, lastSession: null });
    get().pushChatMessage('start');
  },

  pauseTimer: () => {
    AudioManager.playPause();
    engine.pause();
    get().pushChatMessage('pause');
  },

  resumeTimer: () => {
    AudioManager.playStart();
    engine.resume();
    get().pushChatMessage('start');
  },

  completeTimer: () => {
    const result = engine.complete();
    if (!result) return null;
    if (result.activeSeconds < 10) return null;

    AudioManager.playWakeup();
    const { currentTaskId, currentStageId } = get();
    SessionManager.saveSession({ id: crypto.randomUUID(), taskId: currentTaskId, stageId: currentStageId, ...result });
    DailyQuestManager.updateProgress('focus_time', result.activeSeconds);

    get().refreshData();
    set({ lastSession: { duration: result.activeSeconds, stageId: currentStageId } });
    get().pushChatMessage('complete');
    get().triggerAutoBackup();
    return result;
  },

  tickTimer: () => {
    const secs = engine.getActiveSeconds();
    const state = engine.getState();
    if (secs !== get().activeSeconds || state !== get().timerState) {
      set({ activeSeconds: secs, timerState: state });
    }
  },

  confirmStageDone: () => {
    AudioManager.playStageDone();
    const { currentTaskId, lastSession } = get();
    const updated = ModelManager.completeStage(currentTaskId, lastSession?.stageId || null);
    get().setModels(updated);
    set({ lastSession: null });

    // 检查是否所有部位都完成
    const currentModel = updated.find((m: any) => m.tasks.some((t: any) => t.id === currentTaskId));
    if (currentModel && currentModel.tasks.length > 0 && currentModel.tasks.every((t: any) => t.status === 'Completed') && currentModel.status !== 'Completed') {
      set({ showCompleteModelConfirm: true, completeModelId: currentModel.id });
    }
    get().triggerAutoBackup();
  },

  cancelDone: () => {
    AudioManager.playClick();
    set({ lastSession: null });
  },

  finishPart: () => {
    AudioManager.playClick();
    const { currentTaskId, tasks } = get();
    const assembly = tasks.find((t: any) => t.id === currentTaskId)?.stages.find((s: any) => s.nameKey === 'stage_assembly');
    if (assembly && assembly.status !== 'Completed') {
      return { ok: false, error: 'errorAssemblyRequired' };
    }
    return { ok: true };
  },

  confirmFinishPart: (photoUrl: string) => {
    AudioManager.playFinishPart();
    const { currentTaskId } = get();
    const result = ModelManager.finishTask(currentTaskId, photoUrl);
    if (result.error) return { ok: false, error: result.error };

    DailyQuestManager.updateProgress('complete_part', 1);
    set({ timeboxTarget: 0, hasPlayedTimeboxSound: false });
    get().setModels(result.models);

    // 检查是否所有部位都完成
    const currentModel = result.models.find((m: any) => m.tasks.some((t: any) => t.id === currentTaskId));
    if (currentModel && currentModel.tasks.length > 0 && currentModel.tasks.every((t: any) => t.status === 'Completed') && currentModel.status !== 'Completed') {
      set({ showCompleteModelConfirm: true, completeModelId: currentModel.id });
    }
    get().triggerAutoBackup();
    return { ok: true };
  },

  setTimeboxTarget: (min: number) => {
    AudioManager.playClick();
    set({ timeboxTarget: min * 60, hasPlayedTimeboxSound: false });
  },
  setHasPlayedTimeboxSound: (val: boolean) => set({ hasPlayedTimeboxSound: val }),

  confirmCompleteModel: () => {
    const { completeModelId } = get();
    if (!completeModelId) return;
    AudioManager.playFinishPart();
    const updated = ModelManager.finishModel(completeModelId);
    get().setModels(updated);
    set({ showCompleteModelConfirm: false, completeModelId: null });
    get().showToast(i18n.t('toast_model_finished'));
    get().triggerAutoBackup();
  },
  setShowCompleteModelConfirm: (val: boolean) => set({ showCompleteModelConfirm: val }),

  setIsAutoBackupEnabled: (val: boolean) => set({ isAutoBackupEnabled: val }),

  triggerAutoBackup: async () => {
    if (!get().isAutoBackupEnabled) return;
    const data = StorageManager.exportAll();
    await StorageManager.autoBackupData(data);
  },

  pushChatMessage: (type: 'start' | 'pause' | 'complete') => {
    const { currentBot } = get();
    const lang = i18n.language;
    const text = type === 'start' ? QuoteEngine.getStartQuote(lang)
               : type === 'pause' ? QuoteEngine.getPauseQuote(lang)
               : QuoteEngine.getCompleteQuote(lang);
    set((state: AppState) => ({
      chatMessages: [...state.chatMessages, { id: crypto.randomUUID(), botId: currentBot, text, timestamp: Date.now() }].slice(-5),
    }));
  },

  setChatMessages: (updater) => {
    set((state: AppState) => {
      const next = typeof updater === 'function' ? updater(state.chatMessages) : updater;
      return { chatMessages: next };
    });
  },

  setAmbientType: (type: AmbientType) => set({ ambientType: type }),

  // 其他 setter
  setUsername: (name: string) => { StorageManager.setUsername(name); set({ username: name }); },
  setBgMain: (url: string) => { StorageManager.setBgMain(url); set({ bgMain: url }); },
  setBgPip: (url: string) => { StorageManager.setBgPip(url); set({ bgPip: url }); },
  setBgSize: (size: string) => { StorageManager.setBgSize(size); set({ bgSize: size }); },
  setBgPosition: (pos: string) => { StorageManager.setBgPosition(pos); set({ bgPosition: pos }); },
  setCoinsBalance: (val: number) => { StorageManager.setCoinsBalance(val); set({ coinsBalance: val }); },
  setEarnedTitles: (titles: string[]) => { StorageManager.setEarnedTitles(titles); set({ earnedTitles: titles }); },
  setEquippedTitle: (title: string) => { StorageManager.setEquippedTitle(title); set({ equippedTitle: title }); },
  setCurrentBot: (bot: BotType) => { StorageManager.setCurrentBot(bot); QuoteEngine.setBot(bot); set({ currentBot: bot }); },
  setUnlockedBots: (bots: BotType[]) => { StorageManager.setUnlockedBots(bots); set({ unlockedBots: bots }); },
  setAudioSettings: (settings: any) => { StorageManager.setAudioSettings(settings); set({ audioSettings: settings }); },
  setCustomAudios: (audios: any) => { StorageManager.setCustomAudios(audios); set({ customAudios: audios }); },
  setStorageEstimate: (est: any) => set({ storageEstimate: est }),
  setTimerState: (state: 'Idle' | 'Running' | 'Paused') => set({ timerState: state }),
  setActiveSeconds: (sec: number) => set({ activeSeconds: sec }),
  setActiveTab: (tab: MainTab) => set({ activeTab: tab }),
  setWebChatInterval: (val: number) => { StorageManager.setWebChatInterval(val); set({ webChatInterval: val }); },
  setPipChatInterval: (val: number) => { StorageManager.setPipChatInterval(val); set({ pipChatInterval: val }); },
  setIsAssetsMounted: (val: boolean) => set({ isAssetsMounted: val }),
}));