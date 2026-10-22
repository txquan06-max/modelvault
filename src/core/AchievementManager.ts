import { StorageManager } from './StorageManager';
import { ModelManager } from './ModelManager';
import { SessionManager } from './SessionManager'; // 🌟 补上导入

export interface Achievement {
  id: string;
  nameKey: string;
  descKey: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  checkCondition: () => boolean;
}

const ACHIEVEMENT_LIBRARY: Achievement[] = [
  // ==================== 里程碑 (模型数量) ====================
  { id: 'build_1', nameKey: 'ach_build_1_name', descKey: 'ach_build_1_desc', rarity: 'common', checkCondition: () => ModelManager.getModelStats().total >= 1 },
  { id: 'build_5', nameKey: 'ach_build_5_name', descKey: 'ach_build_5_desc', rarity: 'uncommon', checkCondition: () => ModelManager.getModelStats().total >= 5 },
  { id: 'build_10', nameKey: 'ach_build_10_name', descKey: 'ach_build_10_desc', rarity: 'uncommon', checkCondition: () => ModelManager.getModelStats().total >= 10 },
  { id: 'build_25', nameKey: 'ach_build_25_name', descKey: 'ach_build_25_desc', rarity: 'rare', checkCondition: () => ModelManager.getModelStats().total >= 25 },
  { id: 'build_50', nameKey: 'ach_build_50_name', descKey: 'ach_build_50_desc', rarity: 'epic', checkCondition: () => ModelManager.getModelStats().total >= 50 },
  { id: 'build_100', nameKey: 'ach_build_100_name', descKey: 'ach_build_100_desc', rarity: 'legendary', checkCondition: () => ModelManager.getModelStats().total >= 100 },

  // ==================== 里程碑 (累计时长) ====================
  { id: 'time_1h', nameKey: 'ach_time_1h_name', descKey: 'ach_time_1h_desc', rarity: 'common', checkCondition: () => ModelManager.getTimeStats().totalSeconds >= 3600 },
  { id: 'time_10h', nameKey: 'ach_time_10h_name', descKey: 'ach_time_10h_desc', rarity: 'uncommon', checkCondition: () => ModelManager.getTimeStats().totalSeconds >= 36000 },
  { id: 'time_50h', nameKey: 'ach_time_50h_name', descKey: 'ach_time_50h_desc', rarity: 'rare', checkCondition: () => ModelManager.getTimeStats().totalSeconds >= 180000 },
  { id: 'time_100h', nameKey: 'ach_time_100h_name', descKey: 'ach_time_100h_desc', rarity: 'epic', checkCondition: () => ModelManager.getTimeStats().totalSeconds >= 360000 },
  { id: 'time_500h', nameKey: 'ach_time_500h_name', descKey: 'ach_time_500h_desc', rarity: 'legendary', checkCondition: () => ModelManager.getTimeStats().totalSeconds >= 1800000 },
  { id: 'time_1000h', nameKey: 'ach_time_1000h_name', descKey: 'ach_time_1000h_desc', rarity: 'legendary', checkCondition: () => ModelManager.getTimeStats().totalSeconds >= 3600000 },

  // ==================== 技巧/挑战 ====================
  { id: 'single_2h', nameKey: 'ach_single_2h_name', descKey: 'ach_single_2h_desc', rarity: 'uncommon', checkCondition: () => SessionManager.getAllSessions().some((s: any) => s.activeSeconds >= 7200) },
  { id: 'single_5h', nameKey: 'ach_single_5h_name', descKey: 'ach_single_5h_desc', rarity: 'rare', checkCondition: () => SessionManager.getAllSessions().some((s: any) => s.activeSeconds >= 18000) },
  { id: 'speedrun_hg', nameKey: 'ach_speedrun_hg_name', descKey: 'ach_speedrun_hg_desc', rarity: 'rare', checkCondition: () => ModelManager.hasSpeedrunHG() },
  { id: 'photo_1', nameKey: 'ach_photo_1_name', descKey: 'ach_photo_1_desc', rarity: 'common', checkCondition: () => ModelManager.getAllModels().some(m => m.tasks.some(t => t.stages.some(s => s.photoUrl))) },
  { id: 'photo_10', nameKey: 'ach_photo_10_name', descKey: 'ach_photo_10_desc', rarity: 'uncommon', checkCondition: () => ModelManager.getAllModels().reduce((sum, m) => sum + m.tasks.reduce((sSum, t) => sSum + t.stages.filter(s => s.photoUrl).length, 0), 0) >= 10 },

  // ==================== 收集/系列 ====================
  { id: 'mg_lover', nameKey: 'ach_mg_lover_name', descKey: 'ach_mg_lover_desc', rarity: 'uncommon', checkCondition: () => ModelManager.getModelStats()['MG'] >= 3 },
  { id: 'pg_master', nameKey: 'ach_pg_master_name', descKey: 'ach_pg_master_desc', rarity: 'rare', checkCondition: () => ModelManager.getModelStats()['PG'] >= 1 },
  { id: 'grade_rg_5', nameKey: 'ach_grade_rg_5_name', descKey: 'ach_grade_rg_5_desc', rarity: 'rare', checkCondition: () => ModelManager.getModelStats()['RG'] >= 5 },

  // ==================== 连续打卡 ====================
  { id: 'streak_3', nameKey: 'ach_streak_3_name', descKey: 'ach_streak_3_desc', rarity: 'common', checkCondition: () => StorageManager.getCheckinStreak() >= 3 },
  { id: 'streak_7', nameKey: 'ach_streak_7_name', descKey: 'ach_streak_7_desc', rarity: 'uncommon', checkCondition: () => StorageManager.getCheckinStreak() >= 7 },
  { id: 'streak_30', nameKey: 'ach_streak_30_name', descKey: 'ach_streak_30_desc', rarity: 'rare', checkCondition: () => StorageManager.getCheckinStreak() >= 30 },
  { id: 'streak_100', nameKey: 'ach_streak_100_name', descKey: 'ach_streak_100_desc', rarity: 'legendary', checkCondition: () => StorageManager.getCheckinStreak() >= 100 },

  // ==================== 隐藏/趣味 ====================
  { id: 'night_owl', nameKey: 'ach_night_owl_name', descKey: 'ach_night_owl_desc', rarity: 'rare', checkCondition: () => SessionManager.getAllSessions().some((s: any) => { const h = new Date(s.startedAt).getHours(); return h >= 0 && h < 5; }) },
  { id: 'early_bird', nameKey: 'ach_early_bird_name', descKey: 'ach_early_bird_desc', rarity: 'rare', checkCondition: () => SessionManager.getAllSessions().some((s: any) => { const h = new Date(s.startedAt).getHours(); return h >= 5 && h < 8; }) },
  { id: 'legacy_1', nameKey: 'ach_legacy_1_name', descKey: 'ach_legacy_1_desc', rarity: 'common', checkCondition: () => ModelManager.getAllModels().some(m => m.isImported) },
  { id: 'coins_1000', nameKey: 'ach_coins_1000_name', descKey: 'ach_coins_1000_desc', rarity: 'uncommon', checkCondition: () => StorageManager.getCoinsBalance() >= 1000 },
  { id: 'coins_5000', nameKey: 'ach_coins_5000_name', descKey: 'ach_coins_5000_desc', rarity: 'rare', checkCondition: () => StorageManager.getCoinsBalance() >= 5000 },
];

export class AchievementManager {
  static getEarnedIds(): string[] {
    const data = StorageManager.getAchievements();
    return data ? JSON.parse(data) : [];
  }

  static checkAll(): Achievement[] {
    const earned = this.getEarnedIds();
    const newlyEarned: Achievement[] = [];

    ACHIEVEMENT_LIBRARY.forEach(ach => {
      if (!earned.includes(ach.id) && ach.checkCondition()) {
        earned.push(ach.id);
        newlyEarned.push(ach);
      }
    });

    if (newlyEarned.length > 0) {
      StorageManager.setAchievements(JSON.stringify(earned));
    }
    return newlyEarned;
  }

  static getEarnedList(): Achievement[] {
    const earnedIds = this.getEarnedIds();
    return ACHIEVEMENT_LIBRARY.filter(a => earnedIds.includes(a.id));
  }
}