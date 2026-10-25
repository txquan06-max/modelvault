// src/store/useAppStore.ts
import { create } from 'zustand';
import { ModelManager, type Model, type Task } from '../core/ModelManager';
import { SessionManager } from '../core/SessionManager';
import { StorageManager } from '../core/StorageManager';
import { UserManager } from '../core/UserManager';
import { CheckinManager } from '../core/CheckinManager';
import { QuoteEngine, type BotType } from '../core/QuoteEngine';

export type MainTab = 'focus' | 'journal' | 'hangar' | 'gallery' | 'gundam' | 'profile';

interface AppState {
  models: Model[];
  currentModelId: string;
  tasks: Task[];
  currentTaskId: string;
  currentStageId: string | null;

  // 🌟 批次 10A：全局 UI 状态迁移（原先在 App.tsx 里 useState）
  // viewingModelId：控制 ModelDetail 详情页是否打开（null = 关闭）
  // expandedTaskId：控制 ModelDetail 内某个 task 是否展开（null = 全部收起）
  viewingModelId: string | null;
  expandedTaskId: string | null;

  username: string;
  level: number;
  levelProgress: { current: number; next: number; percent: number };
  todayTotal: number;
  coinsBalance: number;
  earnedTitles: string[];
  equippedTitle: string;
  checkinStreak: number;
  isCheckedIn: boolean;
  
  unlockedBots: BotType[];
  currentBot: BotType;
  
  bgMain: string;
  bgPip: string;
  bgSize: string;
  bgPosition: string;
  audioSettings: any;
  customAudios: any;
  storageEstimate: any;

  timerState: 'Idle' | 'Running' | 'Paused';
  activeSeconds: number;

  // 🌟 全局 Tab & 聊天频率 & 挂载状态
  activeTab: MainTab;
  webChatInterval: number;
  pipChatInterval: number;
  isAssetsMounted: boolean;

  refreshData: () => Promise<void>;
  setModels: (models: Model[]) => void;
  setCurrentModelId: (id: string) => void;
  setCurrentTaskId: (id: string) => void;
  setCurrentStageId: (id: string | null) => void;
  // 🌟 批次 10A：详情页全局状态 setter
  setViewingModelId: (id: string | null) => void;
  setExpandedTaskId: (id: string | null) => void;
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

  // 🌟 批次 10A：全局 UI 状态初值
  viewingModelId: null,
  expandedTaskId: null,

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

  timerState: 'Idle',
  activeSeconds: 0,

  activeTab: 'focus',
  webChatInterval: StorageManager.getWebChatInterval(),
  pipChatInterval: StorageManager.getPipChatInterval(),
  isAssetsMounted: false,

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
  // 🌟 批次 10A：全局 UI setter
  setViewingModelId: (id: string | null) => set({ viewingModelId: id }),
  setExpandedTaskId: (id: string | null) => set({ expandedTaskId: id }),
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