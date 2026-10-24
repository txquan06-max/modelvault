// src/store/useAppStore.ts
import { create } from 'zustand';
import { ModelManager, type Model, type Task } from '../core/ModelManager';
import { SessionManager } from '../core/SessionManager';
import { StorageManager } from '../core/StorageManager';
import { UserManager } from '../core/UserManager';
import { CheckinManager } from '../core/CheckinManager';
import { BOTS, type BotType, QuoteEngine } from '../core/QuoteEngine';
import { AudioManager } from '../core/AudioManager';

interface AppState {
  // 核心数据
  models: Model[];
  currentModelId: string;
  tasks: Task[];
  currentTaskId: string;
  currentStageId: string | null;

  // 用户数据
  username: string;
  level: number;
  levelProgress: { current: number; next: number; percent: number };
  todayTotal: number;
  coinsBalance: number;
  earnedTitles: string[];
  equippedTitle: string;
  checkinStreak: number;
  isCheckedIn: boolean;
  
  // 塑灵数据
  unlockedBots: BotType[];
  currentBot: BotType;
  
  // 设置与外观
  bgMain: string;
  bgPip: string;
  bgSize: string;
  bgPosition: string;
  audioSettings: any;
  customAudios: any;

  // 计时器状态 (仅存 UI 态，TimerEngine 依然由组件持有以防重渲染丢失)
  timerState: 'Idle' | 'Running' | 'Paused';
  activeSeconds: number;

  // Actions
  refreshData: () => Promise<void>;
  setModels: (models: Model[]) => void;
  setCurrentModelId: (id: string) => void;
  setCurrentTaskId: (id: string) => void;
  setCurrentStageId: (id: string | null) => void;
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
  storageEstimate: any;
}

export const useAppStore = create<AppState>((set, get) => ({
  models: [],
  currentModelId: '',
  tasks: [],
  currentTaskId: '',
  currentStageId: null,

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

  timerState: 'Idle',
  activeSeconds: 0,
  storageEstimate: { usage: 0, quota: 0, percent: 0 },

  refreshData: async () => {
    const xp = ModelManager.getTotalXP();
    const allModels = ModelManager.getAllModels();
    const available = allModels.filter(m => m.status !== 'Completed');
    
    let { currentModelId, currentTaskId, currentStageId } = get();

    // 检查当前模型是否依然有效
    if (available.length > 0) {
      if (!currentModelId || !available.some(m => m.id === currentModelId)) {
        currentModelId = available[0].id;
      }
    } else {
      currentModelId = '';
      currentTaskId = '';
      currentStageId = null;
    }

    // 同步 tasks
    let tasks: Task[] = [];
    if (currentModelId) {
      const model = allModels.find(m => m.id === currentModelId);
      if (model) {
        tasks = model.tasks;
        if (!tasks.some(t => t.id === currentTaskId) && tasks.length > 0) {
          currentTaskId = tasks[0].id;
        }
        
        const task = tasks.find(t => t.id === currentTaskId);
        if (task && !task.stages.some(s => s.id === currentStageId)) {
          const nextStage = task.stages.find(s => s.status !== 'Completed');
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

  setModels: (models) => {
    set({ models });
    // 重新计算当前选中的模型/任务/工序
    get().refreshData();
  },

  setCurrentModelId: (id) => set({ currentModelId: id }),
  setCurrentTaskId: (id) => set({ currentTaskId: id }),
  setCurrentStageId: (id) => set({ currentStageId: id }),

  setUsername: (name) => {
    StorageManager.setUsername(name);
    set({ username: name });
  },

  setBgMain: (url) => { StorageManager.setBgMain(url); set({ bgMain: url }); },
  setBgPip: (url) => { StorageManager.setBgPip(url); set({ bgPip: url }); },
  setBgSize: (size) => { StorageManager.setBgSize(size); set({ bgSize: size }); },
  setBgPosition: (pos) => { StorageManager.setBgPosition(pos); set({ bgPosition: pos }); },
  setCoinsBalance: (val) => { StorageManager.setCoinsBalance(val); set({ coinsBalance: val }); },
  setEarnedTitles: (titles) => { StorageManager.setEarnedTitles(titles); set({ earnedTitles: titles }); },
  setEquippedTitle: (title) => { StorageManager.setEquippedTitle(title); set({ equippedTitle: title }); },
  
  setCurrentBot: (bot) => {
    StorageManager.setCurrentBot(bot);
    QuoteEngine.setBot(bot);
    set({ currentBot: bot });
  },
  
  setUnlockedBots: (bots) => {
    StorageManager.setUnlockedBots(bots);
    set({ unlockedBots: bots });
  },

  setAudioSettings: (settings) => { StorageManager.setAudioSettings(settings); set({ audioSettings: settings }); },
  setCustomAudios: (audios) => { StorageManager.setCustomAudios(audios); set({ customAudios: audios }); },
  setStorageEstimate: (est) => set({ storageEstimate: est }),
}));