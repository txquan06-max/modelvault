// 当前最新的数据结构版本
const CURRENT_SCHEMA_VERSION = 1;
// 统一的存储键名
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
  BG_IMAGE: 'mv_bg_image',
  LEGACY_XP: 'mv_legacy_xp',
  LEGACY_IMPORTED: 'mv_legacy_imported',
};

// 数据结构：{ schemaVersion: 1, models: [...] }
interface CoreData {
  schemaVersion: number;
  models: any[];
}

export const StorageManager = {
  // ---- 核心数据读取，带旧版本兼容 ----
  getRawStorage(): CoreData {
    // 1. 尝试读取最新的统一键名
    const raw = localStorage.getItem(DATA_KEY);
    if (raw) {
      return JSON.parse(raw);
    }

    // 2. 兼容读取你当前的 v8 数据
    const legacyV8 = localStorage.getItem('modelvault_data_v8');
    if (legacyV8) {
      console.log('检测到旧版 v8 数据，正在自动迁移...');
      const parsedModels = JSON.parse(legacyV8);
      const migratedData: CoreData = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        models: parsedModels
      };
      // 存为新格式
      localStorage.setItem(DATA_KEY, JSON.stringify(migratedData));
      // 清理旧数据（也可以注释掉这行，保留一份备份）
      localStorage.removeItem('modelvault_data_v8');
      return migratedData;
    }

    // 3. 全新用户
    return { schemaVersion: CURRENT_SCHEMA_VERSION, models: [] };
  },

  saveRawStorage(models: any[]) {
    const current = this.getRawStorage();
    const newData: CoreData = {
      ...current,
      models
    };
    localStorage.setItem(DATA_KEY, JSON.stringify(newData));
  },

  // ---- 辅助数据 ----
  getSessions: () => localStorage.getItem(KEYS.SESSIONS),
  getAchievements: () => localStorage.getItem(KEYS.ACHIEVEMENTS),
  getUsername: () => localStorage.getItem(KEYS.USERNAME) || 'New Builder',
  getTimeboxTarget: () => Number(localStorage.getItem(KEYS.TIMEBOX_TARGET)) || 0,
  getTimeboxElapsed: () => Number(localStorage.getItem(KEYS.TIMEBOX_ELAPSED)) || 0,
  getCoinsBalance: () => Number(localStorage.getItem(KEYS.COINS_BALANCE)) || 0,
  getCoinsTotalEarned: () => Number(localStorage.getItem(KEYS.COINS_TOTAL_EARNED)) || 0,
  getEquippedTitle: () => localStorage.getItem(KEYS.EQUIPPED_TITLE) || '',
  getEarnedTitles: () => JSON.parse(localStorage.getItem(KEYS.EARNED_TITLES) || '[]'),
  getAudioSettings: () => JSON.parse(localStorage.getItem(KEYS.AUDIO_SETTINGS) || '{"click":"default","stage":"default","timebox":"default","complete":"default"}'),
  getBgImage: () => localStorage.getItem(KEYS.BG_IMAGE) || '',
  getLegacyXP: () => Number(localStorage.getItem(KEYS.LEGACY_XP)) || 0,
  isLegacyImported: () => localStorage.getItem(KEYS.LEGACY_IMPORTED) === 'true',

  setSessions: (data: string) => localStorage.setItem(KEYS.SESSIONS, data),
  setAchievements: (data: string) => localStorage.setItem(KEYS.ACHIEVEMENTS, data),
  setUsername: (data: string) => localStorage.setItem(KEYS.USERNAME, data),
  setTimeboxTarget: (data: number) => localStorage.setItem(KEYS.TIMEBOX_TARGET, data.toString()),
  setTimeboxElapsed: (data: number) => localStorage.setItem(KEYS.TIMEBOX_ELAPSED, data.toString()),
  setCoinsBalance: (val: number) => localStorage.setItem(KEYS.COINS_BALANCE, val.toString()),
  setCoinsTotalEarned: (val: number) => localStorage.setItem(KEYS.COINS_TOTAL_EARNED, val.toString()),
  setEquippedTitle: (val: string) => localStorage.setItem(KEYS.EQUIPPED_TITLE, val),
  setEarnedTitles: (val: string[]) => localStorage.setItem(KEYS.EARNED_TITLES, JSON.stringify(val)),
  setAudioSettings: (val: any) => localStorage.setItem(KEYS.AUDIO_SETTINGS, JSON.stringify(val)),
  setBgImage: (val: string) => localStorage.setItem(KEYS.BG_IMAGE, val),
  setLegacyXP: (val: number) => localStorage.setItem(KEYS.LEGACY_XP, val.toString()),
  setLegacyImported: () => localStorage.setItem(KEYS.LEGACY_IMPORTED, 'true'),

  exportAll: () => {
    const data: any = { version: 4, coreData: localStorage.getItem(DATA_KEY) };
    Object.entries(KEYS).forEach(([key, storageKey]) => {
      data[key.toLowerCase()] = localStorage.getItem(storageKey);
    });
    return data;
  },

  importAll: (data: any) => {
    if (!data.version) return false;
    if (data.coreData) localStorage.setItem(DATA_KEY, data.coredata); // 兼容旧版导入
    Object.entries(KEYS).forEach(([key, storageKey]) => {
      const val = data[key.toLowerCase()];
      if (val) localStorage.setItem(storageKey, val);
    });
    return true;
  },

  getStorageUsage: () => {
    let total = 0;
    for (let x in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, x)) total += (localStorage[x].length * 2);
    }
    return (total / 1024 / 1024).toFixed(2);
  }
};