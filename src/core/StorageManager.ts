import localforage from 'localforage';

const CURRENT_SCHEMA_VERSION = 4;
const DATA_KEY = 'modelvault_core_data';

export const KEYS = {
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
  CHECKIN_STREAK: 'mv_checkin_streak',
  LAST_CHECKIN_DATE: 'mv_last_checkin_date',
  TOTAL_CHECKIN_DAYS: 'mv_total_checkin_days',
  WEB_CHAT_INTERVAL: 'mv_web_chat_interval',
  PIP_CHAT_INTERVAL: 'mv_pip_chat_interval',
};

const DEFAULT_AUDIO = JSON.stringify({
  click: 'default', start: 'default', pause: 'default', complete: 'default',
  finishPart: 'default', stage: 'default', timebox: 'default', achievement: 'default',
});

const memoryCache: Record<string, string> = {};
let isInit = false;

let backupDirHandle: any = null;
let assetsDirHandle: any = null;

export const StorageManager = {
  async init() {
    if (isInit) return;
    await localforage.config({ name: 'ModelVault', storeName: 'modelvault_store' });

    const legacyKeys = Object.keys(localStorage).filter(k => k.startsWith('mv_') || k === 'modelvault_sessions' || k === 'modelvault_achievements' || k === 'modelvault_core_data');
    if (legacyKeys.length > 0) {
      for (const key of legacyKeys) {
        const val = localStorage.getItem(key);
        if (val) { memoryCache[key] = val; await localforage.setItem(key, val); }
      }
      legacyKeys.forEach(k => localStorage.removeItem(k));
    }

    const keys = await localforage.keys();
    for (const key of keys) {
      const val = await localforage.getItem<string>(key);
      if (val !== null) memoryCache[key] = val;
    }

    try {
      const rawData = memoryCache[DATA_KEY];
      if (rawData) {
        const parsed = JSON.parse(rawData);
        const storedVersion = parsed.schemaVersion || 1;
        if (storedVersion < CURRENT_SCHEMA_VERSION) {
          console.log(`🔄 数据迁移: v${storedVersion} -> v${CURRENT_SCHEMA_VERSION}`);
          await localforage.setItem('modelvault_backup_before_migration', rawData);
          let migratedModels = parsed.models || [];
          const newData = { schemaVersion: CURRENT_SCHEMA_VERSION, models: migratedModels };
          memoryCache[DATA_KEY] = JSON.stringify(newData);
          await localforage.setItem(DATA_KEY, JSON.stringify(newData));
        }
      }
    } catch (e) {
      console.error('❌ 数据迁移失败:', e);
    }

    isInit = true;
  },

  async requestPersistentStorage() {
    if (navigator.storage && navigator.storage.persist) {
      return await navigator.storage.persist();
    }
    return false;
  },

  async getStorageEstimate() {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const usage = (estimate.usage || 0) / (1024 * 1024 * 1024);
      const quota = (estimate.quota || 0) / (1024 * 1024 * 1024);
      return { usage: Number(usage.toFixed(2)), quota: Number(quota.toFixed(2)), percent: quota > 0 ? (usage / quota) * 100 : 0 };
    }
    return { usage: 0, quota: 0, percent: 0 };
  },

  async selectBackupFolder() {
    if (!('showDirectoryPicker' in window)) return false;
    try {
      backupDirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      return true;
    } catch (err) { return false; }
  },

  async autoBackupData(data: any) {
    if (!backupDirHandle) return false;
    try {
      if (await backupDirHandle.queryPermission({ mode: 'readwrite' }) !== 'granted') {
        if (await backupDirHandle.requestPermission({ mode: 'readwrite' }) !== 'granted') return false;
      }
      const fileHandle = await backupDirHandle.getFileHandle('modelvault_auto_backup.json', { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      return true;
    } catch (err) { return false; }
  },

  async selectAssetsFolder() {
    if (!('showDirectoryPicker' in window)) return false;
    try {
      assetsDirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      return true;
    } catch (err) { return false; }
  },

  async saveFileToLocal(filename: string, blob: Blob) {
    if (!assetsDirHandle) return null;
    try {
      if (await assetsDirHandle.queryPermission({ mode: 'readwrite' }) !== 'granted') {
        if (await assetsDirHandle.requestPermission({ mode: 'readwrite' }) !== 'granted') return null;
      }
      const fileHandle = await assetsDirHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return `local://${filename}`;
    } catch (err) { return null; }
  },

  async loadLocalFileUrl(filename: string) {
    if (!assetsDirHandle) return null;
    try {
      const cleanFilename = filename.replace('local://', '');
      const fileHandle = await assetsDirHandle.getFileHandle(cleanFilename);
      const file = await fileHandle.getFile();
      return URL.createObjectURL(file);
    } catch (err) { return null; }
  },

  async _set(key: string, val: string) {
    memoryCache[key] = val;
    try { await localforage.setItem(key, val); } catch (err) { console.error('Storage save failed', err); alert('本地存储空间已满。'); }
  },

  async resetAll() {
    try { await localforage.clear(); await localforage.dropInstance({ name: 'ModelVault' }); } catch (e) { console.warn(e); }
    localStorage.clear();
    Object.keys(memoryCache).forEach((key) => delete memoryCache[key]);
    isInit = false;
  },

  getRawStorage(): { schemaVersion: number; models: any[] } {
    const raw = memoryCache[DATA_KEY];
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return { schemaVersion: parsed.schemaVersion || CURRENT_SCHEMA_VERSION, models: Array.isArray(parsed.models) ? parsed.models : [] };
      } catch (e) { return { schemaVersion: CURRENT_SCHEMA_VERSION, models: [] }; }
    }
    return { schemaVersion: CURRENT_SCHEMA_VERSION, models: [] };
  },

  saveRawStorage(models: any[]) {
    const current = StorageManager.getRawStorage();
    StorageManager._set(DATA_KEY, JSON.stringify({ ...current, models }));
  },

  getSessions: () => memoryCache[KEYS.SESSIONS] || '[]',
  getAchievements: () => memoryCache[KEYS.ACHIEVEMENTS] || '[]',
  getUsername: () => memoryCache[KEYS.USERNAME] || 'New Builder',
  getTimeboxTarget: () => Number(memoryCache[KEYS.TIMEBOX_TARGET]) || 0,
  getTimeboxElapsed: () => Number(memoryCache[KEYS.TIMEBOX_ELAPSED]) || 0,
  getCoinsBalance: () => Number(memoryCache[KEYS.COINS_BALANCE]) || 0,
  getCoinsTotalEarned: () => Number(memoryCache[KEYS.COINS_TOTAL_EARNED]) || 0,
  getEquippedTitle: () => memoryCache[KEYS.EQUIPPED_TITLE] || '',
  getEarnedTitles: () => { try { return JSON.parse(memoryCache[KEYS.EARNED_TITLES] || '[]'); } catch { return []; } },
  getAudioSettings: () => {
    const stored = memoryCache[KEYS.AUDIO_SETTINGS];
    const defaults = JSON.parse(DEFAULT_AUDIO);
    if (!stored) return defaults;
    try { return { ...defaults, ...JSON.parse(stored) }; } catch { return defaults; }
  },
  getCustomAudios: () => { try { return JSON.parse(memoryCache[KEYS.CUSTOM_AUDIOS] || '{}'); } catch { return {}; } },
  getBgMain: () => memoryCache[KEYS.BG_IMAGE_MAIN] || '',
  getBgPip: () => memoryCache[KEYS.BG_IMAGE_PIP] || '',
  getBgSize: () => memoryCache[KEYS.BG_SIZE] || 'cover',
  getBgPosition: () => memoryCache[KEYS.BG_POSITION] || 'center',
  getLegacyXP: () => Number(memoryCache[KEYS.LEGACY_XP]) || 0,
  getReminderInterval: () => Number(memoryCache[KEYS.REMINDER_INTERVAL]) || 0,
  getCheckinStreak: () => Number(memoryCache[KEYS.CHECKIN_STREAK]) || 0,
  getLastCheckinDate: () => memoryCache[KEYS.LAST_CHECKIN_DATE] || '',
  getTotalCheckinDays: () => Number(memoryCache[KEYS.TOTAL_CHECKIN_DAYS]) || 0,
  getWebChatInterval: () => Number(memoryCache[KEYS.WEB_CHAT_INTERVAL]) || 8000,
  getPipChatInterval: () => Number(memoryCache[KEYS.PIP_CHAT_INTERVAL]) || 60000,

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
  setCheckinStreak: (val: number) => StorageManager._set(KEYS.CHECKIN_STREAK, val.toString()),
  setLastCheckinDate: (val: string) => StorageManager._set(KEYS.LAST_CHECKIN_DATE, val),
  setTotalCheckinDays: (val: number) => StorageManager._set(KEYS.TOTAL_CHECKIN_DAYS, val.toString()),
  setWebChatInterval: (val: number) => StorageManager._set(KEYS.WEB_CHAT_INTERVAL, val.toString()),
  setPipChatInterval: (val: number) => StorageManager._set(KEYS.PIP_CHAT_INTERVAL, val.toString()),

  exportAll: () => {
    const data: any = { version: CURRENT_SCHEMA_VERSION, exportDate: new Date().toISOString(), coreData: memoryCache[DATA_KEY] || null };
    Object.keys(memoryCache).forEach(key => {
      if (key.startsWith('mv_') || key === 'modelvault_sessions' || key === 'modelvault_achievements') data[key] = memoryCache[key];
    });
    return data;
  },

  importAll: async (data: any) => {
    if (!data || !data.coreData) return false;
    try {
      await localforage.clear();
      Object.keys(memoryCache).forEach(key => delete memoryCache[key]);

      if (typeof data.coreData === 'string') await localforage.setItem(DATA_KEY, data.coreData);
      else await localforage.setItem(DATA_KEY, JSON.stringify(data.coreData));

      Object.keys(data).forEach(async (key) => {
        if (key !== 'version' && key !== 'exportDate' && key !== 'coreData') {
          const val = data[key];
          if (val !== undefined && val !== null && typeof val === 'string') await localforage.setItem(key, val);
        }
      });

      isInit = false;
      await StorageManager.init(); 
      return true;
    } catch (e) { return false; }
  },

  getStorageUsage: () => {
    let total = 0;
    for (const x in memoryCache) { const val = memoryCache[x]; if (val) total += (val.length * 2); }
    return (total / 1024 / 1024).toFixed(2);
  }
};