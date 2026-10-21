import { StorageManager } from './StorageManager';
import { ModelManager } from './ModelManager';

export interface Achievement {
  id: string;
  nameKey: string;
  descKey: string;
  checkCondition: () => boolean;
}

const ACHIEVEMENT_LIBRARY: Achievement[] = [
  { 
    id: 'first_build', nameKey: 'ach_first_name', descKey: 'ach_first_desc', 
    checkCondition: () => ModelManager.getModelStats().total >= 1 
  },
  { 
    id: 'builder_10', nameKey: 'ach_10_name', descKey: 'ach_10_desc', 
    checkCondition: () => ModelManager.getModelStats().total >= 10 
  },
  { 
    id: 'builder_25', nameKey: 'ach_25_name', descKey: 'ach_25_desc', 
    checkCondition: () => ModelManager.getModelStats().total >= 25 
  },
  { 
    id: 'time_10h', nameKey: 'ach_10h_name', descKey: 'ach_10h_desc', 
    checkCondition: () => ModelManager.getTimeStats().totalSeconds >= 10 * 3600 
  },
  { 
    id: 'time_50h', nameKey: 'ach_50h_name', descKey: 'ach_50h_desc', 
    checkCondition: () => ModelManager.getTimeStats().totalSeconds >= 50 * 3600 
  },
  { 
    id: 'speedrun_hg', nameKey: 'ach_speed_name', descKey: 'ach_speed_desc', 
    checkCondition: () => ModelManager.hasSpeedrunHG() 
  },
  { 
    id: 'photo_1', nameKey: 'ach_photo_name', descKey: 'ach_photo_desc', 
    checkCondition: () => {
      const models = ModelManager.getAllModels();
      return models.some(m => m.tasks.some(t => t.stages.some(s => s.photoUrl)));
    } 
  }
];

export class AchievementManager {
  static getEarnedIds(): string[] {
    const data = StorageManager.getAchievements();
    return data ? JSON.parse(data) : [];
  }

  // 校验所有成就，返回新解锁的成就列表
  static checkAll(): Achievement[] {
    const earned = this.getEarnedIds();
    const newlyEarned: Achievement[] = [];

    ACHIEVEMENT_LIBRARY.forEach(ach => {
      if (!earned.includes(ach.id)) {
        if (ach.checkCondition()) {
          earned.push(ach.id);
          newlyEarned.push(ach);
        }
      }
    });

    if (newlyEarned.length > 0) {
      StorageManager.setAchievements(JSON.stringify(earned));
    }
    return newlyEarned;
  }

  // 兼容旧调用，手动解锁
  static unlock(id: string): boolean {
    const earned = this.getEarnedIds();
    if (earned.includes(id)) return false;
    earned.push(id);
    StorageManager.setAchievements(JSON.stringify(earned));
    return true;
  }

  static getEarnedList(): Achievement[] {
    const earnedIds = this.getEarnedIds();
    return ACHIEVEMENT_LIBRARY.filter(a => earnedIds.includes(a.id));
  }
}