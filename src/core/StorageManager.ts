import localforage from 'localforage';

const CURRENT_SCHEMA_VERSION = 1;
const DATA_KEY = 'modelvault_core_data';

const KEYS = {
  SESSIONS: 'modelvault_sessions',
  ACHIEVEMENTS: 'modelvault_achievements',
  USERNAME: 'mv_username',
  TIMEBOX_TARGET: 'mv_timebox_target',
  TIMEBOX_ELAPSED: 'mv_timebox_elapsed',
  COINS_BALANCE: 'mv_coins_balance',
  COINS_TOTAL_EARNED: 'mv_coins_total_earned',
  EQUIPPED_TITLE: 'mv_equipped_title',
  EARNED_TITLES: 'mv_earned_titles',
  AUDIO_SETTINGS: 'mv_audio_settings',
  CUSTOM_AUDIOS: 'mv_custom_audios',
  BG_IMAGE_MAIN: 'mv_bg_main',
  BG_IMAGE_PIP: 'mv_bg_pip',
  BG_SIZE: 'mv_bg_size',
  BG_POSITION: 'mv_bg_position',
  LEGACY_XP: 'mv_legacy_xp',
  REMINDER_INTERVAL: 'mv_reminder_interval',
};

const DEFAULT_AUDIO = JSON.stringify({
  click: 'default', start: 'default', pause: 'default', complete: 'default',
  finishPart: 'default', stage: 'default', timebox: 'default', achievement: 'default',
});

const memoryCache: Record<string, string> = {};
let isInit = false;

export const StorageManager = {
  async init() {
    if (isInit) return;
    await localforage.config({ name: 'ModelVault', storeName: 'modelvault_store' });

    const legacyKeys = Object.keys(localStorage).filter(k => k.startsWith('mv_') || k === 'modelvault_sessions' || k === 'modelvault_achievements' || k === 'modelvault_core_data');
    if (legacyKeys.length > 0) {
      for (const key of legacyKeys) {
        const val = localStorage.getItem(key);
        if (val) {
          memoryCache[key] = val;
          await localforage.setItem(key, val);
        }
      }
      legacyKeys.forEach(k => localStorage.removeItem(k));
    }

    const keys = await localforage.keys();
    for (const key of keys) {
      const val = await localforage.getItem<string>(key);
      if (val !== null) memoryCache[key] = val;
    }
    isInit = true;
  },

  async _set(key: string, val: string) {
    memoryCache[key] = val;
    try {
      await localforage.setItem(key, val);
    } catch (err) {
      console.error('Storage save failed', err);
      alert('本地存储空间已满，请前往个人页导出备份，并清理部分图片。');
    }
  },

  async resetAll() {
    try {
      await localforage.clear();
      await localforage.dropInstance({ name: 'ModelVault' });
    } catch (e) {
      console.warn('Failed to clear IndexedDB', e);
    }
    localStorage.clear();
    Object.keys(memoryCache).forEach((key) => delete memoryCache[key]);
    isInit = false;
  },

  getRawStorage(): { schemaVersion: number; models: any[] } {
    const raw = memoryCache[DATA_KEY];
    if (raw) return JSON.parse(raw);
    return { schemaVersion: CURRENT_SCHEMA_VERSION, models: [] };
  },

  saveRawStorage(models: any[]) {
    const current = this.getRawStorage();
    this._set(DATA_KEY, JSON.stringify({ ...current, models }));
  },

  getSessions: () => memoryCache[KEYS.SESSIONS] || '[]',
  getAchievements: () => memoryCache[KEYS.ACHIEVEMENTS] || '[]',
  getUsername: () => memoryCache[KEYS.USERNAME] || 'New Builder',
  getTimeboxTarget: () => Number(memoryCache[KEYS.TIMEBOX_TARGET]) || 0,
  getTimeboxElapsed: () => Number(memoryCache[KEYS.TIMEBOX_ELAPSED]) || 0,
  getCoinsBalance: () => Number(memoryCache[KEYS.COINS_BALANCE]) || 0,
  getCoinsTotalEarned: () => Number(memoryCache[KEYS.COINS_TOTAL_EARNED]) || 0,
  getEquippedTitle: () => memoryCache[KEYS.EQUIPPED_TITLE] || '',
  getEarnedTitles: () => JSON.parse(memoryCache[KEYS.EARNED_TITLES] || '[]'),
  getAudioSettings: () => {
    const stored = memoryCache[KEYS.AUDIO_SETTINGS];
    const defaults = JSON.parse(DEFAULT_AUDIO);
    if (!stored) return defaults;
    try { return { ...defaults, ...JSON.parse(stored) }; } catch { return defaults; }
  },
  getCustomAudios: () => JSON.parse(memoryCache[KEYS.CUSTOM_AUDIOS] || '{}'),
  getBgMain: () => memoryCache[KEYS.BG_IMAGE_MAIN] || '',
  getBgPip: () => memoryCache[KEYS.BG_IMAGE_PIP] || '',
  getBgSize: () => memoryCache[KEYS.BG_SIZE] || 'cover',
  getBgPosition: () => memoryCache[KEYS.BG_POSITION] || 'center',
  getLegacyXP: () => Number(memoryCache[KEYS.LEGACY_XP]) || 0,
  getReminderInterval: () => Number(memoryCache[KEYS.REMINDER_INTERVAL]) || 0,

  setSessions: (data: string) => StorageManager._set(KEYS.SESSIONS, data),
  setAchievements: (data: string) => StorageManager._set(KEYS.ACHIEVEMENTS, data),
  setUsername: (data: string) => StorageManager._set(KEYS.USERNAME, data),
  setTimeboxTarget: (data: number) => StorageManager._set(KEYS.TIMEBOX_TARGET, data.toString()),
  setTimeboxElapsed: (data: number) => StorageManager._set(KEYS.TIMEBOX_ELAPSED, data.toString()),
  setCoinsBalance: (val: number) => StorageManager._set(KEYS.COINS_BALANCE, val.toString()),
  setCoinsTotalEarned: (val: number) => StorageManager._set(KEYS.COINS_TOTAL_EARNED, val.toString()),
  setEquippedTitle: (val: string) => StorageManager._set(KEYS.EQUIPPED_TITLE, val),
  setEarnedTitles: (val: string[]) => StorageManager._set(KEYS.EARNED_TITLES, JSON.stringify(val)),
  setAudioSettings: (val: any) => StorageManager._set(KEYS.AUDIO_SETTINGS, JSON.stringify(val)),
  setCustomAudios: (val: any) => StorageManager._set(KEYS.CUSTOM_AUDIOS, JSON.stringify(val)),
  setBgMain: (val: string) => StorageManager._set(KEYS.BG_IMAGE_MAIN, val),
  setBgPip: (val: string) => StorageManager._set(KEYS.BG_IMAGE_PIP, val),
  setBgSize: (val: string) => StorageManager._set(KEYS.BG_SIZE, val),
  setBgPosition: (val: string) => StorageManager._set(KEYS.BG_POSITION, val),
  setLegacyXP: (val: number) => StorageManager._set(KEYS.LEGACY_XP, val.toString()),
  setReminderInterval: (val: number) => StorageManager._set(KEYS.REMINDER_INTERVAL, val.toString()),

  exportAll: () => {
    const data: any = { version: 8, coreData: memoryCache[DATA_KEY] || null };
    Object.entries(KEYS).forEach(([key, storageKey]) => {
      data[key.toLowerCase()] = memoryCache[storageKey] || null;
    });
    return data;
  },

  // 🌟 改为普通函数写法，解决 this 可能为 undefined 的问题
  importAll(data: any) {
    if (!data || !data.version) return false;
    
    try {
      // 1. 合并核心模型数据
      const coreDataRaw = data.coreData;
      if (coreDataRaw) {
        const importedCore = typeof coreDataRaw === 'string' ? JSON.parse(coreDataRaw) : coreDataRaw;
        if (importedCore && Array.isArray(importedCore.models)) {
          
          // 使用 StorageManager 代替 this，彻底消除 TS 警告
          const localCore = StorageManager.getRawStorage();
          const localModels = localCore && Array.isArray(localCore.models) ? localCore.models : [];
          
          const localModelIds = new Set<string>();
          for (const m of localModels) {
            if (m && m.id) localModelIds.add(m.id);
          }
          
          const mergedModels = [...localModels];
          for (const importedModel of importedCore.models) {
            if (importedModel && importedModel.id && !localModelIds.has(importedModel.id)) {
              mergedModels.push(importedModel);
            }
          }
          StorageManager.saveRawStorage(mergedModels);
        }
      }

      // 2. 合并 Sessions（时间记录）
      const sessionsRaw = data.sessions;
      if (sessionsRaw) {
        const importedSessions = typeof sessionsRaw === 'string' ? JSON.parse(sessionsRaw) : sessionsRaw;
        if (Array.isArray(importedSessions)) {
          
          const localSessions = JSON.parse(StorageManager.getSessions() || '[]');
          const localSessionIds = new Set<string>();
          
          for (const s of localSessions) {
            if (s && s.id) localSessionIds.add(s.id);
          }
          
          for (const session of importedSessions) {
            if (session && session.id && !localSessionIds.has(session.id)) {
              localSessions.push(session);
            }
          }
          StorageManager.setSessions(JSON.stringify(localSessions));
        }
      }

      // 3. 其他的简单数据按需覆盖
      for (const [key, storageKey] of Object.entries(KEYS)) {
        if (key === 'SESSIONS') continue;
        
        const lowerKey = key.toLowerCase();
        const val = data[lowerKey];
        
        if (val !== undefined && val !== null && typeof val === 'string') {
           StorageManager._set(storageKey, val);
        }
      }

      return true;
    } catch (e) {
      console.error('Import merge failed', e);
      return false;
    }
  },

  getStorageUsage: () => {
    let total = 0;
    for (const x in memoryCache) {
      const val = memoryCache[x];
      if (val) total += (val.length * 2);
    }
    return (total / 1024 / 1024).toFixed(2);
  }
};