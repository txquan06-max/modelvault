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
};

interface CoreData {
  schemaVersion: number;
  models: any[];
}

export const StorageManager = {
  getRawStorage(): CoreData {
    const raw = localStorage.getItem(DATA_KEY);
    if (raw) return JSON.parse(raw);
    const legacyV8 = localStorage.getItem('modelvault_data_v8');
    if (legacyV8) {
      const parsedModels = JSON.parse(legacyV8);
      const migratedData = { schemaVersion: CURRENT_SCHEMA_VERSION, models: parsedModels };
      localStorage.setItem(DATA_KEY, JSON.stringify(migratedData));
      localStorage.removeItem('modelvault_data_v8');
      return migratedData;
    }
    return { schemaVersion: CURRENT_SCHEMA_VERSION, models: [] };
  },

  saveRawStorage(models: any[]) {
    const current = this.getRawStorage();
    localStorage.setItem(DATA_KEY, JSON.stringify({ ...current, models }));
  },

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
  getCustomAudios: () => JSON.parse(localStorage.getItem(KEYS.CUSTOM_AUDIOS) || '{}'),
  getBgMain: () => localStorage.getItem(KEYS.BG_IMAGE_MAIN) || '',
  getBgPip: () => localStorage.getItem(KEYS.BG_IMAGE_PIP) || '',
  getBgSize: () => localStorage.getItem(KEYS.BG_SIZE) || 'cover',
  getBgPosition: () => localStorage.getItem(KEYS.BG_POSITION) || 'center',
  getLegacyXP: () => Number(localStorage.getItem(KEYS.LEGACY_XP)) || 0,

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
  setCustomAudios: (val: any) => localStorage.setItem(KEYS.CUSTOM_AUDIOS, JSON.stringify(val)),
  setBgMain: (val: string) => localStorage.setItem(KEYS.BG_IMAGE_MAIN, val),
  setBgPip: (val: string) => localStorage.setItem(KEYS.BG_IMAGE_PIP, val),
  setBgSize: (val: string) => localStorage.setItem(KEYS.BG_SIZE, val),
  setBgPosition: (val: string) => localStorage.setItem(KEYS.BG_POSITION, val),
  setLegacyXP: (val: number) => localStorage.setItem(KEYS.LEGACY_XP, val.toString()),

  exportAll: () => {
    const data: any = { version: 7, coreData: localStorage.getItem(DATA_KEY) };
    Object.entries(KEYS).forEach(([key, storageKey]) => {
      data[key.toLowerCase()] = localStorage.getItem(storageKey);
    });
    return data;
  },

  importAll: (data: any) => {
    if (!data.version) return false;
    if (data.coreData) localStorage.setItem(DATA_KEY, data.coreData);
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