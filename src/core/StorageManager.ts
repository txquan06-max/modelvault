// src/core/StorageManager.ts
import localforage from 'localforage';
import { MigrationManager, CURRENT_SCHEMA_VERSION } from './MigrationManager';

const DATA_KEY = 'modelvault_core_data';
const SNAPSHOT_PREFIX = 'modelvault_snapshot_';
const SNAPSHOT_MIN_INTERVAL = 10 * 60 * 1000; // 快照最小间隔：10 分钟

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
  CUSTOM_WAKEUP_SOUND: 'mv_custom_wakeup_sound',
  DAILY_QUESTS: 'mv_daily_quests_data',
  UNLOCKED_BOTS: 'mv_unlocked_bots_v2',
  CURRENT_BOT: 'mv_current_bot_v2',
};

const DEFAULT_AUDIO = JSON.stringify({
  click: 'default', start: 'default', pause: 'default', complete: 'default',
  finishPart: 'default', stage: 'default', timebox: 'default', achievement: 'default', typing: 'default',
});

const memoryCache: Record<string, string> = {};
let isInit = false;

// 🌟 文件系统句柄
let backupDirHandle: any = null;
let assetsDirHandle: any = null;
let assetsDirPath: string | null = null; // Tauri 原生路径

const localUrlCache = new Map<string, { url: string, lastAccess: number }>();
const MAX_URL_CACHE_SIZE = 50;

let lastSnapshotAt = 0;

// 🌟 判断是否为 Tauri 环境
const isTauriEnv = () => typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__;

export const StorageManager = {
  async init() {
    if (isInit) return;
    await localforage.config({ name: 'ModelVault', storeName: 'modelvault_store' });

    // 1. 迁移 localStorage 遗留数据到 localforage
    const legacyKeys = Object.keys(localStorage).filter(
      (k) => k.startsWith('mv_') || k === 'modelvault_sessions' || k === 'modelvault_achievements' || k === 'modelvault_core_data'
    );
    if (legacyKeys.length > 0) {
      for (const key of legacyKeys) {
        const val = localStorage.getItem(key);
        if (val) {
          memoryCache[key] = val;
          await localforage.setItem(key, val);
        }
      }
      legacyKeys.forEach((k) => localStorage.removeItem(k));
    }

    // 2. 迁移旧版 localStorage 中的塑灵状态
    const legacyUnlocked = localStorage.getItem('mv_unlocked_bots');
    if (legacyUnlocked && !memoryCache[KEYS.UNLOCKED_BOTS]) {
      memoryCache[KEYS.UNLOCKED_BOTS] = legacyUnlocked;
      await localforage.setItem(KEYS.UNLOCKED_BOTS, legacyUnlocked);
      localStorage.removeItem('mv_unlocked_bots');
    }
    const legacyCurrent = localStorage.getItem('mv_current_bot');
    if (legacyCurrent && !memoryCache[KEYS.CURRENT_BOT]) {
      memoryCache[KEYS.CURRENT_BOT] = legacyCurrent;
      await localforage.setItem(KEYS.CURRENT_BOT, legacyCurrent);
      localStorage.removeItem('mv_current_bot');
    }

    // 3. 从 localforage 加载所有数据到内存
    const keys = await localforage.keys();
    for (const key of keys) {
      const val = await localforage.getItem<string>(key);
      if (val !== null) memoryCache[key] = val;
    }

    // 4. 使用 MigrationManager 进行 schema 迁移
    try {
      const rawData = memoryCache[DATA_KEY];
      if (rawData) {
        const parsed = JSON.parse(rawData);
        const migrated = await MigrationManager.migrate(parsed, async (backupStr) => {
          await localforage.setItem('modelvault_backup_before_migration', backupStr);
        });
        
        if (migrated.schemaVersion !== parsed.schemaVersion) {
          const newDataStr = JSON.stringify(migrated);
          memoryCache[DATA_KEY] = newDataStr;
          await localforage.setItem(DATA_KEY, newDataStr);
          console.log(`✅ 数据已迁移至 v${CURRENT_SCHEMA_VERSION}`);
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
      return {
        usage: Number(usage.toFixed(2)),
        quota: Number(quota.toFixed(2)),
        percent: quota > 0 ? (usage / quota) * 100 : 0,
      };
    }
    return { usage: 0, quota: 0, percent: 0 };
  },

  async selectBackupFolder() {
    if (isTauriEnv()) return false; // Tauri 下直接使用自动备份逻辑，无需选取
    if (!('showDirectoryPicker' in window)) return false;
    try {
      backupDirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      return true;
    } catch (err) { return false; }
  },

  async autoBackupData(data: any) {
    if (!backupDirHandle) return false;
    try {
      if ((await backupDirHandle.queryPermission({ mode: 'readwrite' })) !== 'granted') {
        if ((await backupDirHandle.requestPermission({ mode: 'readwrite' })) !== 'granted') return false;
      }
      const fileHandle = await backupDirHandle.getFileHandle('modelvault_auto_backup.json', { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      return true;
    } catch (err) { return false; }
  },

  // 🌟 选择素材文件夹（适配 Tauri 与 Web）
  async selectAssetsFolder() {
    if (isTauriEnv()) {
      try {
        const { open } = await import('@tauri-apps/plugin-dialog');
        const selected = await open({ directory: true, multiple: false });
        if (selected && typeof selected === 'string') {
          assetsDirPath = selected;
          return true;
        }
        return false;
      } catch (err) {
        console.error('Tauri folder selection failed', err);
        return false;
      }
    }
    
    // Web Fallback
    if (!('showDirectoryPicker' in window)) return false;
    try {
      assetsDirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      return true;
    } catch (err) { return false; }
  },

  // 🌟 保存文件到本地（适配 Tauri 与 Web）
  async saveFileToLocal(filename: string, blob: Blob) {
    if (isTauriEnv() && assetsDirPath) {
      try {
        const { writeFile } = await import('@tauri-apps/plugin-fs');
        const { join } = await import('@tauri-apps/api/path');
        const filePath = await join(assetsDirPath, filename);
        const buffer = await blob.arrayBuffer();
        await writeFile(filePath, new Uint8Array(buffer));
        return `local://${filename}`;
      } catch (err) {
        console.error('Tauri write file failed', err);
        return null;
      }
    }

    if (!assetsDirHandle) return null;
    try {
      if ((await assetsDirHandle.queryPermission({ mode: 'readwrite' })) !== 'granted') {
        if ((await assetsDirHandle.requestPermission({ mode: 'readwrite' })) !== 'granted') return null;
      }
      const fileHandle = await assetsDirHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return `local://${filename}`;
    } catch (err) { return null; }
  },

  // 🌟 加载本地文件（适配 Tauri 与 Web）
  async loadLocalFileUrl(filename: string) {
    const cached = localUrlCache.get(filename);
    if (cached) {
      cached.lastAccess = Date.now();
      return cached.url;
    }

    const cleanFilename = filename.replace('local://', '');
    let url: string | null = null;

    if (isTauriEnv() && assetsDirPath) {
      try {
        const { readFile } = await import('@tauri-apps/plugin-fs');
        const { join } = await import('@tauri-apps/api/path');
        const filePath = await join(assetsDirPath, cleanFilename);
        const contents = await readFile(filePath);
        const blob = new Blob([contents]);
        url = URL.createObjectURL(blob);
      } catch (err) {
        console.warn('Tauri read file failed', err);
      }
    } else if (assetsDirHandle) {
      try {
        const fileHandle = await assetsDirHandle.getFileHandle(cleanFilename);
        const file = await fileHandle.getFile();
        url = URL.createObjectURL(file);
      } catch (err) {
        console.warn('Web read file failed', err);
      }
    }

    if (url) {
      if (localUrlCache.size >= MAX_URL_CACHE_SIZE) {
        let oldestKey = '';
        let oldestTime = Infinity;
        for (const [key, val] of localUrlCache.entries()) {
          if (val.lastAccess < oldestTime) {
            oldestTime = val.lastAccess;
            oldestKey = key;
          }
        }
        if (oldestKey) {
          URL.revokeObjectURL(localUrlCache.get(oldestKey)!.url);
          localUrlCache.delete(oldestKey);
        }
      }
      localUrlCache.set(filename, { url, lastAccess: Date.now() });
      return url;
    }
    return null;
  },

  async _set(key: string, val: string) {
    if (key === DATA_KEY && memoryCache[DATA_KEY]) {
      const now = Date.now();
      if (now - lastSnapshotAt >= SNAPSHOT_MIN_INTERVAL) {
        try {
          for (let i = 4; i >= 1; i--) {
            const prevSnapshot = memoryCache[`${SNAPSHOT_PREFIX}${i}`];
            if (prevSnapshot) {
              memoryCache[`${SNAPSHOT_PREFIX}${i + 1}`] = prevSnapshot;
              await localforage.setItem(`${SNAPSHOT_PREFIX}${i + 1}`, prevSnapshot);
            }
          }
          const currentData = memoryCache[DATA_KEY];
          let dataWithTs = currentData;
          try {
            const parsed = JSON.parse(currentData);
            parsed._snapshotAt = now;
            dataWithTs = JSON.stringify(parsed);
          } catch {}
          memoryCache[`${SNAPSHOT_PREFIX}1`] = dataWithTs;
          await localforage.setItem(`${SNAPSHOT_PREFIX}1`, dataWithTs);
          lastSnapshotAt = now;
        } catch (e) {
          console.warn('生成快照失败', e);
        }
      }
    }

    memoryCache[key] = val;
    try {
      await localforage.setItem(key, val);
    } catch (err) {
      console.error('Storage save failed:', err);
      window.dispatchEvent(new CustomEvent('mv-storage-error', {
        detail: '⚠️ 本地存储空间可能已满。请前往「个人中心 → 数据扩容」进行清理。'
      }));
    }
  },

  async restoreSnapshot(snapshotIndex: number) {
    const snapshotKey = `${SNAPSHOT_PREFIX}${snapshotIndex}`;
    const snapshotData = await localforage.getItem<string>(snapshotKey);
    if (snapshotData) {
      await localforage.setItem(DATA_KEY, snapshotData);
      memoryCache[DATA_KEY] = snapshotData;
      return true;
    }
    return false;
  },

  async listSnapshots(): Promise<{ index: number; timestamp: number | null; size: number }[]> {
    const result: { index: number; timestamp: number | null; size: number }[] = [];
    for (let i = 1; i <= 5; i++) {
      const key = `${SNAPSHOT_PREFIX}${i}`;
      const data = memoryCache[key] || await localforage.getItem<string>(key);
      if (data) {
        let ts: number | null = null;
        try {
          const parsed = JSON.parse(data);
          ts = parsed._snapshotAt || null;
        } catch {}
        result.push({ index: i, timestamp: ts, size: data.length });
      }
    }
    return result;
  },

  async resetAll() {
    try {
      await localforage.clear();
      await localforage.dropInstance({ name: 'ModelVault' });
    } catch (e) { console.warn(e); }
    localStorage.clear();
    Object.keys(memoryCache).forEach((key) => delete memoryCache[key]);
    localUrlCache.forEach(val => URL.revokeObjectURL(val.url));
    localUrlCache.clear();
    isInit = false;
    lastSnapshotAt = 0;
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

  // 🌟 所有 Getter / Setter 保持原样（略去重复的大量样板代码，直接使用）
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
  getCustomWakeupSound: () => memoryCache[KEYS.CUSTOM_WAKEUP_SOUND] || '',
  getRawDailyQuests: () => { try { return JSON.parse(memoryCache[KEYS.DAILY_QUESTS] || 'null'); } catch { return null; } },
  getUnlockedBots: (): string[] => { try { return JSON.parse(memoryCache[KEYS.UNLOCKED_BOTS] || '["tu"]'); } catch { return ['tu']; } },
  getCurrentBot: (): string => memoryCache[KEYS.CURRENT_BOT] || 'tu',

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
  setCustomWakeupSound: (val: string) => StorageManager._set(KEYS.CUSTOM_WAKEUP_SOUND, val),
  _setDailyQuests: (val: string) => StorageManager._set(KEYS.DAILY_QUESTS, val),
  setUnlockedBots: (val: string[]) => StorageManager._set(KEYS.UNLOCKED_BOTS, JSON.stringify(val)),
  setCurrentBot: (val: string) => StorageManager._set(KEYS.CURRENT_BOT, val),

  exportAll: () => {
    const data: any = { version: CURRENT_SCHEMA_VERSION, exportDate: new Date().toISOString(), coreData: memoryCache[DATA_KEY] || null };
    Object.keys(memoryCache).forEach((key) => {
      if (key.startsWith('mv_') || key === 'modelvault_sessions' || key === 'modelvault_achievements') data[key] = memoryCache[key];
    });
    return data;
  },

  importAll: async (data: any) => {
    if (!data || !data.coreData) return false;
    try {
      await localforage.clear();
      Object.keys(memoryCache).forEach((key) => delete memoryCache[key]);
      localUrlCache.forEach(val => URL.revokeObjectURL(val.url));
      localUrlCache.clear();

      if (typeof data.coreData === 'string') await localforage.setItem(DATA_KEY, data.coreData);
      else await localforage.setItem(DATA_KEY, JSON.stringify(data.coreData));

      for (const key of Object.keys(data)) {
        if (key !== 'version' && key !== 'exportDate' && key !== 'coreData') {
          const val = data[key];
          if (val !== undefined && val !== null && typeof val === 'string') {
            await localforage.setItem(key, val);
          }
        }
      }

      isInit = false;
      await StorageManager.init();
      return true;
    } catch (e) { return false; }
  },

  getStorageUsage: () => {
    let total = 0;
    for (const x in memoryCache) {
      const val = memoryCache[x];
      if (val) total += val.length * 2;
    }
    return (total / 1024 / 1024).toFixed(2);
  },
};