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
  getAudioSettings: () => JSON.parse(memoryCache[KEYS.AUDIO_SETTINGS] || '{"click":"default","stage":"default","timebox":"default","complete":"default"}'),
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

  importAll: (data: any) => {
    if (!data.version) return false;
    if (data.coreData) StorageManager._set(DATA_KEY, data.coreData);
    Object.entries(KEYS).forEach(([key, storageKey]) => {
      const val = data[key.toLowerCase()];
      if (val) StorageManager._set(storageKey, val);
    });
    return true;
  },

  getStorageUsage: () => {
    let total = 0;
    for (let x in memoryCache) {
      if (memoryCache[x]) total += (memoryCache[x].length * 2);
    }
    return (total / 1024 / 1024).toFixed(2);
  }
};