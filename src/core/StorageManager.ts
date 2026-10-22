import localforage from 'localforage';

// ============================================================================
// 🌟 版本控制与数据迁移核心
// 每次修改底层数据结构（如新增字段），只需把版本号 +1，并在 init 中写上迁移逻辑即可
// ============================================================================
const CURRENT_SCHEMA_VERSION = 2; 
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

// 内存缓存，保证所有读写操作是同步且即时的，不卡顿 UI
const memoryCache: Record<string, string> = {};
let isInit = false;

export const StorageManager = {
  /**
   * 初始化存储并执行数据迁移
   */
  async init() {
    if (isInit) return;
    await localforage.config({ name: 'ModelVault', storeName: 'modelvault_store' });

    // 1. 兼容极老版本的 LocalStorage 数据（平滑迁移到 IndexedDB）
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

    // 2. 从 IndexedDB 加载数据到内存
    const keys = await localforage.keys();
    for (const key of keys) {
      const val = await localforage.getItem<string>(key);
      if (val !== null) memoryCache[key] = val;
    }

    // 3. 执行核心数据迁移引擎
    try {
      const rawData = memoryCache[DATA_KEY];
      if (rawData) {
        const parsed = JSON.parse(rawData);
        const storedVersion = parsed.schemaVersion || 1;
        
        if (storedVersion < CURRENT_SCHEMA_VERSION) {
          console.log(`🔄 检测到旧数据 (v${storedVersion})，正在迁移至最新版本 (v${CURRENT_SCHEMA_VERSION})...`);
          
          // 在迁移前，悄悄备份一份原始数据，防止意外
          await localforage.setItem('modelvault_backup_before_migration', rawData);

          let migratedModels = parsed.models || [];

          // ==========================================
          // 🚀 具体的迁移逻辑 (从 v1 升到 v2 举例)
          // ==========================================
          if (storedVersion < 2) {
            // 给所有旧模型补上 v2 新增的字段（例如 customTags 和 isArchived）
            migratedModels = migratedModels.map((m: any) => ({
              ...m,
              customTags: m.customTags || [], 
              isArchived: m.isArchived ?? false,
            }));
          }

          // 如果未来有 v2 -> v3 的改动，在这里继续加 if (storedVersion < 3) { ... }

          // 保存迁移后的数据
          const newData = { schemaVersion: CURRENT_SCHEMA_VERSION, models: migratedModels };
          memoryCache[DATA_KEY] = JSON.stringify(newData);
          await localforage.setItem(DATA_KEY, JSON.stringify(newData));
          
          console.log('✅ 数据迁移成功！');
        }
      }
    } catch (e) {
      console.error('❌ 数据迁移失败:', e);
      alert('数据升级遇到问题，但您的旧数据已安全备份。请联系开发者修复。');
    }

    isInit = true;
  },

  /**
   * 内部写入方法，带防爆仓保护
   */
  async _set(key: string, val: string) {
    memoryCache[key] = val;
    try {
      await localforage.setItem(key, val);
    } catch (err) {
      console.error('Storage save failed', err);
      alert('本地存储空间已满，请前往个人页导出备份，并清理部分图片。');
    }
  },

  /**
   * 彻底重置所有数据（危险操作）
   */
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

  /**
   * 读取核心模型数据（带类型防御）
   */
  getRawStorage(): { schemaVersion: number; models: any[] } {
    const raw = memoryCache[DATA_KEY];
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return {
          schemaVersion: parsed.schemaVersion || CURRENT_SCHEMA_VERSION,
          models: Array.isArray(parsed.models) ? parsed.models : []
        };
      } catch (e) {
        return { schemaVersion: CURRENT_SCHEMA_VERSION, models: [] };
      }
    }
    return { schemaVersion: CURRENT_SCHEMA_VERSION, models: [] };
  },

  /**
   * 保存核心模型数据
   */
  saveRawStorage(models: any[]) {
    const current = StorageManager.getRawStorage();
    StorageManager._set(DATA_KEY, JSON.stringify({ ...current, models }));
  },

  // ============================================================================
  // Getter 方法（全部带上兜底默认值，防止解析失败导致白屏）
  // ============================================================================
  getSessions: () => memoryCache[KEYS.SESSIONS] || '[]',
  getAchievements: () => memoryCache[KEYS.ACHIEVEMENTS] || '[]',
  getUsername: () => memoryCache[KEYS.USERNAME] || 'New Builder',
  getTimeboxTarget: () => Number(memoryCache[KEYS.TIMEBOX_TARGET]) || 0,
  getTimeboxElapsed: () => Number(memoryCache[KEYS.TIMEBOX_ELAPSED]) || 0,
  getCoinsBalance: () => Number(memoryCache[KEYS.COINS_BALANCE]) || 0,
  getCoinsTotalEarned: () => Number(memoryCache[KEYS.COINS_TOTAL_EARNED]) || 0,
  getEquippedTitle: () => memoryCache[KEYS.EQUIPPED_TITLE] || '',
  getEarnedTitles: () => {
    try { return JSON.parse(memoryCache[KEYS.EARNED_TITLES] || '[]'); } catch { return []; }
  },
  getAudioSettings: () => {
    const stored = memoryCache[KEYS.AUDIO_SETTINGS];
    const defaults = JSON.parse(DEFAULT_AUDIO);
    if (!stored) return defaults;
    try { return { ...defaults, ...JSON.parse(stored) }; } catch { return defaults; }
  },
  getCustomAudios: () => {
    try { return JSON.parse(memoryCache[KEYS.CUSTOM_AUDIOS] || '{}'); } catch { return {}; }
  },
  getBgMain: () => memoryCache[KEYS.BG_IMAGE_MAIN] || '',
  getBgPip: () => memoryCache[KEYS.BG_IMAGE_PIP] || '',
  getBgSize: () => memoryCache[KEYS.BG_SIZE] || 'cover',
  getBgPosition: () => memoryCache[KEYS.BG_POSITION] || 'center',
  getLegacyXP: () => Number(memoryCache[KEYS.LEGACY_XP]) || 0,
  getReminderInterval: () => Number(memoryCache[KEYS.REMINDER_INTERVAL]) || 0,

  // ============================================================================
  // Setter 方法
  // ============================================================================
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

  // ============================================================================
  // 导出 / 导入 与 合并逻辑
  // ============================================================================
  exportAll: () => {
    const data: any = { version: CURRENT_SCHEMA_VERSION, coreData: memoryCache[DATA_KEY] || null };
    Object.entries(KEYS).forEach(([key, storageKey]) => {
      data[key.toLowerCase()] = memoryCache[storageKey] || null;
    });
    return data;
  },

  importAll(data: any) {
    if (!data || !data.version) return false;
    
    try {
      // 1. 合并核心模型数据
      const coreDataRaw = data.coreData;
      if (coreDataRaw) {
        const importedCore = typeof coreDataRaw === 'string' ? JSON.parse(coreDataRaw) : coreDataRaw;
        if (importedCore && Array.isArray(importedCore.models)) {
          
          const localCore = StorageManager.getRawStorage();
          const localModels = localCore && Array.isArray(localCore.models) ? localCore.models : [];
          
          const localModelIds = new Set<string>();
          for (const m of localModels) {
            if (m && m.id) localModelIds.add(m.id);
          }
          
          const mergedModels = [...localModels];
          for (const importedModel of importedCore.models) {
            if (importedModel && importedModel.id && !localModelIds.has(importedModel.id)) {
              // 给导入的旧模型补充 v2 新增的默认字段（兜底兼容）
              mergedModels.push({
                ...importedModel,
                customTags: importedModel.customTags || [],
                isArchived: importedModel.isArchived ?? false,
              });
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