import { StorageManager } from './StorageManager';
import { ModelManager } from './ModelManager';
// 🌟 删除了未使用的 AchievementManager 导入

export interface TitleDef {
  id: string;
  nameKey: string;
  descKey: string;
  cost: number;
  color: string;
  requiredLevel: number;
  checkCondition: () => boolean;
}

// 等级阈值 (总XP)
const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 18000, 25000, 35000, 50000, 70000, 100000];

// 颜色等级
const TIER_GREEN = '#10b981';
const TIER_BLUE = '#3b82f6';
const TIER_PURPLE = '#8b5cf6';
const TIER_GOLD = '#f59e0b';
const TIER_RED = '#ef4444';

export class UserManager {
  static addCoins(amount: number) {
    const balance = StorageManager.getCoinsBalance() + amount;
    const total = StorageManager.getCoinsTotalEarned() + amount;
    StorageManager.setCoinsBalance(balance);
    StorageManager.setCoinsTotalEarned(total);
  }

  static getLevel(totalXp: number): number {
    let level = 1;
    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
      if (totalXp >= LEVEL_THRESHOLDS[i]) {
        level = i + 1;
      } else {
        break;
      }
    }
    return level;
  }

  static getLevelProgress(totalXp: number): { current: number; next: number; percent: number } {
    const level = this.getLevel(totalXp);
    if (level >= LEVEL_THRESHOLDS.length) return { current: totalXp, next: totalXp, percent: 100 };
    const currentThreshold = LEVEL_THRESHOLDS[level - 1];
    const nextThreshold = LEVEL_THRESHOLDS[level];
    const current = totalXp - currentThreshold;
    const needed = nextThreshold - currentThreshold;
    return { current, next: needed, percent: (current / needed) * 100 };
  }

  static getTitleLibrary(): TitleDef[] {
    const modelStats = ModelManager.getModelStats();
    const timeStats = ModelManager.getTimeStats();
    const checkinStreak = StorageManager.getCheckinStreak();

    return [
      // 等级解锁称号
      { id: 'lv1_newbie', nameKey: 'title_lv1_name', descKey: 'title_lv1_desc', cost: 0, color: TIER_GREEN, requiredLevel: 1, checkCondition: () => true },
      { id: 'lv5_apprentice', nameKey: 'title_lv5_name', descKey: 'title_lv5_desc', cost: 100, color: TIER_GREEN, requiredLevel: 5, checkCondition: () => true },
      { id: 'lv10_adept', nameKey: 'title_lv10_name', descKey: 'title_lv10_desc', cost: 300, color: TIER_BLUE, requiredLevel: 10, checkCondition: () => true },
      { id: 'lv20_veteran', nameKey: 'title_lv20_name', descKey: 'title_lv20_desc', cost: 1000, color: TIER_PURPLE, requiredLevel: 20, checkCondition: () => true },
      { id: 'lv30_master', nameKey: 'title_lv30_name', descKey: 'title_lv30_desc', cost: 5000, color: TIER_GOLD, requiredLevel: 30, checkCondition: () => true },
      { id: 'lv50_legend', nameKey: 'title_lv50_name', descKey: 'title_lv50_desc', cost: 20000, color: TIER_RED, requiredLevel: 50, checkCondition: () => true },
      
      // 模型数量解锁称号
      { id: 'model_1', nameKey: 'title_model_1_name', descKey: 'title_model_1_desc', cost: 0, color: TIER_GREEN, requiredLevel: 1, checkCondition: () => modelStats.total >= 1 },
      { id: 'model_5', nameKey: 'title_model_5_name', descKey: 'title_model_5_desc', cost: 100, color: TIER_GREEN, requiredLevel: 3, checkCondition: () => modelStats.total >= 5 },
      { id: 'model_10', nameKey: 'title_model_10_name', descKey: 'title_model_10_desc', cost: 300, color: TIER_BLUE, requiredLevel: 5, checkCondition: () => modelStats.total >= 10 },
      { id: 'model_25', nameKey: 'title_model_25_name', descKey: 'title_model_25_desc', cost: 1000, color: TIER_PURPLE, requiredLevel: 10, checkCondition: () => modelStats.total >= 25 },
      { id: 'model_50', nameKey: 'title_model_50_name', descKey: 'title_model_50_desc', cost: 5000, color: TIER_GOLD, requiredLevel: 20, checkCondition: () => modelStats.total >= 50 },
      { id: 'model_100', nameKey: 'title_model_100_name', descKey: 'title_model_100_desc', cost: 20000, color: TIER_RED, requiredLevel: 30, checkCondition: () => modelStats.total >= 100 },

      // 累计时长解锁称号
      { id: 'time_10h', nameKey: 'title_time_10h_name', descKey: 'title_time_10h_desc', cost: 200, color: TIER_GREEN, requiredLevel: 3, checkCondition: () => timeStats.totalSeconds >= 36000 },
      { id: 'time_50h', nameKey: 'title_time_50h_name', descKey: 'title_time_50h_desc', cost: 800, color: TIER_BLUE, requiredLevel: 8, checkCondition: () => timeStats.totalSeconds >= 180000 },
      { id: 'time_200h', nameKey: 'title_time_200h_name', descKey: 'title_time_200h_desc', cost: 3000, color: TIER_PURPLE, requiredLevel: 15, checkCondition: () => timeStats.totalSeconds >= 720000 },
      { id: 'time_1000h', nameKey: 'title_time_1000h_name', descKey: 'title_time_1000h_desc', cost: 15000, color: TIER_GOLD, requiredLevel: 25, checkCondition: () => timeStats.totalSeconds >= 3600000 },

      // 连续打卡解锁称号
      { id: 'streak_3', nameKey: 'title_streak_3_name', descKey: 'title_streak_3_desc', cost: 50, color: TIER_GREEN, requiredLevel: 2, checkCondition: () => checkinStreak >= 3 },
      { id: 'streak_7', nameKey: 'title_streak_7_name', descKey: 'title_streak_7_desc', cost: 200, color: TIER_BLUE, requiredLevel: 5, checkCondition: () => checkinStreak >= 7 },
      { id: 'streak_30', nameKey: 'title_streak_30_name', descKey: 'title_streak_30_desc', cost: 2000, color: TIER_PURPLE, requiredLevel: 15, checkCondition: () => checkinStreak >= 30 },

      // 特定成就解锁称号
      { id: 'ach_assembly_master', nameKey: 'title_ach_assembly_master_name', descKey: 'title_ach_assembly_master_desc', cost: 2000, color: TIER_PURPLE, requiredLevel: 10, checkCondition: () => (timeStats.stageTime['stage_assembly'] || 0) >= 50 * 3600 },
      { id: 'ach_lining_king', nameKey: 'title_ach_lining_king_name', descKey: 'title_ach_lining_king_desc', cost: 1000, color: TIER_BLUE, requiredLevel: 8, checkCondition: () => (timeStats.stageTime['stage_lining'] || 0) >= 10 * 3600 },
      { id: 'ach_mg_lover', nameKey: 'title_ach_mg_lover_name', descKey: 'title_ach_mg_lover_desc', cost: 1500, color: TIER_BLUE, requiredLevel: 10, checkCondition: () => modelStats['MG'] >= 3 },
      { id: 'ach_pg_master', nameKey: 'title_ach_pg_master_name', descKey: 'title_ach_pg_master_desc', cost: 5000, color: TIER_GOLD, requiredLevel: 20, checkCondition: () => modelStats['PG'] >= 1 },
    ];
  }

  static buyTitle(titleId: string): { success: boolean; error?: string } {
    const title = this.getTitleLibrary().find(t => t.id === titleId);
    if (!title) return { success: false, error: 'title_not_found' };

    const totalXp = ModelManager.getTotalXP();
    const currentLevel = this.getLevel(totalXp);
    if (currentLevel < title.requiredLevel) {
      return { success: false, error: 'level_too_low' };
    }

    const balance = StorageManager.getCoinsBalance();
    if (balance < title.cost) return { success: false, error: 'not_enough_coins' };

    if (!title.checkCondition()) return { success: false, error: 'condition_not_met' };

    StorageManager.setCoinsBalance(balance - title.cost);
    const earned = StorageManager.getEarnedTitles();
    if (!earned.includes(titleId)) {
      earned.push(titleId);
      StorageManager.setEarnedTitles(earned);
    }
    return { success: true };
  }
}